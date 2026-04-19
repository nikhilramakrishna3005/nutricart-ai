"""Single-session file persistence for chat + planner snapshot (MVP, no external DB)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.models.chat_schemas import ChatRequest, ChatResponse

# backend/data/session_state.json (this file lives in backend/app/services/)
SESSION_PATH = Path(__file__).resolve().parents[2] / "data" / "session_state.json"


def default_state() -> dict[str, Any]:
    return {
        "chatHistory": [],
        "stores": [],
        "products": [],
        "basket": {"items": [], "subtotal_usd": 0},
        "mealPlan": [],
        "nutritionSummary": None,
        "dailyInsight": "",
        "explanation": "",
        "intent": "",
        "assistantSummary": "",
        "foodLogUpdates": [],
        "myDay": {"breakfast": None, "lunch": None, "dinner": None},
        "settings": {},
    }


def load_state() -> dict[str, Any]:
    if not SESSION_PATH.is_file():
        return default_state()
    try:
        raw = json.loads(SESSION_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default_state()
    if not isinstance(raw, dict):
        return default_state()
    merged = default_state()
    merged.update(raw)
    md = merged.get("myDay")
    if not isinstance(md, dict):
        md = default_state()["myDay"]
    for k in ("breakfast", "lunch", "dinner"):
        md.setdefault(k, None)
    merged["myDay"] = md
    st = merged.get("settings")
    if not isinstance(st, dict):
        st = {}
    merged["settings"] = st
    return merged


def save_state(state: dict[str, Any]) -> None:
    SESSION_PATH.parent.mkdir(parents=True, exist_ok=True)
    SESSION_PATH.write_text(
        json.dumps(state, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def update_state(
    partial_updates: dict[str, Any],
    *,
    base: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Shallow merge top-level keys; `myDay` and `settings` merge as dicts. Pass `base` to avoid an extra disk read."""
    cur = dict(base) if base is not None else load_state()
    for key, value in partial_updates.items():
        if key == "myDay" and isinstance(value, dict):
            md = dict(cur.get("myDay") or {})
            md.update(value)
            cur["myDay"] = md
        elif key == "settings" and isinstance(value, dict):
            st = dict(cur.get("settings") or {})
            st.update(value)
            cur["settings"] = st
        else:
            cur[key] = value
    save_state(cur)
    return cur


def merge_settings_section(
    section: str,
    data: dict[str, Any],
    *,
    base: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Merge `data` into `settings[section]` and persist. Returns full session dict."""
    cur = dict(base) if base is not None else load_state()
    settings = dict(cur.get("settings") or {})
    prev = settings.get(section)
    section_cur = dict(prev) if isinstance(prev, dict) else {}
    for k, v in (data or {}).items():
        section_cur[k] = v
    settings[section] = section_cur
    cur["settings"] = settings
    save_state(cur)
    return cur


def _persisted_to_current_state(persisted: dict[str, Any]) -> dict[str, Any]:
    """Shape saved JSON into `ChatRequest.current_state` (+ plan reconstruction fields)."""
    md = persisted.get("myDay")
    if not isinstance(md, dict):
        md = default_state()["myDay"]
    return {
        "intent": persisted.get("intent") or "",
        "stores": persisted.get("stores") or [],
        "products": persisted.get("products") or [],
        "basket": persisted.get("basket") or {"items": [], "subtotal_usd": 0},
        "mealPlan": persisted.get("mealPlan") or [],
        "nutritionSummary": persisted.get("nutritionSummary"),
        "foodLogUpdates": persisted.get("foodLogUpdates") or [],
        "dailyInsight": persisted.get("dailyInsight") or "",
        "explanation": persisted.get("explanation") or "",
        "assistant_summary": persisted.get("assistantSummary")
        or persisted.get("assistant_summary")
        or "",
        "myDay": {
            "breakfast": md.get("breakfast"),
            "lunch": md.get("lunch"),
            "dinner": md.get("dinner"),
        },
    }


def merge_request_with_persisted_session(
    req: ChatRequest,
    persisted: dict[str, Any] | None = None,
) -> ChatRequest:
    """Pre-handler: disk session seeds `current_state` when the client sends an empty refresh."""
    data = persisted if persisted is not None else load_state()
    disk = _persisted_to_current_state(data)
    merged = {**disk, **(req.current_state or {})}
    return req.model_copy(update={"current_state": merged})


def persist_after_chat(
    user_message: str,
    response: ChatResponse,
    *,
    base: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Append chat turns and snapshot planner fields; save to disk. Returns the merged saved state."""
    cur = dict(base) if base is not None else load_state()
    hist = list(cur.get("chatHistory") or [])
    hist.append({"role": "user", "content": user_message})
    hist.append(
        {
            "role": "assistant",
            "message": response.message,
            "intent": response.intent,
        },
    )
    hist = hist[-120:]

    dumped = response.model_dump(
        mode="json",
        by_alias=True,
        exclude={"session", "log_meal_session_patch"},
    )
    my_day = dict(cur.get("myDay") or default_state()["myDay"])
    if response.intent == "log_food" and response.log_meal_session_patch:
        patch = response.log_meal_session_patch
        slot = patch.get("meal_slot")
        slot_data = patch.get("slot")
        if (
            isinstance(slot, str)
            and slot in ("breakfast", "lunch", "dinner")
            and isinstance(slot_data, dict)
        ):
            my_day[slot] = slot_data

    return update_state(
        {
            "chatHistory": hist,
            "stores": dumped["stores"],
            "products": dumped["products"],
            "basket": dumped["basket"],
            "mealPlan": dumped["mealPlan"],
            "nutritionSummary": dumped["nutritionSummary"],
            "dailyInsight": dumped["dailyInsight"],
            "explanation": dumped["explanation"],
            "intent": dumped["intent"],
            "assistantSummary": response.message,
            "foodLogUpdates": dumped["foodLogUpdates"],
            "myDay": my_day,
        },
        base=cur,
    )
