# NutriCart AI — docs

## Architecture (MVP)

- **Frontend (`frontend/`)**  
  - `src/app/` — App Router routes: `/` landing, `/planner` dashboard.  
  - `src/components/planner/` — one component per planner section (chat, filters, stores, products, basket, meals, nutrition).  
  - `src/lib/api.ts` — typed fetch helpers for the FastAPI base URL.  
  - `src/types/` — mirrors backend JSON contracts.  
  - `src/data/` — UI defaults / mock seeds for first paint.

- **Backend (`backend/`)**  
  - `app/main.py` — FastAPI app + CORS + router registration.  
  - `app/routes/` — thin HTTP handlers.  
  - `app/services/` — mock planning, stores, food logging.  
  - `app/models/schemas.py` — Pydantic request/response models.  
  - `app/data/` — JSON fixtures loaded at runtime.

## Demo flow

1. Start API from `backend/` (`python dev.py` or `uvicorn` with `--reload-dir app --reload-dir data` and `--reload-exclude` for `.venv` / `venv` / caches), then web (`npm run dev`).  
2. On `/planner`, set filters → **Generate plan** → inspect structured cards.  
3. Use **Refine plan** or **Log food** in chat; nutrition updates from `/food/log`.

For deeper product notes, extend this folder with ADRs or API tables as the hackathon evolves.
