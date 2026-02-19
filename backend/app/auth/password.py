from passlib.context import CryptContext

# Bcrypt only accepts up to 72 bytes. Don't raise, truncate silently as fallback.
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__truncate_error=False,
)

MAX_BCRYPT_BYTES = 72


def _truncate_for_bcrypt(s: str) -> str:
    if not s:
        return s
    b = s.encode("utf-8")
    if len(b) <= MAX_BCRYPT_BYTES:
        return s
    b = b[:MAX_BCRYPT_BYTES]
    # Avoid cutting a multi-byte character in half
    while len(b) > 0 and b[-1] >= 0x80 and b[-1] < 0xC0:
        b = b[:-1]
    return b.decode("utf-8", errors="replace")


def hash_password(password: str) -> str:
    safe = _truncate_for_bcrypt(password)
    # Ensure we never exceed 72 bytes (final safety for bcrypt)
    if len(safe.encode("utf-8")) > MAX_BCRYPT_BYTES:
        safe = safe.encode("utf-8")[:MAX_BCRYPT_BYTES].decode("utf-8", errors="replace")
    return pwd_context.hash(safe)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(_truncate_for_bcrypt(plain), hashed)
