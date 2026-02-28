"""
General Chat LLM: broad research, internal optimization, new analysis.
Role per System Architecture 2.3.
OpenAI-style: system / user / assistant messages, streaming via SSE.
"""
from typing import Optional, List, Dict, Any, AsyncIterator

from app.config import get_settings
from app.llm.base import BaseLLMClient


class GeneralChatLLM(BaseLLMClient):
    """
    General-purpose LLM for research, optimization, and high-level analysis.
    Technical considerations: integration and fine-tuning (per architecture doc).
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or getattr(settings, "openai_api_key", "")
        self.model = model or getattr(settings, "openai_chat_model", "gpt-4o-mini")

    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 2048,
    ) -> str:
        if not self.api_key:
            return "[General LLM not configured. Set OPENAI_API_KEY.]"
        try:
            import httpx
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "max_tokens": max_tokens,
                    },
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=60.0,
                )
                if r.status_code != 200:
                    if r.status_code == 429:
                        return "Rate limit exceeded. Please wait a moment and try again."
                    return f"[LLM error: {r.status_code}]"
                data = r.json()
                choice = data.get("choices", [{}])[0]
                return (choice.get("message", {}).get("content") or "").strip()
        except Exception as e:
            return f"[General LLM error: {e}]"

    async def count_tokens(self, text: str) -> int:
        # Rough approximation: ~4 chars per token for English
        return max(1, len(text) // 4)

    async def _complete_messages(self, messages: List[Dict[str, Any]], max_tokens: int = 2048) -> str:
        """Full message list (system, user, assistant, ...) for context assembly."""
        if not self.api_key:
            return "[General LLM not configured. Set OPENAI_API_KEY.]"
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "max_tokens": max_tokens,
                    },
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=60.0,
                )
                if r.status_code != 200:
                    if r.status_code == 429:
                        return "Rate limit exceeded. Please wait a moment and try again."
                    return f"[LLM error: {r.status_code}]"
                data = r.json()
                choice = data.get("choices", [{}])[0]
                return (choice.get("message", {}).get("content") or "").strip()
        except Exception as e:
            return f"[General LLM error: {e}]"

    async def complete_stream_messages(
        self, messages: List[Dict[str, Any]], max_tokens: int = 2048
    ) -> AsyncIterator[str]:
        """Stream tokens for autoregressive generation; each token self-conditions next."""
        if not self.api_key:
            yield "[General LLM not configured. Set OPENAI_API_KEY.]"
            return
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    "https://api.openai.com/v1/chat/completions",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "max_tokens": max_tokens,
                        "stream": True,
                    },
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=60.0,
                ) as response:
                    if response.status_code != 200:
                        if response.status_code == 429:
                            yield "Rate limit exceeded. Please wait a moment and try again."
                        else:
                            yield f"[LLM error: {response.status_code}]"
                        return
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            if line == "data: [DONE]":
                                break
                            import json
                            try:
                                data = json.loads(line[6:])
                                for choice in data.get("choices", []):
                                    delta = choice.get("delta", {})
                                    content = delta.get("content")
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                pass
        except Exception as e:
            yield f"[General LLM error: {e}]"
