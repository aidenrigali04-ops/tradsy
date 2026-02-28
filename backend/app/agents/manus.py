"""
Integration with Manus platform for agent orchestration.
Token-based usage and tier enforcement can delegate to Manus when configured.
"""
from typing import Optional
import httpx

from app.config import get_settings


class ManusClient:
    """
    Client for Manus platform integration.
    Use for token-based usage limitation and premium tier checks when Manus is enabled.
    """

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        settings = get_settings()
        self.base_url = (base_url or getattr(settings, "manus_base_url", None)) or "https://api.manus.dev"
        self.api_key = api_key or getattr(settings, "manus_api_key", "")

    async def check_usage(self, user_id: str, tokens_required: int) -> tuple[bool, Optional[str]]:
        """
        Check if user has enough usage quota via Manus.
        Returns (allowed, error_message).
        """
        if not self.api_key:
            return True, None  # No Manus: allow
        async with httpx.AsyncClient() as client:
            try:
                r = await client.post(
                    f"{self.base_url.rstrip('/')}/v1/usage/check",
                    json={"user_id": user_id, "tokens": tokens_required},
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=10.0,
                )
                if r.status_code != 200:
                    return False, "Usage check failed"
                data = r.json()
                return data.get("allowed", True), data.get("message")
            except Exception:
                return True, None  # Fail open if Manus unreachable

    async def record_usage(self, user_id: str, tokens_used: int) -> None:
        """Record usage with Manus after a request."""
        if not self.api_key:
            return
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{self.base_url.rstrip('/')}/v1/usage/record",
                    json={"user_id": user_id, "tokens": tokens_used},
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=5.0,
                )
            except Exception:
                pass
