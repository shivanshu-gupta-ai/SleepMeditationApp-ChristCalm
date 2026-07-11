"""Voice note → text via Amazon S3 + Amazon Transcribe.

Flow:
1. Client requests presigned PUT URL
2. Client uploads audio (m4a / webm / wav / mp3)
3. Client calls transcribe with s3_key
4. Lambda starts Transcribe job, polls, returns transcript text
"""

from __future__ import annotations

import json
import logging
import os
import time
import uuid
from typing import Any, Optional
from urllib.request import urlopen

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger("christcalm.voice")

ALLOWED_FORMATS = {
    "m4a": "mp4",
    "mp4": "mp4",
    "mp3": "mp3",
    "wav": "wav",
    "webm": "webm",
    "ogg": "ogg",
    "flac": "flac",
    "amr": "amr",
}


class VoiceError(Exception):
    def __init__(self, message: str, status_code: int = 503):
        super().__init__(message)
        self.status_code = status_code


def _region() -> str:
    return (
        os.environ.get("AWS_REGION")
        or os.environ.get("AWS_DEFAULT_REGION")
        or os.environ.get("AWS_REGION_NAME")
        or "us-east-1"
    )


def voice_bucket() -> str:
    bucket = (os.environ.get("VOICE_BUCKET") or "").strip()
    if not bucket:
        raise VoiceError(
            "Voice notes are not configured (VOICE_BUCKET missing).",
            status_code=503,
        )
    return bucket


def _s3():
    return boto3.client("s3", region_name=_region())


def _transcribe():
    return boto3.client("transcribe", region_name=_region())


def normalize_media_format(ext_or_format: str) -> str:
    key = (ext_or_format or "m4a").lower().lstrip(".")
    if key not in ALLOWED_FORMATS:
        raise VoiceError(
            f"Unsupported audio format '{key}'. Use m4a, mp3, wav, or webm.",
            status_code=400,
        )
    return ALLOWED_FORMATS[key]


def make_voice_key(user_id: str, ext: str = "m4a") -> str:
    safe_ext = (ext or "m4a").lower().lstrip(".")
    if safe_ext not in ALLOWED_FORMATS:
        safe_ext = "m4a"
    return f"voice/{user_id}/{uuid.uuid4().hex}.{safe_ext}"


def create_upload_url(
    user_id: str,
    *,
    media_ext: str = "m4a",
    content_type: str = "audio/mp4",
    expires_in: int = 300,
) -> dict[str, Any]:
    """Presigned PUT so the mobile client can upload audio without AWS credentials."""
    bucket = voice_bucket()
    ext = (media_ext or "m4a").lower().lstrip(".")
    normalize_media_format(ext)
    key = make_voice_key(user_id, ext)
    # Scope keys to the user prefix for later validation
    if not key.startswith(f"voice/{user_id}/"):
        raise VoiceError("Invalid upload key", status_code=400)

    try:
        url = _s3().generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": bucket,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
            HttpMethod="PUT",
        )
    except ClientError as e:
        logger.exception("presign failed")
        raise VoiceError("Could not prepare voice upload.") from e

    return {
        "upload_url": url,
        "s3_key": key,
        "bucket": bucket,
        "content_type": content_type,
        "expires_in": expires_in,
        "media_format": normalize_media_format(ext),
    }


def assert_user_key(user_id: str, s3_key: str) -> None:
    key = (s3_key or "").strip()
    if not key.startswith(f"voice/{user_id}/") or ".." in key:
        raise VoiceError("Invalid voice note reference.", status_code=403)


def start_and_wait_transcript(
    user_id: str,
    s3_key: str,
    *,
    media_format: Optional[str] = None,
    language_code: str = "en-US",
    max_wait_sec: float = 70.0,
    poll_sec: float = 1.5,
) -> dict[str, Any]:
    """Run Amazon Transcribe on an uploaded object and return plain text."""
    assert_user_key(user_id, s3_key)
    bucket = voice_bucket()
    # Infer format from key extension if not provided
    ext = s3_key.rsplit(".", 1)[-1] if "." in s3_key else "m4a"
    fmt = normalize_media_format(media_format or ext)

    # Ensure object exists
    try:
        _s3().head_object(Bucket=bucket, Key=s3_key)
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code in ("404", "NoSuchKey", "NotFound"):
            raise VoiceError(
                "Voice note not found. Please record again.",
                status_code=404,
            ) from e
        raise VoiceError("Could not access voice note.") from e

    job_name = f"cc-{user_id[:8]}-{uuid.uuid4().hex[:16]}"
    media_uri = f"s3://{bucket}/{s3_key}"
    out_key = f"transcripts/{user_id}/{job_name}.json"

    try:
        _transcribe().start_transcription_job(
            TranscriptionJobName=job_name,
            LanguageCode=language_code,
            MediaFormat=fmt,
            Media={"MediaFileUri": media_uri},
            OutputBucketName=bucket,
            OutputKey=out_key,
            Settings={
                "ShowSpeakerLabels": False,
            },
        )
    except ClientError as e:
        logger.exception("start_transcription_job failed")
        raise VoiceError("Could not start speech recognition.") from e

    deadline = time.time() + max_wait_sec
    status = "IN_PROGRESS"
    failure: Optional[str] = None

    while time.time() < deadline:
        try:
            resp = _transcribe().get_transcription_job(TranscriptionJobName=job_name)
        except ClientError as e:
            logger.exception("get_transcription_job failed")
            raise VoiceError("Speech recognition status check failed.") from e

        job = resp.get("TranscriptionJob") or {}
        status = job.get("TranscriptionJobStatus") or "FAILED"
        if status == "COMPLETED":
            break
        if status == "FAILED":
            failure = job.get("FailureReason") or "Transcription failed"
            break
        time.sleep(poll_sec)

    if status != "COMPLETED":
        try:
            _transcribe().delete_transcription_job(TranscriptionJobName=job_name)
        except ClientError:
            pass
        if status == "FAILED":
            raise VoiceError(
                failure or "Could not understand the audio. Try speaking more clearly.",
                status_code=422,
            )
        raise VoiceError(
            "Speech recognition is taking too long. Please try a shorter note.",
            status_code=504,
        )

    # Read transcript JSON from S3 output (preferred) or TranscriptFileUri
    text = _load_transcript_text(bucket, out_key, job_name)

    # Best-effort cleanup of audio + job metadata
    try:
        _s3().delete_object(Bucket=bucket, Key=s3_key)
    except ClientError:
        pass
    try:
        _transcribe().delete_transcription_job(TranscriptionJobName=job_name)
    except ClientError:
        pass

    cleaned = " ".join((text or "").split()).strip()
    if not cleaned:
        raise VoiceError(
            "No speech detected. Please try again closer to the mic.",
            status_code=422,
        )

    return {
        "text": cleaned[:4000],
        "language_code": language_code,
        "media_format": fmt,
        "job_name": job_name,
    }


def _load_transcript_text(bucket: str, out_key: str, job_name: str) -> str:
    # Prefer our S3 output key
    try:
        obj = _s3().get_object(Bucket=bucket, Key=out_key)
        body = obj["Body"].read()
        data = json.loads(body)
        return _extract_transcript(data)
    except ClientError:
        pass
    except (json.JSONDecodeError, KeyError, TypeError):
        pass

    # Fallback: Transcribe FileUri
    try:
        resp = _transcribe().get_transcription_job(TranscriptionJobName=job_name)
        uri = (
            (resp.get("TranscriptionJob") or {})
            .get("Transcript", {})
            .get("TranscriptFileUri")
        )
        if uri:
            with urlopen(uri, timeout=15) as r:  # nosec B310 — AWS-signed URI
                data = json.loads(r.read().decode("utf-8"))
                return _extract_transcript(data)
    except Exception:
        logger.exception("transcript download failed")

    raise VoiceError("Could not read speech recognition result.")


def _extract_transcript(data: dict) -> str:
    results = data.get("results") or {}
    transcripts = results.get("transcripts") or []
    if transcripts:
        return (transcripts[0].get("transcript") or "").strip()
    return ""
