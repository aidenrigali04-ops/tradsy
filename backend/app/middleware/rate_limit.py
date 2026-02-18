"""Redis-backed rate limiting for auth endpoints."""
from fastapi import HTTPException, Request, status

from app.config import get_settings

settings = get_settings()
_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is None:
        try:
            import redis
            _redis_client = redis.from_url(settings.redis_url)
        except Exception:
            _redis_client = None
    return _redis_client


async def rate_limit_auth(request: Request, key_prefix: str = "auth"):
    """Limit auth attempts: 10 per minute per IP. Falls back to permissive if Redis unavailable."""
    r = _get_redis()
    if not r:
        return  # No Redis: skip rate limit (dev mode)
    client_ip = request.client.host if request.client else "unknown"
    key = f"rate:{key_prefix}:{client_ip}"
    try:
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, 60)  # 1 minute window
        results = pipe.execute()
        count = results[0]
        if count > 10:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Try again in a minute.",
            )
    except HTTPException:
        raise
    except Exception:
        pass  # On Redis error, allow request
