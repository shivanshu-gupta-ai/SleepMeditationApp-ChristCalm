"""Request/response models for the ChristCalm API."""

from typing import List, Optional

from pydantic import BaseModel, Field


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    is_premium: bool = False
    # free | premium — derived from is_premium (kept for clients that read it)
    subscription_tier: str = "free"
    plan: Optional[str] = None
    premium_until: Optional[str] = None
    provider: Optional[str] = None
    faith_journey: Optional[str] = None
    concerns: List[str] = []
    streak: int = 0
    minutes_meditated: int = 0
    prayers_completed: int = 0


class OnboardingIn(BaseModel):
    faith_journey: Optional[str] = None
    concerns: List[str] = []
    emotional_state: Optional[str] = None
    desired_support: List[str] = []
    preferred_time: Optional[str] = None
    commitment_accepted: bool = False
    commitment_date: Optional[str] = None
    first_practices_done: List[bool] = []
    display_name: Optional[str] = None


class MoodLogIn(BaseModel):
    emotion: str
    note: Optional[str] = None


class JournalIn(BaseModel):
    mood: Optional[str] = None
    content: str


class WisdomChatIn(BaseModel):
    message: str = Field(..., min_length=2, max_length=2000)
    conversation_id: Optional[str] = None


class VoicePresignIn(BaseModel):
    """Request a presigned S3 PUT for a short voice note."""

    media_ext: str = Field(default="m4a", max_length=8)
    content_type: str = Field(default="audio/mp4", max_length=64)


class VoiceTranscribeIn(BaseModel):
    """Transcribe an uploaded voice note via Amazon Transcribe."""

    s3_key: str = Field(..., min_length=8, max_length=512)
    media_format: Optional[str] = Field(default=None, max_length=16)
    language_code: str = Field(default="en-US", max_length=16)


class MeditationCompleteIn(BaseModel):
    meditation_id: str
    minutes: int


class MeditationRateIn(BaseModel):
    """1–5 star rating after a meditation session (stored per user in DynamoDB)."""

    meditation_id: str = Field(..., min_length=1, max_length=128)
    stars: int = Field(..., ge=1, le=5)
    minutes: Optional[int] = Field(default=None, ge=0, le=240)


class FeedbackIn(BaseModel):
    """
    Product feedback from Me tab.
    Free-text lives in user-feedback table (durable domain), not usage-events.
    """

    category: str = Field(..., min_length=2, max_length=32)
    message: str = Field(..., min_length=3, max_length=2000)
    stars: Optional[int] = Field(default=None, ge=1, le=5)
    platform: Optional[str] = Field(default=None, max_length=32)


FEEDBACK_CATEGORIES = frozenset(
    {"praise", "suggestion", "bug", "spiritual", "other"}
)


class SubscriptionSyncIn(BaseModel):
    active: bool
    plan: Optional[str] = None


class AnalyticsEventIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    props: Optional[dict] = None
    ts: Optional[str] = None
    id: Optional[str] = None


class AnalyticsBatchIn(BaseModel):
    events: List[AnalyticsEventIn] = Field(..., min_length=1, max_length=100)
    platform: Optional[str] = "unknown"
    session_id: Optional[str] = None
    device_id: Optional[str] = None
