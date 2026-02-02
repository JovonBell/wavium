"""
JWT validation for Supabase authentication.

Uses JWKS (JSON Web Key Set) for ES256 token validation.
This is the modern approach - no shared secrets, automatic key rotation.

Why JWKS over shared secret:
- ES256 uses asymmetric keys (public key verification)
- No secret distribution required
- Automatic key rotation support
- 600ms+ faster than supabase.auth.get_user() per request
"""
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from functools import lru_cache
from typing import Dict, Any

from core.config import settings


# Security scheme for OpenAPI documentation
bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def get_jwks_client() -> PyJWKClient:
    """
    Get cached JWKS client.

    The client fetches public keys from Supabase's JWKS endpoint.
    Keys are cached by PyJWKClient (default 5 min lifespan).
    """
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url, cache_keys=True, lifespan=600)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> Dict[str, Any]:
    """
    Validate JWT token and return user payload.

    Raises HTTPException 401 if:
    - No Authorization header
    - Invalid token format
    - Token signature invalid
    - Token expired
    - Wrong audience

    Returns:
        dict: JWT payload containing sub (user ID), email, etc.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer authentication required",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )

    try:
        # Get signing key from JWKS endpoint
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(credentials.credentials)

        # Decode and validate token
        payload = jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
        return payload

    except jwt.exceptions.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )
    except jwt.exceptions.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )
    except jwt.exceptions.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )


async def get_current_user_id(
    user: Dict[str, Any] = Depends(get_current_user)
) -> str:
    """
    Extract user ID from validated JWT.

    Convenience dependency when you only need the user ID.

    Returns:
        str: Supabase user ID (UUID format)
    """
    return user["sub"]
