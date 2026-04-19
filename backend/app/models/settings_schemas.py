"""Request bodies for `/settings` (MVP session file persistence)."""

from typing import Any

from pydantic import BaseModel, Field


class SettingsPatchBody(BaseModel):
    section: str = Field(..., min_length=1, description="Settings row id, e.g. profile, dietary")
    data: dict[str, Any] = Field(default_factory=dict, description="Field id -> value (string, number, or bool)")
