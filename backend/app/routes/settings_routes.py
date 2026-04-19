from fastapi import APIRouter, HTTPException

from app.models.settings_schemas import SettingsPatchBody
from app.services.state_service import merge_settings_section

router = APIRouter()


@router.patch("")
def patch_settings(body: SettingsPatchBody) -> dict:
    """
    Merge one settings section into `session_state.json` under `settings[section]`.
    Returns the full persisted session (same shape as GET /session).
    """
    section = body.section.strip()
    if not section:
        raise HTTPException(status_code=400, detail="section is required")
    return merge_settings_section(section, body.data or {})
