# NutriCart AI (Hackathon MVP)

NutriCart AI is a full-stack starter for an AI-assisted nutrition and grocery planner. The **chat panel is only the interaction layer**; plans, stores, products, basket, meals, and nutrition render as **structured sections** on the planner page.

## Monorepo layout

| Path | Role |
|------|------|
| `frontend/` | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn-style UI under `src/` |
| `backend/` | FastAPI + Pydantic, modular `routes/`, `services/`, `models/`, `data/` |
| `docs/` | Short architecture notes for demos and teammates |

## Prerequisites

- **Node.js** 18+ and npm  
- **Python** 3.11+

## Run the backend

Configure Gemini (required for the API process to start; used by `/chat` reasoning):

1. In `backend/`, copy `.env.example` to `.env` and set `GEMINI_API_KEY` (see [Google AI Studio](https://aistudio.google.com/apikey)).  
2. `app/main.py` loads `backend/.env` via `python-dotenv` before routes run.  
3. Optional **live nearby stores**: set `GOOGLE_MAPS_API_KEY` (Geocoding + Places Nearby enabled on the key). Without it, `/stores` and the `get_nearby_stores` chat tool use mock fixtures only.

Optional: you can still `export GEMINI_API_KEY=...` in your shell; existing environment variables are not overwritten by `.env` unless you change `load_dotenv` behavior.

From the repository root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python dev.py
```

`python dev.py` runs Uvicorn with reload scoped to **`app/`** and **`data/`**, and excludes **`.venv`**, **`venv`**, **`__pycache__`**, and **`*.pyc`** so the dev server does not restart in a loop when the virtualenv or caches change.

Equivalent CLI (from `backend/`):

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 \
  --reload-dir app --reload-dir data \
  --reload-exclude .venv --reload-exclude venv \
  --reload-exclude "**/.venv/**" --reload-exclude "**/venv/**" \
  --reload-exclude "**/__pycache__/**" --reload-exclude "**/__pycache__" \
  --reload-exclude "**/*.pyc" --reload-exclude "**/*.pyo"
```

Key endpoints (mock data):

- `GET /health` — liveness  
- `GET /stores?zip=...` — mock nearby stores  
- `POST /plan` — mock plan from filters  
- `POST /plan/refine` — keyword-style refine  
- `POST /food/log` — mock food log + nutrition  

Interactive docs: `http://127.0.0.1:8000/docs`

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` (landing) and `http://localhost:3000/planner` (dashboard).

Optional: create `frontend/.env.local` to point at a non-default API:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Project conventions

- **No auth** and **no real retailer APIs** in this MVP — swap `services/` + `data/` for real integrations.  
- **CORS** allows `localhost:3000` / `127.0.0.1:3000`.  
- Keep **frontend `src/types`** aligned with **`backend/app/models/schemas.py`**.

## License

Hackathon starter — adjust as needed for your team.
