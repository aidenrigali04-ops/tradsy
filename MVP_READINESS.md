# Tradsy MVP – Readiness & Migration Guide

## Code Review Summary

**Status: ✅ No blocking errors found**

- **Backend**: Imports OK, linter clean, FastAPI app loads
- **Frontend**: Builds successfully (`npm run build`)
- **Strategy engine**: Config loads, backtest runs (mock data)

### Known Limitations (non-blocking)
- Password reset: token created but email not sent (TODO in auth)
- Rate limiting: falls back to permissive if Redis unavailable
- Strategy backtest: uses mock OHLCV bars; plug in Alpaca/Polygon for real data

---

## Current MVP Stack vs. Target Stack

| Layer | Current | Your Target | Migration Effort |
|-------|---------|-------------|------------------|
| **Backend / DB** | FastAPI + PostgreSQL + Redis | Supabase | Medium |
| **Frontend** | React (Vite) + TypeScript | Next.js | High |
| **Strategy Engine** | Python (in FastAPI) | Python (standalone or service) | Low |

---

## Is the MVP Ready?

**Yes**, the MVP is functionally ready for you to run and extend. Migration to Supabase + Next.js is feasible but requires a rewrite of the affected parts.

### Option A: Run as-is
- Backend: FastAPI + your own PostgreSQL + Redis
- Frontend: `npm run dev` (Vite + React)
- Strategy engine: already embedded in backend

### Option B: Migrate to your stack

#### 1. Supabase → Backend
- **PostgreSQL**: Point FastAPI `DATABASE_URL` to Supabase Postgres connection string
- **Auth**: Replace custom JWT with Supabase Auth (requires rewriting auth routes and frontend auth flow)
- **Optional**: Move more logic to Supabase Edge Functions and use REST/PostgREST instead of FastAPI

#### 2. Next.js → Frontend
- Full rewrite of the React app in Next.js
- Reuse: API client patterns, auth flow logic, page structure
- New: App Router or Pages Router, Next.js auth helpers if using Supabase Auth

#### 3. Python → Strategy Engine
- **Option 3a**: Keep as-is – strategy engine stays inside FastAPI
- **Option 3b**: Extract to standalone service – move `app/strategies/` to a separate repo, expose via HTTP/gRPC, call from FastAPI or Supabase Edge Functions

---

## What’s Implemented (MVP Scope)

- [x] Auth: register, login, password reset (no email yet)
- [x] Onboarding: risk tolerance, experience, strategy selection, risk disclaimer
- [x] Gurus & strategies: list, similar, strategies by guru
- [x] Strategy config: JSON schema, Steven Dux configs (2 strategies)
- [x] Backtest: config-driven rule engine, indicators, exits, risk management
- [x] Chart: TradingView widget + mock datafeed API
- [x] Layout: sidebar (Last Trade, Strategy Library, Analytics, Settings)
- [x] Rate limiting (Redis) and Alpaca config placeholders

---

## What’s Not Implemented (Post-MVP)

- [ ] TradingView Broker API (Phase 4)
- [ ] Real broker integration (Alpaca OAuth, order execution)
- [ ] Subscriptions / Stripe (Phase 5)
- [ ] Live signals, full analytics
- [ ] Google / SMS / TradingView OAuth
- [ ] Email for password reset

---

## Quick Start (Current Stack)

```bash
# Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Set DATABASE_URL, REDIS_URL in .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
# Open http://localhost:5173
```
