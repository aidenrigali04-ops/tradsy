"""Schemas for chat and agent APIs (System Architecture 2.2, 2.3)."""
from typing import Optional
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    symbol: Optional[str] = None
    market_type: Optional[str] = "stock"
    context: Optional[dict] = None
    stream: bool = False


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    command_type: Optional[str] = None
    intent_task: Optional[str] = None
    usage_tokens: Optional[int] = None


class DeepAnalysisRequest(BaseModel):
    symbol: str
    timeframe: Optional[str] = "1D"


class WorkflowStatusResponse(BaseModel):
    workflow_id: str
    strategy_id: Optional[int]
    symbol: Optional[str]
    phases: list[str]
    phase_status: dict[str, str]
    current_phase: Optional[str]
    result: dict


class RiskAssessmentResponse(BaseModel):
    """Overtrading / risk warning for UI (probability of loss, balance, recommendation)."""
    symbol: str
    probability_loss_pct: float
    balance: float
    message: str
    show_apply: bool = True


class ExecutionStepSchema(BaseModel):
    id: str
    label: str
    status: str  # "pending" | "running" | "completed"


class ExecutionStartRequest(BaseModel):
    symbol: str = "AAPL"


class ExecutionStartResponse(BaseModel):
    execution_id: str
    symbol: str
    steps: list[ExecutionStepSchema]


class ExecutionStatusResponse(BaseModel):
    execution_id: str
    symbol: str
    steps: list[ExecutionStepSchema]
    all_completed: bool
