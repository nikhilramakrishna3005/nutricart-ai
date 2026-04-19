"""Single-session file persistence for chat + planner snapshot (MVP, no external DB)."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from app.models.chat_schemas import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

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
        "candidateStores": persisted.get("candidateStores") or persisted.get("candidate_stores") or [],
        "selectedStore": persisted.get("selectedStore") or persisted.get("selected_store"),
        "storePickReason": persisted.get("storePickReason") or persisted.get("store_pick_reason") or "",
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
    prev_ns = cur.get("nutritionSummary")
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

    # Conversation-only turns must not wipe the saved planner snapshot.
    skip_planner_snapshot = response.intent in ("greeting", "general_help", "unsupported")
    base_updates: dict[str, Any] = {
        "chatHistory": hist,
        "intent": dumped["intent"],
        "assistantSummary": response.message,
        "explanation": dumped["explanation"],
        "myDay": my_day,
    }
    if not skip_planner_snapshot:
        base_updates.update(
            {
                "stores": dumped["stores"],
                "products": dumped["products"],
                "basket": dumped["basket"],
                "mealPlan": dumped["mealPlan"],
                "nutritionSummary": dumped["nutritionSummary"],
                "dailyInsight": dumped["dailyInsight"],
                "foodLogUpdates": dumped["foodLogUpdates"],
            }
        )

    if response.intent == "log_food":
        next_ns = base_updates.get("nutritionSummary")
        slot_dbg = None
        if response.log_meal_session_patch and isinstance(response.log_meal_session_patch, dict):
            slot_dbg = response.log_meal_session_patch.get("meal_slot")
        logger.info(
            "persist_after_chat log_food: slot=%s prev_cal=%s next_cal=%s my_day_keys=%s",
            slot_dbg,
            (prev_ns or {}).get("calories_today") if isinstance(prev_ns, dict) else prev_ns,
            (next_ns or {}).get("calories_today") if isinstance(next_ns, dict) else next_ns,
            list((base_updates.get("myDay") or {}).keys()) if isinstance(base_updates.get("myDay"), dict) else None,
        )

    out = update_state(base_updates, base=cur)
    if response.intent == "log_food":
        logger.info("persist_after_chat log_food: session saved (nutritionSummary present=%s)", "nutritionSummary" in out)
    return out
