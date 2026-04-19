"""
NutriCart AI API entrypoint.

Routers stay thin; business logic lives in `services/`, shapes in `models/`,
and static fixtures in `data/`.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env before any application code reads os.environ.
_BACKEND_ROOT = Path(__file__).resolve().parents[1]
_ENV_FILE = _BACKEND_ROOT / ".env"
_dotenv_applied = load_dotenv(_ENV_FILE)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import chat, food, health, plan, session, settings_routes, stores
from app.services.gemini_service import validate_gemini_startup

_logger = logging.getLogger(__name__)
_logger.info(
    "Environment: .env path=%s file_exists=%s dotenv_applied=%s",
    _ENV_FILE,
    _ENV_FILE.exists(),
    _dotenv_applied,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    validate_gemini_startup()
    yield


app = FastAPI(title="NutriCart AI API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(stores.router, prefix="/stores", tags=["stores"])
app.include_router(plan.router, tags=["plan"])
app.include_router(food.router, prefix="/food", tags=["food"])
app.include_router(chat.router, tags=["chat"])
app.include_router(session.router, tags=["session"])
app.include_router(settings_routes.router, prefix="/settings", tags=["settings"])
