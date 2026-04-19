"""Normalized nearby-store objects for tools (extends planner ``Store`` with address + source)."""

from __future__ import annotations

from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, computed_field

from app.models.schemas import Store

SourceType = Literal["mock", "live"]


class NearbyStoreCandidate(BaseModel):
    """
    Tool-safe store row: compatible with chat/planner when mapped to :class:`~app.models.schemas.Store`.
    """

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: str
    name: str
    distance_miles: float = Field(
        ...,
        validation_alias=AliasChoices("distanceMiles", "distance_miles"),
        serialization_alias="distanceMiles",
    )
    address: str = ""
    is_open: bool = Field(..., validation_alias=AliasChoices("isOpen", "is_open"), serialization_alias="isOpen")
    opens_at: str | None = Field(
        default=None,
        validation_alias=AliasChoices("opensAt", "opens_at"),
        serialization_alias="opensAt",
    )
    zip_code: str | None = Field(
        default=None,
        validation_alias=AliasChoices("zipCode", "zip_code"),
        serialization_alias="zipCode",
    )
    last_updated: str | None = Field(
        default=None,
        validation_alias=AliasChoices("lastUpdated", "last_updated"),
        serialization_alias="lastUpdated",
    )
    source_type: SourceType = Field(
        default="mock",
        validation_alias=AliasChoices("sourceType", "source_type"),
        serialization_alias="sourceType",
    )
    notes: str | None = None

    @computed_field
    @property
    def source(self) -> SourceType:
        """Alias for ``source_type`` in JSON (`live` vs `mock`)."""
        return self.source_type

    def to_store(self) -> Store:
        """Strip tool-only fields for :class:`~app.models.schemas.Store` / ``ChatResponse``."""
        return Store(
            id=self.id,
            name=self.name,
            distance_miles=self.distance_miles,
            is_open=self.is_open,
            address=self.address,
            opens_at=self.opens_at,
            zip_code=self.zip_code,
            last_updated=self.last_updated,
            source=self.source_type,
        )
