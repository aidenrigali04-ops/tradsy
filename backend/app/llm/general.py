"""
General Chat LLM: broad research, internal optimization, new analysis.
Role per System Architecture 2.3.
Uses the official OpenAI SDK for chat completions (non-streaming and streaming).
"""
from typing import Optional, List, Dict, Any, AsyncIterator

from app.config import get_settings
from app.llm.base import BaseLLMClient


def _user_friendly_error(e: Exception) -> str:
    """Map SDK exceptions to user-facing messages."""
    try:
        from openai import RateLimitError
        if isinstance(e, RateLimitError):
            return "Rate limit exceeded. Please wait a moment and try again."
    except ImportError:
        pass
    err_str = str(e).lower()
    if "429" in err_str or "rate" in err_str:
        return "Rate limit exceeded. Please wait a moment and try again."
    return f"[General LLM error: {e}]"


class GeneralChatLLM(BaseLLMClient):
    """
    General-purpose LLM for research, optimization, and high-level analysis.
    Uses the OpenAI Python SDK for API calls.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or getattr(settings, "openai_api_key", "")
        self.model = model or getattr(settings, "openai_chat_model", "gpt-4o-mini")

    def _client(self):
        """Lazy import and create AsyncOpenAI client."""
        from openai import AsyncOpenAI
        return AsyncOpenAI(api_key=self.api_key)

    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 2048,
    ) -> str:
        if not self.api_key:
            return "[General LLM not configured. Set OPENAI_API_KEY.]"
        try:
            messages: List[Dict[str, str]] = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            client = self._client()
            response = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
            )
            content = response.choices[0].message.content
            return (content or "").strip()
        except Exception as e:
            return _user_friendly_error(e)

    async def count_tokens(self, text: str) -> int:
        return max(1, len(text) // 4)

    async def _complete_messages(self, messages: List[Dict[str, Any]], max_tokens: int = 2048) -> str:
        """Full message list (system, user, assistant, ...) for context assembly."""
        if not self.api_key:
            return "[General LLM not configured. Set OPENAI_API_KEY.]"
        try:
            client = self._client()
            response = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
            )
            content = response.choices[0].message.content
            return (content or "").strip()
        except Exception as e:
            return _user_friendly_error(e)

    async def complete_stream_messages(
        self, messages: List[Dict[str, Any]], max_tokens: int = 2048
    ) -> AsyncIterator[str]:
        """Stream tokens for autoregressive generation."""
        if not self.api_key:
            yield "[General LLM not configured. Set OPENAI_API_KEY.]"
            return
        try:
            client = self._client()
            stream = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield _user_friendly_error(e)
