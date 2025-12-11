from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.hash import md5_crypt
from app.config import settings

# Setup password context
# pgcrypto's crypt() often uses MD5 ($1$) or BF ($2a$). The example given is $1$, so MD5.
pwd_context = CryptContext(schemes=["md5_crypt", "bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    if hashed_password.startswith("$1$"):
        # It's an MD5 crypt hash from postgres
        return md5_crypt.verify(plain_password, hashed_password)
    # Fallback or other schemes if needed
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
