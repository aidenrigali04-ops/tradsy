"""
Base LLM client interface for inter-agent communication.
"""
from abc import ABC, abstractmethod
from typing import Optional


class BaseLLMClient(ABC):
    """Abstract LLM client for research, analysis, and execution integration."""

    @abstractmethod
    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 2048,
    ) -> str:
        """Return completion text. Implement with OpenAI, Anthropic, or custom endpoint."""
        pass

    @abstractmethod
    async def count_tokens(self, text: str) -> int:
        """Approximate token count for usage tracking."""
        pass
