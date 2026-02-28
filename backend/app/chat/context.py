"""
Context Assembly: full prompt context in order.
  System instructions → Developer instructions → Long-term memory → History → Current user message.
"""
from typing import Optional

from app.chat.session import ChatSessionStore, MessageRecord, APPROX_TOKENS_PER_CHAR


def build_messages(
    store: ChatSessionStore,
    session_id: str,
    current_user_message: str,
    system_instructions: str,
    developer_instructions: str = "",
    long_term_memory: Optional[str] = None,
    max_context_tokens: int = 12000,
) -> list[dict]:
    """
    Build OpenAI-style messages list:
    [system (combined), ...history (user/assistant), user (current)].
    Trims history so total context stays under max_context_tokens.
    """
    # 1. System block (system + developer + optional memory)
    system_parts = [system_instructions]
    if developer_instructions:
        system_parts.append("\n\n[Developer instructions]\n" + developer_instructions)
    if long_term_memory:
        system_parts.append("\n\n[Long-term memory]\n" + long_term_memory)
    system_content = "\n".join(system_parts)

    messages: list[dict] = [{"role": "system", "content": system_content}]

    history = store.get_messages(session_id)
    budget = max_context_tokens - int(len(system_content) * APPROX_TOKENS_PER_CHAR) - int(
        len(current_user_message) * APPROX_TOKENS_PER_CHAR
    )
    budget = max(500, budget)
    used = 0
    for rec in history:
        if used + rec.tokens > budget:
            break
        messages.append(rec.to_openai_format())
        used += rec.tokens

    # 5. Current user message
    messages.append({"role": "user", "content": current_user_message})
    return messages
