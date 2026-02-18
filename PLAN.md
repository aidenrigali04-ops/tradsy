# Tradsy Platform – Build Plan (Real Trading)

## Vision Summary

Tradsy is a full trading platform where:

- **Gurus** (e.g. TJR Trades, Steven Dux) are represented as **coded strategies** that can be backtested, run live, and recommended.
- **Users** sign up, pick a guru/strategy (or build custom), and trade via an embedded **TradingView** experience; **all execution flows through your platform**.
- **Real trading**: All orders route to a real broker (Alpaca or Interactive Brokers) via your backend; no simulated execution for production.
- **Monetization**: Free (4 trades, limited access) then **Basic / Pro / Elite** subscriptions.

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Backend** | Python (FastAPI) | Strategy engine, backtesting, async real-time signals |
| **Frontend** | React (TypeScript) | Component-based UI, TradingView embed |
| **DB** | PostgreSQL | Users, strategies, orders, executions, audit trail |
| **Cache** | Redis | Sessions, rate limits, real-time pub/sub |
| **TradingView** | Charting Library + Broker API | Charts + execution UI |
| **Broker** | Alpaca (primary) / IBKR (future) | Real execution, API-first |
| **Market Data** | Alpaca (free tier) / Polygon (premium) | Historical + real-time for backtest + live |

---

## Pre-Phase 0: Prerequisites (Real Trading)

**Goal**: Lock down data, licensing, and execution path before implementation.

- **0.1 Data sources**
  - Primary: Alpaca free tier for stocks; upgrade to Polygon for depth/options when needed.
  - Backtest: Alpaca historical bars API; cache in DB or local store for repeat runs.
  - Symbol mapping: Single source of truth aligned with TradingView (e.g. `AAPL`, `SPY`).
- **0.2 TradingView licensing**
  - Charting Library: Production license required; contact TradingView for pricing.
  - Broker API: Use with Charting Library; verify terms for third-party broker integrations.
- **0.3 Broker selection**
  - **Alpaca**: Commission-free stocks, sandbox + live, OAuth for account linking.
  - Future: Interactive Brokers for options/futures; adapter pattern for broker-agnostic execution.
- **0.4 Compliance scope**
  - Tradsy acts as **technology platform**; users connect their own broker accounts.
  - KYC / AML handled by the broker (Alpaca). Tradsy stores only user identity for auth.
  - Risk disclaimers: Display at sign-up and before first trade; log acceptance.
  - Geographic restrictions: Enforce by broker eligibility; block regions where Alpaca doesn’t operate.

---

## Phase 1: Foundation (Repo, API, DB, Auth)

**Goal**: Working app shell, database, auth, and security so every other feature assumes a logged-in user.

- **1.1 Project structure**
  - Monorepo: `backend/`, `frontend/`, `shared/` (types).
  - Backend: routers for health, auth, users; env-based config; CORS.
  - Frontend: Vite + React + TS, React Router, basic layout (sidebar + main).
- **1.2 Database**
  - PostgreSQL + Alembic migrations.
  - Core tables: `users`, `user_profiles`, `sessions` (optional for refresh tokens).
  - **Add**: `risk_disclaimer_accepted_at` on `user_profiles` for compliance.
- **1.3 Authentication**
  - Email + password, Google OAuth, SMS (Twilio), TradingView link.
  - **Security**: JWT access + refresh tokens; refresh rotation; httpOnly cookies or secure storage.
  - **Rate limiting**: Redis-backed; login/signup brute-force protection.
  - Middleware: attach `current_user`; enforce `email_verified` and `onboarding_complete` where needed.
- **1.4 Onboarding**
  - Step 1: Basic info, risk tolerance, experience level; **risk disclaimer** acceptance (required).
  - Step 2: Strategy selection (static/empty for now).
  - Persist disclaimer acceptance timestamp for audit.

**Deliverables**: Sign up, login, onboarding with disclaimer; protected routes; rate limiting in place.

---

## Phase 2: Strategy Engine

**Goal**: Gurus and strategies as code, backtesting, risk engine, recommendations.

- **2.1 Strategy model**
  - Tables: `gurus`, `strategies`, `strategy_backtest_runs`.
  - Strategies: versioned code or config; no user-uploaded code at launch (platform-curated only).
- **2.2 Backtesting**
  - Historical data from Alpaca; cache per symbol/timeframe.
  - Engine: run strategy logic, compute P&L, drawdown, win rate; store in `strategy_backtest_runs`.
- **2.3 Risk management engine**
  - Rules: max position size, stop-loss, take-profit, daily loss limit.
  - Inputs: user risk tolerance, subscription tier.
  - Used in Phase 4 for all real orders.
- **2.4 Similarity & recommendations**
  - APIs: `GET /strategies`, `GET /strategies/similar`, `GET /recommendations`.

**Deliverables**: Gurus/strategies in DB, backtest pipeline, risk engine, recommendation APIs.

---

## Phase 3: TradingView Charts & Datafeed

**Goal**: Embedded chart with your datafeed; layout ready for Broker API.

- **3.1 Chart embed**
  - TradingView Charting Library; datafeed: `getBars`, `resolveSymbol`, `getMarks`.
  - Data source: Alpaca (or cached) for symbols.
- **3.2 Symbol mapping**
  - Single config for TradingView symbol names; align with Broker API `/instruments`.
- **3.3 Layout**
  - Sidebar: Last Trade, Strategy Library, Analytics, Settings.
  - Main: Chart + placeholders for execution, signals.

**Deliverables**: Chart with datafeed; sidebar + main layout.

---

## Phase 4: Broker API & Real Execution

**Goal**: All trades route through your backend to Alpaca; TradingView chart’s trading UI talks to your Broker API.

- **4.1 Broker account linking**
  - **New tables**: `broker_accounts` (user_id, broker_type, broker_account_id, oauth_tokens_encrypted, status).
  - Alpaca OAuth flow: user connects account; store encrypted tokens; refresh as needed.
  - No trade allowed without a linked, active broker account.
- **4.2 TradingView Broker API**
  - REST endpoints: `/config`, `/accounts`, `/instruments`, `/quotes`, `/orders`, `/ordersHistory`, `/executions`, `/state`.
  - Auth: JWT from your app; map to `user_id` and linked broker account.
  - WebSockets: optional for orders/positions/quotes for lower latency.
- **4.3 Execution flow**
  - Order → validate user → subscription limits (4 free trades) → risk engine → persist → **send to Alpaca API**.
  - Persist `orders` and `executions`; Alpaca fills update execution status via webhook or polling.
  - **Order of operations**: Your DB is source of truth; Alpaca is execution venue.
- **4.4 Trade execution panel & Last Trade**
  - Execution panel: symbol, side, size, type, risk params; calls your Broker API.
  - Last Trade in sidebar; trade history (paginated).

**Deliverables**: Broker linking, Broker API implemented, orders sent to Alpaca, Last Trade + history.

---

## Phase 5: Subscriptions & Monetization

**Goal**: Free (4 trades), Basic/Pro/Elite tiers; Stripe; feature gating.

- **5.1 Subscription model**
  - Tables: `plans`, `subscriptions`; free tier via trade count in period.
- **5.2 Stripe**
  - Checkout, webhooks; update `subscriptions` status.
- **5.3 Feature gating**
  - Per plan: analytics, strategy library, strategies, live signals.
  - Hard block after 4 free trades; upgrade prompt.

**Deliverables**: Stripe integration; plan enforcement; 4-trade free limit.

---

## Phase 6: Strategy Library, Analytics, Polish

**Goal**: Strategy Library, analytics, live signals, UI refinement.

- **6.1 Strategy Library**
  - List gurus/strategies; filters; similar strategies; set active strategy.
- **6.2 Analytics**
  - User P&L, win rate, drawdown; strategy backtest + live performance.
- **6.3 Live signals**
  - Strategy engine emits signals; WebSocket/polling; display in main panel.
- **6.4 UI polish**
  - Match mockups; responsive; accessibility.

**Deliverables**: Full sidebar experience; analytics; signals; polished UI.

---

## Additions for Real Trading

### Broker Integration (Phase 4)

| Item | Detail |
|------|--------|
| **Broker adapter** | Abstract `BrokerAdapter` interface; Alpaca implementation first. |
| **Account linking** | OAuth; encrypted token storage; status (active/revoked/error). |
| **Order routing** | Validate → risk check → persist → broker API → persist fill. |
| **Sync** | Poll or webhook for fills; update `executions` and positions. |

### Compliance

| Item | Detail |
|------|--------|
| **Risk disclaimer** | Required at sign-up; store `risk_disclaimer_accepted_at`. |
| **Terms of Service** | Link at sign-up; log acceptance. |
| **Geographic** | Block regions where broker doesn’t operate (config-driven). |
| **Audit** | Log order lifecycle; retain for dispute/research. |

### Security

| Item | Detail |
|------|--------|
| **Tokens** | Access + refresh JWT; refresh rotation; short-lived access. |
| **Broker tokens** | Encrypt at rest; use app-level secrets. |
| **Rate limiting** | Auth endpoints; order placement; API-wide limits. |
| **Input validation** | Pydantic; reject malformed orders. |

### Testing

| Item | Detail |
|------|--------|
| **Unit** | Auth, risk engine, strategy logic. |
| **Integration** | Order flow (mock broker); Broker API contract tests. |
| **E2E** | Critical paths: signup → onboarding → chart load. |

### Data & Licensing

| Item | Detail |
|------|--------|
| **Market data** | Alpaca free for development; Polygon for production scale. |
| **TradingView** | Charting Library license before production. |
| **Symbols** | Central config; align datafeed + Broker API + Alpaca. |

---

## Task Order

1. **Phase 1**: Foundation (project structure, DB, auth, security, onboarding).
2. **Phase 2**: Strategy engine (gurus, backtest, risk, recommendations).
3. **Phase 3**: TradingView chart, datafeed, layout.
4. **Phase 4**: Broker linking, Broker API, real execution via Alpaca.
5. **Phase 5**: Subscriptions, Stripe, feature gating.
6. **Phase 6**: Strategy Library, analytics, signals, polish.

---

## Summary

Real trading is enabled by:

- **Broker linking** (Alpaca OAuth) and encrypted token storage.
- **Broker API** implementation routing orders to Alpaca.
- **Compliance**: Risk disclaimer, ToS acceptance, geographic checks.
- **Security**: JWT refresh, rate limiting, encrypted broker credentials.
- **Data**: Alpaca for execution and market data; expand with Polygon as needed.
