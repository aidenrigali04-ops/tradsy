"""
Intent Inference: detect task type, domain, depth, tone, constraints.
Probabilistic pattern inference (keyword/pattern based; can be replaced with small classifier or LLM).
"""
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class TaskType(str, Enum):
    ANALYSIS = "analysis"
    IDEATION = "ideation"
    CODING = "coding"
    EXPLANATION = "explanation"
    TRADING_SIGNAL = "trading_signal"
    NEWS = "news"
    GENERAL = "general"


class Domain(str, Enum):
    TRADING = "trading"
    MARKET = "market"
    TECH = "tech"
    GENERAL = "general"


class DepthLevel(str, Enum):
    QUICK = "quick"
    STANDARD = "standard"
    DEEP = "deep"


@dataclass
class InferredIntent:
    task_type: TaskType
    domain: Domain
    depth: DepthLevel
    tone_preference: str  # "neutral" | "formal" | "casual"
    constraints: list[str]


def infer_intent(text: str, context_symbol: Optional[str] = None) -> InferredIntent:
    """
    From full context (here we only have current message + optional symbol).
    Pattern-based; in production use a small model or LLM call for probabilistic inference.
    """
    t = (text or "").strip().lower()
    task = TaskType.GENERAL
    if "analyze" in t or "analysis" in t or "deep" in t:
        task = TaskType.ANALYSIS
    elif "idea" in t or "suggest" in t or "what if" in t:
        task = TaskType.IDEATION
    elif "code" in t or "implement" in t or "script" in t:
        task = TaskType.CODING
    elif "explain" in t or "why" in t or "how does" in t:
        task = TaskType.EXPLANATION
    elif "entry" in t or "signal" in t or "trade" in t or "buy" in t or "sell" in t:
        task = TaskType.TRADING_SIGNAL
    elif "news" in t or "headline" in t:
        task = TaskType.NEWS

    domain = Domain.TRADING if context_symbol or "stock" in t or "trade" in t else Domain.GENERAL
    depth = DepthLevel.DEEP if "deep" in t or "detailed" in t else DepthLevel.STANDARD
    tone = "formal" if "formal" in t else "casual" if "casual" in t else "neutral"
    constraints: list[str] = []
    if "brief" in t or "short" in t:
        constraints.append("brief")
    if "step by step" in t:
        constraints.append("step_by_step")

    return InferredIntent(
        task_type=task,
        domain=domain,
        depth=depth,
        tone_preference=tone,
        constraints=constraints,
    )
