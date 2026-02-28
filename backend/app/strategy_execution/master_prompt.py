"""
Master Strategy Prompt: defining trading persona and objectives.
Prompt engineering for complex strategies (e.g. "400 IQ Trader").
Per System Architecture 3.1.
"""
from typing import Optional


class MasterStrategyPrompt:
    """
    Holds trading persona and objectives for the agentic system.
    Used to drive strategy execution phases (liquidity pockets, price action, S/R).
    """

    def __init__(
        self,
        persona: str = "400 IQ Trader",
        objectives: Optional[list[str]] = None,
        strategy_rules: Optional[list[str]] = None,
    ):
        self.persona = persona
        self.objectives = objectives or ["Maximize risk-adjusted returns", "Strict risk management"]
        self.strategy_rules = strategy_rules or []

    def to_system_prompt(self) -> str:
        parts = [
            f"Trading persona: {self.persona}.",
            "Objectives: " + "; ".join(self.objectives) + ".",
        ]
        if self.strategy_rules:
            parts.append("Rules: " + "; ".join(self.strategy_rules) + ".")
        return " ".join(parts)


def build_master_prompt(
    persona: Optional[str] = None,
    objectives: Optional[list[str]] = None,
    strategy_rules: Optional[list[str]] = None,
) -> str:
    """Build master strategy prompt string for LLM/agent use."""
    p = MasterStrategyPrompt(persona=persona or "400 IQ Trader", objectives=objectives, strategy_rules=strategy_rules)
    return p.to_system_prompt()
