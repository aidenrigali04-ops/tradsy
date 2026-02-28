"""
Session and message storage for chat.
Session ID, role tags, timestamps, token counts (for context window management).
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import uuid

# Rough tokens per message for trimming
APPROX_TOKENS_PER_CHAR = 0.25


@dataclass
class MessageRecord:
    role: str  # "user" | "assistant" | "system"
    content: str
    timestamp: datetime
    tokens: int = 0

    def to_openai_format(self) -> dict:
        return {"role": self.role, "content": self.content}


class ChatSessionStore:
    """
    In-memory session store: session_id -> list of MessageRecord.
    Production: use Redis or DB with same interface.
    """

    def __init__(self, max_history_tokens: int = 8000):
        self._sessions: dict[str, list[MessageRecord]] = {}
        self._session_meta: dict[str, dict] = {}  # user_id, created_at, etc.
        self.max_history_tokens = max_history_tokens

    def create_session(self, user_id: int) -> str:
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = []
        self._session_meta[session_id] = {"user_id": user_id, "created_at": datetime.utcnow().isoformat()}
        return session_id

    def get_or_create_session(self, session_id: Optional[str], user_id: int) -> str:
        if session_id and session_id in self._sessions:
            meta = self._session_meta.get(session_id, {})
            if meta.get("user_id") == user_id:
                return session_id
            # Session exists but belongs to another user; create new for this user
        return self.create_session(user_id)

    def get_messages(self, session_id: str) -> list[MessageRecord]:
        return self._sessions.get(session_id, [])

    def append(self, session_id: str, role: str, content: str) -> MessageRecord:
        tokens = max(1, int(len(content) * APPROX_TOKENS_PER_CHAR))
        rec = MessageRecord(role=role, content=content, timestamp=datetime.utcnow(), tokens=tokens)
        if session_id not in self._sessions:
            self._sessions[session_id] = []
        self._sessions[session_id].append(rec)
        return rec

    def trim_to_token_limit(self, session_id: str, max_tokens: Optional[int] = None) -> None:
        """Keep most recent messages within token limit (FIFO drop)."""
        max_tokens = max_tokens or self.max_history_tokens
        messages = self._sessions.get(session_id, [])
        total = sum(m.tokens for m in messages)
        while total > max_tokens and len(messages) > 1:
            removed = messages.pop(0)
            total -= removed.tokens
        self._sessions[session_id] = messages


_store: Optional[ChatSessionStore] = None


def get_session_store() -> ChatSessionStore:
    global _store
    if _store is None:
        _store = ChatSessionStore(max_history_tokens=8000)
    return _store
