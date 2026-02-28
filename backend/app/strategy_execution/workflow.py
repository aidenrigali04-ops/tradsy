"""
Agentic system for strategy execution: phase-by-phase execution, workflow state tracking.
Integration with execution platforms (simulated or live).
Per System Architecture 3.2.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class PhaseStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class WorkflowState:
    """State tracking for multi-phase strategy execution."""

    workflow_id: str
    strategy_id: Optional[int] = None
    symbol: Optional[str] = None
    phases: list[str] = field(default_factory=list)  # e.g. ["liquidity_pockets", "price_action", "support_resistance"]
    phase_status: dict[str, PhaseStatus] = field(default_factory=dict)
    current_phase_index: int = 0
    result_payload: dict = field(default_factory=dict)

    def current_phase(self) -> Optional[str]:
        if 0 <= self.current_phase_index < len(self.phases):
            return self.phases[self.current_phase_index]
        return None

    def set_phase_status(self, phase: str, status: PhaseStatus) -> None:
        self.phase_status[phase] = status

    def advance(self) -> bool:
        """Move to next phase. Returns True if there is a next phase."""
        self.current_phase_index += 1
        return self.current_phase_index < len(self.phases)


class ExecutionWorkflow:
    """
    Manages phase-by-phase execution of strategy components.
    Phases can be: liquidity pockets, price action, support/resistance, etc.
    """

    def __init__(self, state: WorkflowState):
        self.state = state

    def get_status(self) -> dict:
        return {
            "workflow_id": self.state.workflow_id,
            "strategy_id": self.state.strategy_id,
            "symbol": self.state.symbol,
            "phases": self.state.phases,
            "phase_status": {k: v.value for k, v in self.state.phase_status.items()},
            "current_phase": self.state.current_phase(),
            "result": self.state.result_payload,
        }

    async def run_phase(self, phase_name: str, context: dict) -> dict:
        """
        Execute one phase. In production, runs agent/LLM with master prompt + phase-specific prompt.
        Returns phase result for state tracking.
        """
        self.state.set_phase_status(phase_name, PhaseStatus.RUNNING)
        # Placeholder: real implementation would call LLM/agents with strategy prompt + phase
        result = {"phase": phase_name, "status": "completed", "context_keys": list(context.keys())}
        self.state.set_phase_status(phase_name, PhaseStatus.COMPLETED)
        self.state.result_payload[phase_name] = result
        return result
