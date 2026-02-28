"""
Agent Orchestration: Token-based usage limitation and premium tiers.
Aligns with System Architecture 2.1 (Manus usage, premium tiers).
"""
from enum import Enum
from typing import Optional


class UsageTier(str, Enum):
    """Premium usage tiers with increased limitations."""
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ELITE = "elite"


# Max tokens (or equivalent usage units) per period per tier
DEFAULT_TOKEN_LIMITS = {
    UsageTier.FREE: 10_000,
    UsageTier.BASIC: 50_000,
    UsageTier.PRO: 200_000,
    UsageTier.ELITE: 1_000_000,
}


class UsageTracker:
    """
    Tracks token/usage per user for agent orchestration.
    In production, persist to Redis or DB and enforce per-day/month.
    """

    def __init__(self, tier: UsageTier = UsageTier.FREE, limit_override: Optional[int] = None):
        self.tier = tier
        self.limit = limit_override or DEFAULT_TOKEN_LIMITS.get(tier, DEFAULT_TOKEN_LIMITS[UsageTier.FREE])
        self._used = 0  # In-memory for now; use Redis key per user in production

    def add_usage(self, tokens: int) -> None:
        self._used += tokens

    @property
    def remaining(self) -> int:
        return max(0, self.limit - self._used)

    def can_use(self, tokens: int) -> bool:
        return self._used + tokens <= self.limit


def check_usage_limits(
    user_id: int,
    tier: UsageTier,
    requested_tokens: int,
    # In production: async def, fetch current usage from Redis/DB
) -> tuple[bool, Optional[str]]:
    """
    Returns (allowed, error_message).
    """
    tracker = UsageTracker(tier=tier)
    # TODO: load tracker._used from Redis key f"usage:{user_id}" for current period
    if not tracker.can_use(requested_tokens):
        return False, f"Usage limit exceeded for tier {tier.value}. Upgrade for more."
    return True, None
