# Tradsy

Full trading platform: guru strategies, TradingView charts, and real execution via broker API.

## Stack

- **Backend**: FastAPI (Python), PostgreSQL, Redis, Alembic
- **Frontend**: Vite + React + TypeScript
- **Broker**: Alpaca (real execution)
- **Charts**: TradingView Charting Library + Broker API

## Quick start

### Backend

```bash
cd backend
cp .env.example .env   # Edit with your DB and API keys
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Plan

See [PLAN.md](./PLAN.md) for the full build plan (real trading, broker integration, compliance).
