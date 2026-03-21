from passlib.context import CryptContext
from jose import jwt, ExpiredSignatureError, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer

from app.utils.date_time import current_time_utc, timedelta
from app.configs.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)    

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = current_time_utc() + timedelta(days=1)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm= settings.ALGORITHM)

def decode_access_token(token: str):

    try:
        # decode JWT
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload

    except ExpiredSignatureError:
        # token expired
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )

    except JWTError:
        # Invalid token: tampered, wrong secret, malformed, etc.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    except Exception:
        # Any other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate token",
        )

def admin_required(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_access_token(token)

        # Check admin role
        if payload.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )

        return payload

    except HTTPException:
        # Re-raise HTTP errors (especially 403)
        raise


def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_access_token(token)

        return payload

    except HTTPException:
        # Re-raise HTTP errors (especially 403)
        raise


