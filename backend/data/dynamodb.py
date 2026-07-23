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
    "meditation_ratings": "meditation-ratings",
    "user_feedback": "user-feedback",
    "ai_prayers": "ai-prayers",
    "payment_transactions": "payment-transactions",
    "usage_events": "usage-events",
    "usage_daily": "usage-daily",
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

    async def get_user_by_cognito_sub(self, cognito_sub: str) -> Optional[dict]:
        if not cognito_sub:
            return None

        def _get():
            try:
                resp = self._table("users").query(
                    IndexName="cognito-sub-index",
                    KeyConditionExpression="cognito_sub = :sub",
                    ExpressionAttributeValues={":sub": cognito_sub},
                    Limit=1,
                )
                items = resp.get("Items", [])
                return _from_dynamo(items[0]) if items else None
            except Exception:
                return None

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

    # --- Meditation session ratings (per user, per practice) ---
    async def insert_meditation_rating(self, entry: dict) -> dict:
        """
        Persist a 1–5 star rating for a completed meditation session.

        Keys: user_id (hash), sk = created_at#id (range) — same pattern as mood/journal
        so every rating is stored per user and queryable newest-first.
        """
        item = {
            "user_id": entry["user_id"],
            "sk": _sort_key(entry["created_at"], entry["id"]),
            **_to_dynamo({k: v for k, v in entry.items() if k not in ("user_id",)}),
        }

        def _put():
            self._table("meditation_ratings").put_item(Item=item)

        await _run(_put)
        return entry

    async def list_meditation_ratings(self, user_id: str, limit: int = 200) -> list[dict]:
        def _query():
            resp = self._table("meditation_ratings").query(
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

    # --- User product feedback (Me tab; durable free-text) ---
    async def insert_user_feedback(self, entry: dict) -> dict:
        """
        Store intentional product feedback per user.
        Separate from usage-events so free-text is durable and not mixed with
        high-volume behavioral analytics (which use 90-day TTL).
        """
        item = {
            "user_id": entry["user_id"],
            "sk": _sort_key(entry["created_at"], entry["id"]),
            **_to_dynamo({k: v for k, v in entry.items() if k not in ("user_id",)}),
        }

        def _put():
            self._table("user_feedback").put_item(Item=item)

        await _run(_put)
        return entry

    async def list_user_feedback(self, user_id: str, limit: int = 50) -> list[dict]:
        def _query():
            resp = self._table("user_feedback").query(
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

    # --- Usage analytics (product monitoring for analysis) ---
    # Retention: 90 days via DynamoDB TTL
    USAGE_TTL_DAYS = 90

    async def put_usage_events(
        self,
        user_id: str,
        events: list[dict],
        platform: str = "unknown",
        session_id: str | None = None,
    ) -> dict:
        """
        Persist product usage events + daily rollups.
        events: [{name, props?, ts?}, ...]
        """
        import uuid as _uuid

        if not events:
            return {"accepted": 0}

        now = datetime.now(timezone.utc)
        ttl_base = int(now.timestamp()) + self.USAGE_TTL_DAYS * 86400
        accepted = 0
        table_events = self._table("usage_events")
        table_daily = self._table("usage_daily")

        def _write_one(ev: dict) -> bool:
            name = str(ev.get("name") or "").strip()[:64]
            if not name:
                return False
            ts_raw = ev.get("ts") or now.isoformat()
            try:
                # normalize
                if isinstance(ts_raw, (int, float)):
                    ts_dt = datetime.fromtimestamp(float(ts_raw), tz=timezone.utc)
                else:
                    ts_dt = datetime.fromisoformat(str(ts_raw).replace("Z", "+00:00"))
                    if ts_dt.tzinfo is None:
                        ts_dt = ts_dt.replace(tzinfo=timezone.utc)
            except Exception:
                ts_dt = now
            ts_iso = ts_dt.astimezone(timezone.utc).isoformat()
            day = ts_dt.astimezone(timezone.utc).strftime("%Y-%m-%d")
            event_id = str(ev.get("id") or _uuid.uuid4())[:40]
            sk = f"{ts_iso}#{event_id}"
            props = ev.get("props") if isinstance(ev.get("props"), dict) else {}
            # stringify props values for Dynamo simplicity
            clean_props: dict[str, Any] = {}
            for k, v in list(props.items())[:30]:
                key = str(k)[:40]
                if v is None or isinstance(v, (str, int, float, bool)):
                    clean_props[key] = v if not isinstance(v, float) else Decimal(str(v))
                else:
                    clean_props[key] = str(v)[:200]

            item = {
                "user_id": user_id[:80],
                "sk": sk,
                "event_id": event_id,
                "event_name": name,
                "day": day,
                "ts": ts_iso,
                "platform": (platform or "unknown")[:32],
                "session_id": (session_id or "")[:64] or None,
                "props": clean_props or None,
                "ttl": Decimal(str(ttl_base)),
            }
            table_events.put_item(Item=_to_dynamo(item))

            # Daily event counter
            table_daily.update_item(
                Key={"day": day, "sk": f"event#{name}"},
                UpdateExpression="ADD #c :one SET event_name = :n",
                ExpressionAttributeNames={"#c": "count"},
                ExpressionAttributeValues={
                    ":one": Decimal("1"),
                    ":n": name,
                },
            )
            # Unique user presence for the day (first event only)
            try:
                table_daily.put_item(
                    Item=_to_dynamo(
                        {
                            "day": day,
                            "sk": f"user#{user_id[:80]}",
                            "user_id": user_id[:80],
                            "first_ts": ts_iso,
                        }
                    ),
                    ConditionExpression="attribute_not_exists(sk)",
                )
                table_daily.update_item(
                    Key={"day": day, "sk": "meta#totals"},
                    UpdateExpression="ADD dau :one, events :e",
                    ExpressionAttributeValues={
                        ":one": Decimal("1"),
                        ":e": Decimal("1"),
                    },
                )
            except Exception:
                # already counted as DAU — still bump event total
                table_daily.update_item(
                    Key={"day": day, "sk": "meta#totals"},
                    UpdateExpression="ADD events :e",
                    ExpressionAttributeValues={":e": Decimal("1")},
                )
            return True

        def _batch():
            n = 0
            for ev in events[:100]:  # hard cap per request
                try:
                    if _write_one(ev):
                        n += 1
                except Exception as e:
                    logger.warning("usage_event_write_failed err=%s", e)
            return n

        accepted = await _run(_batch)
        return {"accepted": accepted}

    async def list_user_usage(self, user_id: str, limit: int = 50) -> list[dict]:
        def _query():
            resp = self._table("usage_events").query(
                KeyConditionExpression="user_id = :uid",
                ExpressionAttributeValues={":uid": user_id},
                ScanIndexForward=False,
                Limit=limit,
            )
            return [_from_dynamo(i) for i in resp.get("Items", [])]

        return await _run(_query)

    async def usage_summary_for_days(self, days: int = 7) -> dict:
        """Read daily rollups for the last N days (analysis dashboard)."""
        days = max(1, min(int(days), 90))
        from datetime import timedelta

        today = datetime.now(timezone.utc).date()
        day_list = [
            (today - timedelta(days=i)).isoformat() for i in range(days)
        ]

        def _load():
            out_days = []
            event_totals: dict[str, int] = {}
            total_events = 0
            total_dau = 0
            for day in day_list:
                resp = self._table("usage_daily").query(
                    KeyConditionExpression="#d = :d",
                    ExpressionAttributeNames={"#d": "day"},
                    ExpressionAttributeValues={":d": day},
                )
                items = [_from_dynamo(i) for i in resp.get("Items", [])]
                day_events: dict[str, int] = {}
                dau = 0
                ev_count = 0
                for it in items:
                    sk = it.get("sk") or ""
                    if sk.startswith("event#"):
                        name = sk.replace("event#", "", 1)
                        c = int(it.get("count") or 0)
                        day_events[name] = c
                        event_totals[name] = event_totals.get(name, 0) + c
                        ev_count += c
                    elif sk == "meta#totals":
                        dau = int(it.get("dau") or 0)
                        # prefer meta events if present
                        if it.get("events") is not None:
                            ev_count = int(it.get("events") or ev_count)
                total_events += ev_count
                total_dau += dau
                out_days.append(
                    {
                        "day": day,
                        "dau": dau,
                        "events": ev_count,
                        "by_event": day_events,
                    }
                )
            return {
                "days": out_days,
                "totals": {
                    "events": total_events,
                    "dau_sum": total_dau,  # sum of daily uniques (not unique across window)
                    "by_event": event_totals,
                },
            }

        return await _run(_load)


db = Database()