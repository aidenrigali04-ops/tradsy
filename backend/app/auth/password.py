import bcrypt

# Bcrypt only accepts up to 72 bytes. We truncate to bytes and use bcrypt directly.
MAX_BCRYPT_BYTES = 72


def _to_bcrypt_bytes(s: str) -> bytes:
    """Return password as bytes, at most 72 bytes, for bcrypt."""
    if not s:
        return b""
    b = s.encode("utf-8")
    if len(b) <= MAX_BCRYPT_BYTES:
        return b
    b = b[:MAX_BCRYPT_BYTES]
    # Avoid cutting a multi-byte UTF-8 character in half (continuation bytes are 0x80-0xBF)
    while len(b) > 0 and 0x80 <= b[-1] < 0xC0:
        b = b[:-1]
    return b


def hash_password(password: str) -> str:
    pwd_bytes = _to_bcrypt_bytes(password)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    pwd_bytes = _to_bcrypt_bytes(plain)
    hashed_bytes = hashed.encode("utf-8") if isinstance(hashed, str) else hashed
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)
