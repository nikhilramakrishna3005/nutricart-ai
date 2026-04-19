"""Gemini client via the official Google Gen AI SDK (`google-genai`).

Environment (loaded from ``backend/.env`` via :func:`dotenv.load_dotenv` in ``app.main``):

- ``GEMINI_API_KEY`` (required at application startup)
- ``GEMINI_MODEL`` (optional, default ``gemini-2.0-flash``)

Used by :mod:`app.services.chat_reasoning_service` for structured JSON when
calling :func:`generate_structured_response`.
"""

from __future__ import annotations

import json
import logging
import os
from collections.abc import Mapping
from typing import Any

from google import genai
from google.genai import types
from pydantic import BaseModel

logger = logging.getLogger(__name__)

_client: genai.Client | None = None

_MISSING_KEY_MSG = "GEMINI_API_KEY is not set. Please configure .env"


def _default_model() -> str:
    return (os.getenv("GEMINI_MODEL") or "gemini-2.0-flash").strip()


def _api_key_from_env() -> str:
    return (os.getenv("GEMINI_API_KEY") or "").strip()


def _require_api_key() -> str:
    key = _api_key_from_env()
    if not key:
        raise RuntimeError(_MISSING_KEY_MSG)
    return key


def validate_gemini_startup() -> None:
    """
    Ensure Gemini is configured before serving traffic.

    Raises:
        RuntimeError: If ``GEMINI_API_KEY`` is missing or client init fails.
    """
    configured = bool(_api_key_from_env())
    logger.info("Gemini API key loaded: %s", "YES" if configured else "NO")
    if not configured:
        raise RuntimeError(_MISSING_KEY_MSG)

    global _client
    if _client is not None:
        logger.info("Gemini client already initialized (model=%s)", _default_model())
        return

    try:
        key = _require_api_key()
        _client = genai.Client(api_key=key)
    except RuntimeError:
        raise
    except Exception as exc:
        logger.exception("Gemini client initialization failed")
        raise RuntimeError(
            "Gemini client could not be initialized. "
            "Verify GEMINI_API_KEY in backend/.env, google-genai is installed, and try again."
        ) from exc

    logger.info("Gemini client ready (model=%s)", _default_model())


def get_gemini_client() -> genai.Client:
    """Return the process-wide :class:`genai.Client` (must pass :func:`validate_gemini_startup` first)."""
    global _client
    if _client is None:
        try:
            _client = genai.Client(api_key=_require_api_key())
        except RuntimeError:
            raise
        except Exception as exc:
            logger.exception("Gemini client lazy initialization failed")
            raise RuntimeError(
                "Gemini client could not be created. Check GEMINI_API_KEY in .env and dependencies."
            ) from exc
    return _client


def _json_schema_from(schema: Mapping[str, Any] | type[BaseModel]) -> dict[str, Any]:
    if isinstance(schema, type) and issubclass(schema, BaseModel):
        return schema.model_json_schema()
    if isinstance(schema, Mapping):
        return dict(schema)
    raise TypeError("schema must be a JSON-Schema-like mapping or a pydantic.BaseModel subclass")


def generate_structured_response(
    system_prompt: str,
    user_prompt: str,
    *,
    schema: Mapping[str, Any] | type[BaseModel],
    model: str | None = None,
    temperature: float = 0.2,
) -> dict[str, Any]:
    """
    Call Gemini with a system instruction and user content; return parsed JSON
    matching ``schema``.

    ``schema`` may be a JSON Schema mapping or a :class:`~pydantic.BaseModel`
    subclass (converted with ``model_json_schema()``).
    """
    client = get_gemini_client()
    json_schema = _json_schema_from(schema)
    try:
        response = client.models.generate_content(
            model=model or _default_model(),
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt.strip(),
                response_mime_type="application/json",
                response_json_schema=json_schema,
                temperature=temperature,
            ),
        )
    except Exception as exc:
        logger.exception("Gemini generate_content failed")
        raise RuntimeError(
            "Gemini request failed. Check GEMINI_API_KEY, GEMINI_MODEL, and service availability."
        ) from exc

    text = (response.text or "").strip()
    if not text:
        raise ValueError("Gemini returned empty response text")
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        logger.exception("Gemini returned non-JSON text")
        raise ValueError("Gemini returned invalid JSON") from exc
