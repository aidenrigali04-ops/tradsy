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


@router.get("/openai-status")
async def openai_status(user: User = Depends(get_current_user)):
    """
    Check if OpenAI is configured and optionally run one minimal API call.
    Returns usage so you can verify the dashboard shows non-zero after a chat.
    """
    from app.llm.general import GeneralChatLLM
    settings = get_settings()
    configured = bool(settings.openai_api_key and settings.openai_api_key.strip())
    if not configured:
        return {
            "configured": False,
            "message": "OPENAI_API_KEY is not set in backend environment.",
            "usage": None,
        }
    try:
        llm = GeneralChatLLM()
        client = llm._client()
        response = await client.chat.completions.create(
            model=llm.model,
            messages=[{"role": "user", "content": "Say OK in one word."}],
            max_tokens=5,
        )
        usage = response.usage
        return {
            "configured": True,
            "test_ok": True,
            "message": "OpenAI API call succeeded. Usage will appear on platform.openai.com/usage for this key.",
            "usage": {
                "prompt_tokens": getattr(usage, "prompt_tokens", 0) or 0,
                "completion_tokens": getattr(usage, "completion_tokens", 0) or 0,
                "total_tokens": getattr(usage, "total_tokens", 0) or 0,
            },
        }
    except Exception as e:
        return {
            "configured": True,
            "test_ok": False,
            "message": str(e),
            "usage": None,
        }


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


@router.post("/stream")
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


DEEP_ANALYSIS_SYSTEM = """You are a professional equity analyst. Write in a clean, direct style like ChatGPT.
- Use ONLY the market data provided in the user message. Do not invent or guess numbers.
- Do not use placeholders like [Insert...] or [Determine...]. Use the actual figures given.
- Format in clear markdown: short sections with **bold** headers, bullet points, and concrete numbers.
- Keep the analysis concise (2–4 short paragraphs plus key levels). Focus on: price context, key levels, risk, and a single actionable takeaway.
- Do not repeat long boilerplate or generic templates. Be specific to the symbol and data provided."""


@router.post("/deep-analysis")
async def deep_analysis(
    body: DeepAnalysisRequest,
    user: User = Depends(get_current_user),
):
    """Deep Analysis: inject real market context and request a professional, clean response."""
    from app.services.market_context import get_market_context

    market_context = get_market_context(body.symbol, body.timeframe or "1D")
    llm = SymbolChatLLM(symbol=body.symbol, market_type="stock")
    prompt = f"""Use the following market data to write a short, professional deep analysis for {body.symbol} ({body.timeframe or '1D'}).

{market_context}

Write a clean analysis: 1) Current price context and key levels, 2) Brief technical take (support/resistance from the data), 3) Risk and one concrete takeaway. Use only the numbers above. No placeholders."""
    reply = await llm.complete(prompt, system_prompt=DEEP_ANALYSIS_SYSTEM, max_tokens=1024)
    return {"symbol": body.symbol, "timeframe": body.timeframe or "1D", "analysis": reply}


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
