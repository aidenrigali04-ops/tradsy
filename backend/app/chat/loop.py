"""
Full chat logic loop: operational pipeline from input to stream.
  Input reception → Context assembly → Intent inference → Policy filter →
  LLM call (streaming) → Output moderation → Session update → Stream.
"""
from dataclasses import dataclass, field
from typing import Optional, AsyncIterator

from app.chat.session import ChatSessionStore, get_session_store
from app.chat.context import build_messages
from app.chat.intent import infer_intent
from app.chat.policy import apply_policy_filter, apply_output_moderation, PolicyOutcome


@dataclass
class ChatLoopResult:
    """Result of a non-streaming completion (for fallback or sync use)."""
    reply: str
    session_id: str
    intent_task: str
    policy_outcome: str
    usage_tokens: int = 0
    moderated: bool = False


class ChatLoop:
    """
    Single pipeline that implements:
    Full_Context = System + Dev + Memory + History + User_Input
    Response = Sample(P(token_n | Full_Context + token_1...token_n-1))
    Apply_Policies(Response) → Stream(Response)
    """

    def __init__(
        self,
        system_instructions: str,
        developer_instructions: str = "",
        max_context_tokens: int = 12000,
    ):
        self.system_instructions = system_instructions
        self.developer_instructions = developer_instructions
        self.max_context_tokens = max_context_tokens

    def _normalize_input(self, raw: str) -> str:
        """Normalize text (tokenization preparation)."""
        if not raw:
            return ""
        return raw.strip()

    async def run(
        self,
        user_id: int,
        user_message: str,
        session_id: Optional[str] = None,
        symbol: Optional[str] = None,
        long_term_memory: Optional[str] = None,
    ) -> ChatLoopResult:
        """
        Run full loop without streaming: input → context → intent → policy → generate → moderate → store.
        """
        store = get_session_store()
        session_id = store.get_or_create_session(session_id, user_id)

        # 1. Input reception
        normalized = self._normalize_input(user_message)
        if not normalized:
            return ChatLoopResult(
                reply="Please enter a message.",
                session_id=session_id,
                intent_task="general",
                policy_outcome=PolicyOutcome.ALLOW.value,
            )

        # 2. Context assembly
        messages = build_messages(
            store,
            session_id,
            normalized,
            self.system_instructions,
            self.developer_instructions,
            long_term_memory,
            self.max_context_tokens,
        )

        # 3. Intent inference
        intent = infer_intent(normalized, context_symbol=symbol)

        # 4. Constraint & policy filtering
        policy = apply_policy_filter(normalized)
        if policy.outcome == PolicyOutcome.REFUSE:
            return ChatLoopResult(
                reply=policy.reason or "Request refused.",
                session_id=session_id,
                intent_task=intent.task_type.value,
                policy_outcome=policy.outcome.value,
            )
        if policy.outcome == PolicyOutcome.MODIFY and policy.modified_input:
            normalized = policy.modified_input
            messages[-1]["content"] = normalized

        # 5–7. Generation (non-streaming path): call LLM
        from app.llm.general import GeneralChatLLM

        if symbol:
            symbol_ctx = f"[Symbol context: {symbol} (stock).]\n\n"
            messages[0]["content"] = symbol_ctx + messages[0]["content"]
        llm = GeneralChatLLM()
        reply = await llm._complete_messages(messages, max_tokens=2048)

        # 8. Output moderation pass
        reply, passed = apply_output_moderation(reply)
        usage_tokens = await llm.count_tokens(normalized) + await llm.count_tokens(reply)

        # 9. Session update (loop reset: history + new turn)
        store.append(session_id, "user", normalized)
        store.append(session_id, "assistant", reply)
        store.trim_to_token_limit(session_id, self.max_context_tokens - 2000)

        return ChatLoopResult(
            reply=reply,
            session_id=session_id,
            intent_task=intent.task_type.value,
            policy_outcome=policy.outcome.value,
            usage_tokens=usage_tokens,
            moderated=not passed,
        )

    async def run_stream(
        self,
        user_id: int,
        user_message: str,
        session_id: Optional[str] = None,
        symbol: Optional[str] = None,
        long_term_memory: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """
        Run loop with streaming delivery: same pipeline but yield tokens/chunks as they arrive.
        """
        store = get_session_store()
        session_id = store.get_or_create_session(session_id, user_id)
        normalized = self._normalize_input(user_message)
        if not normalized:
            yield "data: " + __json_line({"type": "error", "text": "Please enter a message."}) + "\n\n"
            return

        messages = build_messages(
            store,
            session_id,
            normalized,
            self.system_instructions,
            self.developer_instructions,
            long_term_memory,
            self.max_context_tokens,
        )
        intent = infer_intent(normalized, context_symbol=symbol)
        policy = apply_policy_filter(normalized)
        if policy.outcome == PolicyOutcome.REFUSE:
            yield "data: " + __json_line({"type": "refused", "text": policy.reason or "Request refused."}) + "\n\n"
            return
        if policy.outcome == PolicyOutcome.MODIFY and policy.modified_input:
            normalized = policy.modified_input
            messages[-1]["content"] = normalized

        from app.llm.general import GeneralChatLLM

        if symbol:
            symbol_ctx = f"[Symbol context: {symbol} (stock).]\n\n"
            messages[0]["content"] = symbol_ctx + messages[0]["content"]
        llm = GeneralChatLLM()
        full_reply: list[str] = []
        try:
            async for chunk in llm.complete_stream_messages(messages, max_tokens=2048):
                full_reply.append(chunk)
                yield "data: " + __json_line({"type": "token", "text": chunk}) + "\n\n"
        except Exception as e:
            yield "data: " + __json_line({"type": "error", "text": str(e)}) + "\n\n"
            return

        reply = "".join(full_reply)
        reply, passed = apply_output_moderation(reply)
        if not passed:
            yield "data: " + __json_line({"type": "moderated", "text": reply}) + "\n\n"

        store.append(session_id, "user", normalized)
        store.append(session_id, "assistant", reply)
        store.trim_to_token_limit(session_id, self.max_context_tokens - 2000)

        yield "data: " + __json_line({
            "type": "done",
            "session_id": session_id,
            "intent_task": intent.task_type.value,
       }) + "\n\n"


def __json_line(obj: dict) -> str:
    import json
    return json.dumps(obj, ensure_ascii=False)
