from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bcrypt only accepts up to 72 bytes
MAX_BCRYPT_BYTES = 72


def _truncate_for_bcrypt(s: str) -> str:
    b = s.encode("utf-8")[:MAX_BCRYPT_BYTES]
    return b.decode("utf-8", errors="ignore")


def hash_password(password: str) -> str:
    return pwd_context.hash(_truncate_for_bcrypt(password))


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(_truncate_for_bcrypt(plain), hashed)
