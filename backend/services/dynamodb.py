"""DynamoDB persistence layer for ChristCalm."""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone
from decimal import Decimal
from functools import partial
from typing import Any, Optional

import boto3

logger = logging.getLogger("christcalm.dynamodb")

TABLE_SUFFIXES = {
    "users": "users",
    "mood_logs": "mood-logs",
    "journal_entries": "journal-entries",
    "ai_prayers": "ai-prayers",
    "payment_transactions": "payment-transactions",
}


def _table_prefix() -> str:
    return os.environ.get("DYNAMODB_TABLE_PREFIX", "christcalm")


def _table_name(key: str) -> str:
    return f"{_table_prefix()}-{TABLE_SUFFIXES[key]}"


def _session():
    """AWS credential chain: IAM role (App Runner) → env vars → ~/.aws/credentials → SSO."""
    return boto3.Session(region_name=os.environ.get("AWS_REGION", "us-east-1"))


def _client():
    return _session().client("dynamodb")


def _resource():
    return _session().resource("dynamodb")


def _to_dynamo(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return Decimal(str(value))
    if isinstance(value, list):
        return [_to_dynamo(v) for v in value]
    if isinstance(value, dict):
        return {k: _to_dynamo(v) for k, v in value.items() if v is not None}
    return value


def _from_dynamo(item: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key, value in item.items():
        if isinstance(value, Decimal):
            out[key] = int(value) if value % 1 == 0 else float(value)
        elif isinstance(value, list):
            out[key] = [_from_dynamo(v) if isinstance(v, dict) else v for v in value]
        else:
            out[key] = value
    return out


def _sort_key(created_at: str, entry_id: str) -> str:
    return f"{created_at}#{entry_id}"


async def _run(fn, *args, **kwargs):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(fn, *args, **kwargs))


class Database:
    def __init__(self) -> None:
        self._resource = _resource()

    def _table(self, key: str):
        return self._resource.Table(_table_name(key))

    # --- Users ---
    async def get_user_by_id(self, user_id: str, include_password: bool = False) -> Optional[dict]:
        def _get():
            resp = self._table("users").get_item(Key={"id": user_id})
            item = resp.get("Item")
            if not item:
                return None
            user = _from_dynamo(item)
            if not include_password:
                user.pop("password_hash", None)
            return user

        return await _run(_get)

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        def _get():
            resp = self._table("users").query(
                IndexName="email-index",
                KeyConditionExpression="email = :email",
                ExpressionAttributeValues={":email": email},
                Limit=1,
            )
            items = resp.get("Items", [])
            return _from_dynamo(items[0]) if items else None

        return await _run(_get)

    async def create_user(self, user: dict) -> dict:
        item = _to_dynamo(user)

        def _put():
            self._table("users").put_item(
                Item=item,
                ConditionExpression="attribute_not_exists(id)",
            )

        await _run(_put)
        return user

    async def update_user(self, user_id: str, updates: dict) -> dict:
        updates = {k: v for k, v in updates.items() if v is not None}
        if not updates:
            return await self.get_user_by_id(user_id, include_password=True) or {}

        expr_names: dict[str, str] = {}
        expr_values: dict[str, Any] = {}
        set_parts: list[str] = []

        for i, (key, value) in enumerate(updates.items()):
            name = f"#k{i}"
            val = f":v{i}"
            expr_names[name] = key
            expr_values[val] = _to_dynamo(value)
            set_parts.append(f"{name} = {val}")

        def _update():
            return self._table("users").update_item(
                Key={"id": user_id},
                UpdateExpression="SET " + ", ".join(set_parts),
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values,
                ReturnValues="ALL_NEW",
            )

        resp = await _run(_update)
        if not resp or "Attributes" not in resp:
            # Fallback if ReturnValues missing (should not happen with ALL_NEW)
            return await self.get_user_by_id(user_id, include_password=True) or {}
        return _from_dynamo(resp["Attributes"])

    async def increment_user_stats(self, user_id: str, minutes: int) -> dict:
        now = datetime.now(timezone.utc).isoformat()

        def _update():
            resp = self._table("users").update_item(
                Key={"id": user_id},
                UpdateExpression=(
                    "ADD minutes_meditated :mins, prayers_completed :one "
                    "SET last_activity = :now"
                ),
                ExpressionAttributeValues={
                    ":mins": Decimal(str(minutes)),
                    ":one": Decimal("1"),
                    ":now": now,
                },
                ReturnValues="ALL_NEW",
            )
            return resp

        resp = await _run(_update)
        return _from_dynamo(resp["Attributes"])

    # --- Monthly AI quota (100 calls / user / calendar month UTC) ---
    @staticmethod
    def _quota_month() -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m")

    async def get_ai_quota(self, user_id: str, limit: int = 100) -> dict:
        """Read-only snapshot of monthly AI usage."""
        month = self._quota_month()
        user = await self.get_user_by_id(user_id) or {}
        used_month = user.get("ai_quota_month")
        used = int(user.get("ai_quota_used") or 0) if used_month == month else 0
        remaining = max(0, limit - used)
        return {
            "used": used,
            "limit": limit,
            "remaining": remaining,
            "month": month,
            "ok": remaining > 0,
        }

    async def consume_ai_quota(self, user_id: str, limit: int = 100) -> dict:
        """
        Atomically consume one AI call for the current UTC month.
        Returns {ok, used, limit, remaining, month}. ok=False when over limit.
        """
        from botocore.exceptions import ClientError

        month = self._quota_month()
        table = self._table("users")

        def _reset_month():
            """New month or first use: set used = 1."""
            try:
                resp = table.update_item(
                    Key={"id": user_id},
                    UpdateExpression="SET ai_quota_month = :m, ai_quota_used = :one",
                    ConditionExpression=(
                        "attribute_not_exists(ai_quota_month) OR ai_quota_month <> :m"
                    ),
                    ExpressionAttributeValues={
                        ":m": month,
                        ":one": Decimal("1"),
                    },
                    ReturnValues="ALL_NEW",
                )
                used = int(resp["Attributes"].get("ai_quota_used") or 1)
                return {
                    "ok": True,
                    "used": used,
                    "limit": limit,
                    "remaining": max(0, limit - used),
                    "month": month,
                }
            except ClientError as e:
                if e.response["Error"]["Code"] != "ConditionalCheckFailedException":
                    raise
                return None

        def _increment_same_month():
            try:
                resp = table.update_item(
                    Key={"id": user_id},
                    UpdateExpression="ADD ai_quota_used :one SET ai_quota_month = :m",
                    ConditionExpression=(
                        "ai_quota_month = :m AND "
                        "(attribute_not_exists(ai_quota_used) OR ai_quota_used < :lim)"
                    ),
                    ExpressionAttributeValues={
                        ":one": Decimal("1"),
                        ":m": month,
                        ":lim": Decimal(str(limit)),
                    },
                    ReturnValues="ALL_NEW",
                )
                used = int(resp["Attributes"].get("ai_quota_used") or 0)
                return {
                    "ok": True,
                    "used": used,
                    "limit": limit,
                    "remaining": max(0, limit - used),
                    "month": month,
                }
            except ClientError as e:
                if e.response["Error"]["Code"] != "ConditionalCheckFailedException":
                    raise
                return {
                    "ok": False,
                    "used": limit,
                    "limit": limit,
                    "remaining": 0,
                    "month": month,
                }

        def _consume():
            # Prefer reset when month rolled; if concurrent, fall through to increment
            result = _reset_month()
            if result is not None:
                return result
            return _increment_same_month()

        return await _run(_consume)

    # --- Mood logs ---
    async def insert_mood_log(self, entry: dict) -> dict:
        item = {
            "user_id": entry["user_id"],
            "sk": _sort_key(entry["created_at"], entry["id"]),
            **_to_dynamo({k: v for k, v in entry.items() if k not in ("user_id",)}),
        }

        def _put():
            self._table("mood_logs").put_item(Item=item)

        await _run(_put)
        return entry

    async def list_mood_logs(self, user_id: str, limit: int = 100) -> list[dict]:
        def _query():
            resp = self._table("mood_logs").query(
                KeyConditionExpression="user_id = :uid",
                ExpressionAttributeValues={":uid": user_id},
                ScanIndexForward=False,
                Limit=limit,
            )
            items = [_from_dynamo(i) for i in resp.get("Items", [])]
            for item in items:
                item.pop("sk", None)
            return items

        return await _run(_query)

    # --- Journal ---
    async def insert_journal_entry(self, entry: dict) -> dict:
        item = {
            "user_id": entry["user_id"],
            "sk": _sort_key(entry["created_at"], entry["id"]),
            **_to_dynamo({k: v for k, v in entry.items() if k not in ("user_id",)}),
        }

        def _put():
            self._table("journal_entries").put_item(Item=item)

        await _run(_put)
        return entry

    async def list_journal_entries(self, user_id: str, limit: int = 200) -> list[dict]:
        def _query():
            resp = self._table("journal_entries").query(
                KeyConditionExpression="user_id = :uid",
                ExpressionAttributeValues={":uid": user_id},
                ScanIndexForward=False,
                Limit=limit,
            )
            items = [_from_dynamo(i) for i in resp.get("Items", [])]
            for item in items:
                item.pop("sk", None)
            return items

        return await _run(_query)

    # --- AI prayers ---
    async def insert_ai_prayer(self, entry: dict) -> dict:
        item = {
            "user_id": entry["user_id"],
            "sk": _sort_key(entry["created_at"], entry["id"]),
            **_to_dynamo({k: v for k, v in entry.items() if k not in ("user_id",)}),
        }

        def _put():
            self._table("ai_prayers").put_item(Item=item)

        await _run(_put)
        return entry

    async def list_ai_prayers(self, user_id: str, limit: int = 50) -> list[dict]:
        def _query():
            resp = self._table("ai_prayers").query(
                KeyConditionExpression="user_id = :uid",
                ExpressionAttributeValues={":uid": user_id},
                ScanIndexForward=False,
                Limit=limit,
            )
            items = [_from_dynamo(i) for i in resp.get("Items", [])]
            for item in items:
                item.pop("sk", None)
            return items

        return await _run(_query)

    async def list_wisdom_turns(
        self, user_id: str, conversation_id: Optional[str] = None, limit: int = 40
    ) -> list[dict]:
        """Recent wisdom chat turns (optionally one conversation)."""

        def _query():
            resp = self._table("ai_prayers").query(
                KeyConditionExpression="user_id = :uid",
                ExpressionAttributeValues={":uid": user_id},
                ScanIndexForward=False,
                Limit=min(limit * 3, 120),
            )
            items = [_from_dynamo(i) for i in resp.get("Items", [])]
            out = []
            for item in items:
                item.pop("sk", None)
                if item.get("kind") != "wisdom":
                    continue
                if conversation_id and item.get("conversation_id") != conversation_id:
                    continue
                out.append(item)
                if len(out) >= limit:
                    break
            return out

        return await _run(_query)

    # --- Payments ---
    async def upsert_payment_transaction(self, session_id: str, data: dict) -> dict:
        item = _to_dynamo({"session_id": session_id, **data})

        def _put():
            self._table("payment_transactions").put_item(Item=item)

        await _run(_put)
        return {"session_id": session_id, **data}

    async def get_payment_transaction(self, session_id: str) -> Optional[dict]:
        def _get():
            resp = self._table("payment_transactions").get_item(Key={"session_id": session_id})
            item = resp.get("Item")
            return _from_dynamo(item) if item else None

        return await _run(_get)

    async def update_payment_transaction(self, session_id: str, updates: dict) -> dict:
        expr_names: dict[str, str] = {}
        expr_values: dict[str, Any] = {}
        set_parts: list[str] = []

        for i, (key, value) in enumerate(updates.items()):
            name = f"#k{i}"
            val = f":v{i}"
            expr_names[name] = key
            expr_values[val] = _to_dynamo(value)
            set_parts.append(f"{name} = {val}")

        def _update():
            resp = self._table("payment_transactions").update_item(
                Key={"session_id": session_id},
                UpdateExpression="SET " + ", ".join(set_parts),
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values,
                ReturnValues="ALL_NEW",
            )
            return resp

        resp = await _run(_update)
        return _from_dynamo(resp["Attributes"])


db = Database()