"""
Constraint & Policy Filtering: before generation.
Check request against safety rules, restricted content, tool rules, formatting, env rules.
Outcomes: Allow | Modify | Refuse | Redirect.
"""
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class PolicyOutcome(str, Enum):
    ALLOW = "allow"
    MODIFY = "modify"
    REFUSE = "refuse"
    REDIRECT = "redirect"


@dataclass
class PolicyResult:
    outcome: PolicyOutcome
    modified_input: Optional[str] = None
    reason: Optional[str] = None
    redirect_target: Optional[str] = None


# Placeholder restricted patterns; expand per product requirements
RESTRICTED_PATTERNS = [
    "ignore previous",
    "ignore all above",
    "jailbreak",
    "override safety",
]
SAFETY_BLOCK_REASON = "Request could not be processed due to policy."


def apply_policy_filter(user_message: str) -> PolicyResult:
    """
    Check request against safety and content rules.
    Returns Allow, Modify (with modified text), Refuse, or Redirect.
    """
    t = (user_message or "").strip().lower()
    if not t:
        return PolicyResult(outcome=PolicyOutcome.REFUSE, reason="Empty message.")

    for pattern in RESTRICTED_PATTERNS:
        if pattern in t:
            return PolicyResult(outcome=PolicyOutcome.REFUSE, reason=SAFETY_BLOCK_REASON)

    # Optional: modify to enforce formatting (e.g. strip PII, limit length)
    # if len(t) > 8000:
    #     return PolicyResult(outcome=PolicyOutcome.MODIFY, modified_input=t[:8000])

    return PolicyResult(outcome=PolicyOutcome.ALLOW)


def apply_output_moderation(assistant_text: str) -> tuple[str, bool]:
    """
    Output moderation pass after generation: trim or block.
    Returns (final_text, passed).
    """
    if not assistant_text:
        return "", True
    # Block only obvious refusals / leaked instructions; allow backend messages (e.g. "not configured")
    block_phrases = ["I cannot", "I can't assist", "I'm unable to assist"]
    for phrase in block_phrases:
        if phrase in assistant_text and len(assistant_text.strip()) < 200:
            return "[Response filtered.]", False
    return assistant_text, True
