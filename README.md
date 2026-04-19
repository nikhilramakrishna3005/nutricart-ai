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

From the repository root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
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
