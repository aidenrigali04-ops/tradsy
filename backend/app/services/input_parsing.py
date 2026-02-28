"""
User Interface and Input Processing: input parsing and command interpretation.
Integration of Deep Analysis, News, and Strategy Entry (System Architecture 2.2).
"""
from enum import Enum
from typing import Optional


class CommandType(str, Enum):
    """Parsed command types for ChatGPT-like UI."""
    GENERAL_CHAT = "general_chat"
    DEEP_ANALYSIS = "deep_analysis"
    NEWS = "news"
    STRATEGY_ENTRY = "strategy_entry"
    EXECUTE = "execute"


def parse_command(text: str) -> tuple[CommandType, str]:
    """
    Interpret user input and return (command_type, normalized_input).
    Enables integration of Deep Analysis, News, and Strategy Entry.
    """
    t = (text or "").strip().lower()
    if not t:
        return CommandType.GENERAL_CHAT, ""

    # Simple keyword-based parsing; can be replaced with NLU/LLM
    if "deep analysis" in t or "analyze" in t and "deep" in t:
        return CommandType.DEEP_ANALYSIS, text.strip()
    if "news" in t or "headlines" in t:
        return CommandType.NEWS, text.strip()
    if "entry" in t or "find a good entry" in t or "signal" in t:
        return CommandType.STRATEGY_ENTRY, text.strip()
    if "execute" in t or "place order" in t:
        return CommandType.EXECUTE, text.strip()

    return CommandType.GENERAL_CHAT, text.strip()
