# Multi-Agent Trading System – Backend Mapping

This document maps the **System Architecture Outline** (Multi-Agent Trading System: Software Engineering Guide) to the Tradsy backend implementation.

## 1. Core System Architecture

### 2.1 Agent Orchestration (Manus Usage)

- **Token-based usage limitation**: `app/agents/usage.py` – `UsageTracker`, `check_usage_limits()`, per-tier limits.
- **Premium tiers**: `UsageTier` enum (FREE, BASIC, PRO, ELITE) and `DEFAULT_TOKEN_LIMITS`.
- **Manus integration**: `app/agents/manus.py` – `ManusClient` for `check_usage()` and `record_usage()` when `MANUS_API_KEY` is set.

### 2.2 User Interface and Input Processing

- **ChatGPT-like UI backend**: `app/routers/chat.py` – `/chat/chat`, `/chat/deep-analysis`, `/chat/workflow/*`.
- **Input parsing and command interpretation**: `app/services/input_parsing.py` – `parse_command()` → `CommandType` (general_chat, deep_analysis, news, strategy_entry, execute).
- **Deep Analysis, News, Strategy Entry**: Same router; Deep Analysis at `POST /chat/deep-analysis`; others via `POST /chat/chat` with parsed command type in response.

### 2.3 Language Model (LLM) Integration

- **General Chat LLM**: `app/llm/general.py` – broad research, optimization, analysis; uses `OPENAI_API_KEY` and `OPENAI_CHAT_MODEL`.
- **Symbol Chat LLM (personalized)**: `app/llm/symbol.py` – per-symbol (stock/crypto/forex), system prompt personalization, capabilities: research, news analysis, entry signals, execution integration.
- **Base interface**: `app/llm/base.py` – `BaseLLMClient` with `complete()` and `count_tokens()` for inter-agent usage.

## 3. Strategy Execution Framework

### 3.1 Master Strategy Prompt

- **Trading persona and objectives**: `app/strategy_execution/master_prompt.py` – `MasterStrategyPrompt`, `build_master_prompt()` (e.g. "400 IQ Trader").
- **Prompt engineering**: Persona, objectives, and strategy rules combined into a system prompt string.

### 3.2 Agentic Strategy Execution

- **Phase-by-phase execution**: `app/strategy_execution/workflow.py` – `ExecutionWorkflow`, `WorkflowState`, phases (e.g. liquidity_pockets, price_action, support_resistance).
- **Workflow state**: `PhaseStatus` (pending/running/completed/failed), `run_phase()` for single-phase execution.
- **API**: `POST /chat/workflow/start`, `GET /chat/workflow/{workflow_id}` for status; execution platform (simulated/live) can be wired in `run_phase()`.

## 4. Technical Implementation

- **API design for inter-agent communication**: Chat and workflow APIs use the same auth and LLM/agent services; extend with message queues or internal HTTP as needed.
- **Security**: API keys via `app/config.py` (env); auth via `get_current_user` on chat routes.
- **Scalability**: Usage tracking and workflow state are in-memory; production should use Redis/DB (see TODOs in `usage.py` and `chat.py`).

## 5. Full Chat Logic Loop

Operational pipeline (input → stream), aligned with ChatGPT/OpenAI/Claude-style flows:

1. **Input reception** – `app/chat/loop.py` `_normalize_input()`; `app/chat/session.py` attaches session_id, role, timestamp.
2. **Context assembly** – `app/chat/context.py` `build_messages()`: system instructions → developer instructions → long-term memory → previous messages (within token limit) → current user message. Single sequence for the model.
3. **Intent inference** – `app/chat/intent.py` `infer_intent()`: task type (analysis, ideation, coding, trading_signal, etc.), domain, depth, tone, constraints (pattern-based; can be replaced with classifier/LLM).
4. **Constraint & policy filtering** – `app/chat/policy.py` `apply_policy_filter()`: safety/restricted content → Allow | Modify | Refuse | Redirect.
5. **Generation** – OpenAI Chat Completions with full message list; streaming via `complete_stream_messages()` (autoregressive token stream).
6. **Output moderation** – `apply_output_moderation()` after generation; trim or block.
7. **Streaming delivery** – `POST /chat/stream` returns SSE (`data: {"type":"token","text":"..."}`); UI can render progressively.
8. **Loop reset** – Session store appends user + assistant messages, trims history when context window exceeded.

Config: `CHAT_SYSTEM_INSTRUCTIONS`, `CHAT_DEVELOPER_INSTRUCTIONS`, `CHAT_MAX_CONTEXT_TOKENS`.

## 6. Config (Environment)

- `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL` – General and Symbol LLM.
- `MANUS_API_KEY`, `MANUS_BASE_URL` – Optional Manus usage integration.
- `CHAT_SYSTEM_INSTRUCTIONS`, `CHAT_DEVELOPER_INSTRUCTIONS`, `CHAT_MAX_CONTEXT_TOKENS` – Chat loop context.
