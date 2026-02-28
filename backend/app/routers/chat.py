"""
Chat and analysis API: ChatGPT-like UI backend.
Full chat logic loop: input → context assembly → intent → policy → generate → moderate → stream.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.config import get_settings
from app.models.user import User
from app.dependencies import get_current_user
from app.schemas.chat import ChatRequest, ChatResponse, DeepAnalysisRequest, WorkflowStatusResponse
from app.services.input_parsing import parse_command
from app.llm.symbol import SymbolChatLLM
from app.agents.usage import UsageTier, check_usage_limits
from app.strategy_execution import build_master_prompt, ExecutionWorkflow, WorkflowState, PhaseStatus
from app.chat.loop import ChatLoop
from app.chat.session import get_session_store

router = APIRouter()

# In-memory workflow store; use Redis/DB in production
_workflows: dict[str, ExecutionWorkflow] = {}


def _get_chat_loop() -> ChatLoop:
    s = get_settings()
    return ChatLoop(
        system_instructions=s.chat_system_instructions,
        developer_instructions=s.chat_developer_instructions,
        max_context_tokens=s.chat_max_context_tokens,
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    user: User = Depends(get_current_user),
):
    """
    Full chat logic loop (non-streaming): input reception → context assembly →
    intent inference → policy filter → generation → output moderation → session update.
    """
    if body.stream:
        raise HTTPException(status_code=400, detail="Use POST /chat/stream for streaming.")
    estimated_tokens = 1000
    tier = UsageTier.BASIC  # TODO: from user subscription
    allowed, err = check_usage_limits(user.id, tier, estimated_tokens)
    if not allowed:
        raise HTTPException(status_code=403, detail=err or "Usage limit exceeded")

    loop = _get_chat_loop()
    result = await loop.run(
        user_id=user.id,
        user_message=body.message,
        session_id=body.session_id,
        symbol=body.symbol,
    )
    return ChatResponse(
        reply=result.reply,
        session_id=result.session_id,
        intent_task=result.intent_task,
        usage_tokens=result.usage_tokens,
    )


@router.post("/chat/stream")
async def chat_stream(
    body: ChatRequest,
    user: User = Depends(get_current_user),
):
    """
    Streaming delivery: same chat loop but yields SSE events (token, done, error).
    Client can render progressively; session state updated after completion.
    """
    estimated_tokens = 1000
    tier = UsageTier.BASIC
    allowed, err = check_usage_limits(user.id, tier, estimated_tokens)
    if not allowed:
        raise HTTPException(status_code=403, detail=err or "Usage limit exceeded")

    loop = _get_chat_loop()

    async def event_stream():
        async for chunk in loop.run_stream(
            user_id=user.id,
            user_message=body.message,
            session_id=body.session_id,
            symbol=body.symbol,
        ):
            yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/deep-analysis")
async def deep_analysis(
    body: DeepAnalysisRequest,
    user: User = Depends(get_current_user),
):
    """Deep Analysis integration: symbol + timeframe."""
    llm = SymbolChatLLM(symbol=body.symbol, market_type="stock")
    system = build_master_prompt(persona="400 IQ Trader")
    prompt = f"Deep analysis for {body.symbol} over {body.timeframe}. Provide structured analysis."
    reply = await llm.complete(prompt, system_prompt=system, max_tokens=2048)
    return {"symbol": body.symbol, "timeframe": body.timeframe, "analysis": reply}


@router.post("/workflow/start")
async def workflow_start(
    symbol: Optional[str] = None,
    strategy_id: Optional[int] = None,
    user: User = Depends(get_current_user),
):
    """Start an agentic strategy execution workflow (phase-by-phase)."""
    import uuid
    wf_id = str(uuid.uuid4())
    phases = ["liquidity_pockets", "price_action", "support_resistance"]
    state = WorkflowState(
        workflow_id=wf_id,
        strategy_id=strategy_id,
        symbol=symbol,
        phases=phases,
        phase_status={p: PhaseStatus.PENDING for p in phases},
    )
    workflow = ExecutionWorkflow(state)
    _workflows[wf_id] = workflow
    return {"workflow_id": wf_id, "phases": phases}


@router.get("/workflow/{workflow_id}", response_model=WorkflowStatusResponse)
async def workflow_status(
    workflow_id: str,
    user: User = Depends(get_current_user),
):
    """Get workflow state and phase status."""
    if workflow_id not in _workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    wf = _workflows[workflow_id]
    s = wf.get_status()
    return WorkflowStatusResponse(
        workflow_id=s["workflow_id"],
        strategy_id=s["strategy_id"],
        symbol=s["symbol"],
        phases=s["phases"],
        phase_status=s["phase_status"],
        current_phase=s["current_phase"],
        result=s["result"],
    )
