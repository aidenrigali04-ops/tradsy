"""
Symbol Chat LLM (Personalized LLM): per-symbol customization (stock, crypto, forex).
Data sources for personalization: historical data, real-time feeds.
Capabilities: research, news analysis, entry signal generation, execution integration.
Per System Architecture 2.3.
"""
from typing import Optional, AsyncIterator

from app.llm.base import BaseLLMClient
from app.llm.general import GeneralChatLLM


class SymbolChatLLM(BaseLLMClient):
    """
    Per-symbol LLM for research, news analysis, entry signals, and execution integration.
    Personalization uses historical and real-time data for the given symbol/market.
    """

    def __init__(
        self,
        symbol: str,
        market_type: str = "stock",  # stock | crypto | forex
        general_llm: Optional[GeneralChatLLM] = None,
    ):
        self.symbol = symbol
        self.market_type = market_type
        self._llm = general_llm or GeneralChatLLM()

    def _system_prompt(self) -> str:
        return (
            f"You are a specialized trading assistant for {self.symbol} ({self.market_type}). "
            "Use only the context provided (historical data, real-time feeds when available). "
            "Capabilities: research, news analysis, entry signal generation, execution integration. "
            "Be concise and actionable."
        ).strip()

    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 2048,
    ) -> str:
        sys = system_prompt or self._system_prompt()
        # Prepend symbol context for personalization (in production, inject real data)
        context = f"Symbol: {self.symbol} ({self.market_type}). "
        return await self._llm.complete(context + prompt, system_prompt=sys, max_tokens=max_tokens)

    async def count_tokens(self, text: str) -> int:
        return await self._llm.count_tokens(text)

    async def complete_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """Stream tokens for symbol-specific completion."""
        sys = system_prompt or self._system_prompt()
        messages = [
            {"role": "system", "content": sys},
            {"role": "user", "content": f"Symbol: {self.symbol} ({self.market_type}). {prompt}"},
        ]
        async for chunk in self._llm.complete_stream_messages(messages, max_tokens=max_tokens):
            yield chunk
