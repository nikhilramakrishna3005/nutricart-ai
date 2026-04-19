"""
NutriCart AI API entrypoint.

Routers stay thin; business logic lives in `services/`, shapes in `models/`,
and static fixtures in `data/`.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import chat, food, health, plan, session, settings_routes, stores

app = FastAPI(title="NutriCart AI API", version="0.1.0")

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
