# Phase 2: Supabase Authentication - Research

**Researched:** 2026-02-02
**Domain:** Authentication (Supabase Auth, JWT Validation, Session Persistence, CORS)
**Confidence:** HIGH

## Summary

Phase 2 implements user authentication using Supabase Auth for the React Native/Expo frontend and JWT validation for the FastAPI backend. The research confirms the modern best practice stack: **@supabase/supabase-js** with **react-native-mmkv** for encrypted session storage on the frontend, and **PyJWT** with JWKS validation for the backend.

Key findings: (1) Supabase's ES256/JWKS is now the recommended approach over legacy HS256 JWT secrets, (2) session persistence requires custom storage adapters since AsyncStorage is being deprecated in favor of faster alternatives like MMKV, (3) deep linking is mandatory for email verification and password reset flows, and (4) CORS must be configured with specific origins for production security.

**Primary recommendation:** Use Supabase Auth with MMKV encrypted storage (encryption key in SecureStore), implement JWKS-based ES256 JWT validation on the backend with PyJWKClient caching, configure deep linking for auth callbacks, and restrict CORS to specific origins.

## Standard Stack

The established libraries/tools for this domain:

### Core - Frontend (React Native/Expo)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.x | Supabase client SDK | Official Supabase library, handles auth flows, token refresh, session management |
| react-native-mmkv | ^4.1.0 | Fast encrypted storage | 30x faster than AsyncStorage, supports AES encryption, already in project |
| expo-secure-store | latest | Keychain/Keystore access | Securely stores encryption keys, iOS Keychain / Android Keystore |
| react-native-url-polyfill | latest | URL API polyfill | Required for Supabase client on React Native |

### Core - Backend (FastAPI/Python)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PyJWT | ^2.x | JWT decoding/validation | Standard Python JWT library, supports ES256, JWKS validation |
| supabase | ^2.x | Supabase Python client | Official library for server-side operations if needed |
| cryptography | latest | Cryptographic primitives | Required by PyJWT for ES256 algorithm support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-crypto | latest | Cryptographic functions | Generating encryption keys for MMKV |
| expo-linking | latest | Deep link handling | Password reset, email verification callbacks |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-mmkv | @react-native-async-storage/async-storage | AsyncStorage is 30x slower, no native encryption support |
| PyJWT | python-jose | python-jose is more feature-rich but PyJWT is simpler and sufficient |
| Local JWT validation | supabase.auth.get_user() | get_user() makes 600ms round trip per request; local validation is instant |
| ES256 (JWKS) | HS256 (shared secret) | HS256 requires distributing secret; ES256 uses public key verification |

**Installation:**
```bash
# Frontend (Expo)
npx expo install @supabase/supabase-js react-native-url-polyfill expo-secure-store expo-crypto expo-linking

# Backend (add to requirements.txt)
PyJWT>=2.0.0
cryptography>=41.0.0  # Required for ES256 support
```

## Architecture Patterns

### Recommended Project Structure
```
wavium/
├── src/
│   ├── lib/
│   │   └── supabase.ts           # Supabase client initialization
│   ├── utils/
│   │   └── storage/
│   │       └── SessionStorage.ts # MMKV wrapper for Supabase
│   ├── hooks/
│   │   └── useAuth.ts            # Auth state hook
│   └── contexts/
│       └── AuthContext.tsx       # Auth provider component

backend/
├── core/
│   ├── config.py                 # Settings with Supabase credentials
│   └── security.py               # JWT validation dependency
├── main.py                       # FastAPI app with CORS config
└── .env                          # Supabase URL, JWT secret (dev only)
```

### Pattern 1: Encrypted Session Storage with MMKV + SecureStore
**What:** Store Supabase session in MMKV with encryption key held in SecureStore
**When to use:** Always - sessions contain sensitive tokens, MMKV handles large sessions (>2KB SecureStore limit)
**Example:**
```typescript
// src/utils/storage/SessionStorage.ts
// Source: https://ignitecookbook.com/docs/recipes/Authentication/
import { MMKV } from "react-native-mmkv"
import * as SecureStore from "expo-secure-store"
import * as Crypto from "expo-crypto"

const getOrCreateEncryptionKey = (): string => {
  const existing = SecureStore.getItem("supabase-session-key")
  if (existing) return existing

  const key = Crypto.randomUUID()
  SecureStore.setItem("supabase-session-key", key)
  return key
}

const storage = new MMKV({
  id: "supabase-session",
  encryptionKey: getOrCreateEncryptionKey(),
})

// Supabase-compatible storage interface
export const getItem = (key: string): string | null => {
  return storage.getString(key) ?? null
}

export const setItem = (key: string, value: string): void => {
  storage.set(key, value)
}

export const removeItem = (key: string): void => {
  storage.delete(key)
}
```

### Pattern 2: Supabase Client Configuration
**What:** Initialize Supabase with custom storage and proper settings for React Native
**When to use:** App initialization
**Example:**
```typescript
// src/lib/supabase.ts
// Source: https://supabase.com/docs/guides/auth/quickstarts/react-native
import "react-native-url-polyfill/auto"
import { createClient } from "@supabase/supabase-js"
import * as SessionStorage from "@/utils/storage/SessionStorage"
import { AppState } from "react-native"

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Required for React Native
  },
})

// Pause/resume token refresh based on app state
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
```

### Pattern 3: JWKS-Based JWT Validation (FastAPI)
**What:** Validate Supabase JWTs using public key from JWKS endpoint
**When to use:** All protected backend routes
**Example:**
```python
# backend/core/security.py
# Source: https://supabase.com/docs/guides/auth/signing-keys
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from functools import lru_cache
from core.config import settings

# Cache the JWKS client (keys cached for 10 minutes by Supabase edge)
@lru_cache
def get_jwks_client() -> PyJWKClient:
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url, cache_keys=True, lifespan=600)

async def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
) -> dict:
    if cred is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer authentication required",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )

    try:
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(cred.credentials)

        payload = jwt.decode(
            cred.credentials,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
        return payload
    except jwt.exceptions.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )

# Dependency for routes that need user ID
async def get_current_user_id(
    user: dict = Depends(get_current_user)
) -> str:
    return user["sub"]
```

### Pattern 4: Production CORS Configuration
**What:** Restrict CORS to specific origins instead of wildcard
**When to use:** Always in production
**Example:**
```python
# backend/main.py
# Source: https://fastapi.tiangolo.com/tutorial/cors/
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

app = FastAPI(title="Wavium API")

# Production: specific origins only
# Development: can include localhost
allowed_origins = settings.cors_origins  # From environment

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)
```

### Pattern 5: Auth State Listener with Password Recovery
**What:** Listen for auth events and handle password recovery flow
**When to use:** App root component
**Example:**
```typescript
// src/hooks/useAuth.ts
// Source: https://supabase.com/docs/reference/javascript/auth-onauthstatechange
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Session, AuthChangeEvent } from "@supabase/supabase-js"

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setSession(session)

        if (event === "PASSWORD_RECOVERY") {
          setIsPasswordRecovery(true)
        } else if (event === "SIGNED_IN") {
          setIsPasswordRecovery(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { session, loading, isPasswordRecovery }
}
```

### Pattern 6: Deep Link Configuration for Auth Callbacks
**What:** Configure URL scheme for email verification and password reset
**When to use:** Required for all email-based auth flows
**Example:**
```json
// app.json
// Source: https://supabase.com/docs/guides/auth/native-mobile-deep-linking
{
  "expo": {
    "scheme": "wavium",
    "plugins": [
      [
        "expo-linking",
        {
          "ios": {
            "scheme": "wavium"
          },
          "android": {
            "scheme": "wavium"
          }
        }
      ]
    ]
  }
}
```

```typescript
// Handle deep link in app
// Source: https://supabase.com/docs/guides/auth/native-mobile-deep-linking
import * as Linking from "expo-linking"
import { supabase } from "@/lib/supabase"

const handleDeepLink = async (url: string) => {
  const { queryParams } = Linking.parse(url)

  if (queryParams?.access_token && queryParams?.refresh_token) {
    await supabase.auth.setSession({
      access_token: queryParams.access_token as string,
      refresh_token: queryParams.refresh_token as string,
    })
  }
}
```

### Anti-Patterns to Avoid
- **Using HS256 with shared secret:** Security risk if secret is compromised; use ES256 with JWKS instead
- **Storing session in plain AsyncStorage:** Not encrypted; use MMKV with encryption
- **Calling supabase.auth.get_user() on every request:** 600ms latency; use local JWT validation
- **Using CORS wildcard `*` in production:** Security vulnerability; always specify origins
- **Blocking async operations in onAuthStateChange:** Can cause deadlocks; use setTimeout for Supabase calls
- **Skipping deep link configuration:** Email verification and password reset will fail

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT validation | Manual parsing with base64 decode | PyJWT + PyJWKClient | Signature verification, key rotation, algorithm confusion attacks |
| Session storage encryption | Manual AES encryption | MMKV with SecureStore key | Key management, secure random generation, proper IV handling |
| Token refresh | Manual timer-based refresh | Supabase autoRefreshToken | Handles network failures, token expiry edge cases, concurrent requests |
| Auth state management | Manual state tracking | onAuthStateChange listener | Handles all auth events, cross-tab sync, proper cleanup |
| Password reset flow | Custom email service | Supabase resetPasswordForEmail | Email templates, rate limiting, secure token generation |

**Key insight:** Authentication is security-critical code where subtle bugs create vulnerabilities. Supabase Auth handles email enumeration protection, timing attacks, token rotation, and many other security concerns that are easy to get wrong.

## Common Pitfalls

### Pitfall 1: Using HS256 Instead of ES256 (JWKS)
**What goes wrong:** Shared JWT secret must be distributed to all services; if compromised, attacker can forge tokens
**Why it happens:** HS256 was the default until recently; many tutorials still show it
**How to avoid:**
1. Check JWT Signing Keys page in Supabase dashboard
2. Migrate to ES256 if still on legacy secret
3. Use PyJWKClient for backend validation
**Warning signs:** `algorithms=["HS256"]` in your code, using `SUPABASE_JWT_SECRET` environment variable

### Pitfall 2: Session Not Persisting Across App Restarts
**What goes wrong:** User is logged out every time they close/reopen the app
**Why it happens:** Default storage (localStorage) doesn't exist in React Native
**How to avoid:**
1. Configure custom storage adapter (MMKV or AsyncStorage)
2. Set `persistSession: true` in client config
3. Set `detectSessionInUrl: false` for React Native
**Warning signs:** Users complaining about frequent logouts, session works in web but not mobile

### Pitfall 3: CORS Blocking API Requests
**What goes wrong:** Frontend can't reach backend; requests fail with CORS errors
**Why it happens:** CORS not configured, or configured with wrong origins
**How to avoid:**
1. List all frontend origins explicitly
2. Include both http://localhost and your production domain
3. Enable credentials if using auth headers
**Warning signs:** Network errors only in browser (not in tools like curl), "blocked by CORS policy" in console

### Pitfall 4: Deep Link Not Working for Password Reset
**What goes wrong:** User clicks reset email link but nothing happens or opens wrong app
**Why it happens:** URL scheme not registered in app.json, redirect URL not in Supabase allow list
**How to avoid:**
1. Add `scheme` to app.json
2. Add `wavium://**` to Supabase redirect URLs allow list
3. Handle incoming links with Linking.useURL()
**Warning signs:** Reset emails send successfully but clicking link opens browser, not app

### Pitfall 5: Token Refresh Draining Battery
**What goes wrong:** App continuously refreshes tokens even in background, draining battery
**Why it happens:** autoRefreshToken runs regardless of app state
**How to avoid:**
1. Listen to AppState changes
2. Call stopAutoRefresh when app goes to background
3. Call startAutoRefresh when app becomes active
**Warning signs:** High battery usage, background network activity, users complaining about battery drain

### Pitfall 6: JWKS Cache Causing Auth Failures After Key Rotation
**What goes wrong:** Valid tokens rejected after Supabase key rotation
**Why it happens:** PyJWKClient caches keys; cached key becomes invalid
**How to avoid:**
1. Set reasonable cache lifespan (600 seconds matches Supabase edge cache)
2. Handle InvalidSignatureError by clearing cache and retrying once
3. Test key rotation procedure before production
**Warning signs:** Intermittent 401 errors, auth works for some users but not others after key rotation

## Code Examples

Verified patterns from official sources:

### Complete Auth Methods
```typescript
// src/lib/auth.ts
// Source: https://supabase.com/docs/guides/auth/quickstarts/react-native
import { supabase } from "./supabase"
import * as Linking from "expo-linking"

export async function signUp(email: string, password: string) {
  const redirectUrl = Linking.createURL("auth-callback")

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  })

  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const redirectUrl = Linking.createURL("reset-password")

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })

  if (error) throw error
  return data
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
  return data
}
```

### FastAPI Protected Route Example
```python
# backend/main.py
# Source: https://fastapi.tiangolo.com/tutorial/cors/
from fastapi import FastAPI, Depends
from core.security import get_current_user, get_current_user_id

@app.post("/api/generate-affirmations", response_model=GenerateAffirmationsResponse)
async def api_generate_affirmations(
    request: GenerateAffirmationsRequest,
    user_id: str = Depends(get_current_user_id)  # Requires valid JWT
):
    """Generate personalized affirmations - requires authentication"""
    # user_id is guaranteed to be valid authenticated user
    affirmations = await generate_affirmations(request.intention)
    return GenerateAffirmationsResponse(
        affirmations=affirmations,
        intention=request.intention
    )
```

### Settings Configuration with Supabase Credentials
```python
# backend/core/config.py
# Source: https://docs.pydantic.dev/latest/concepts/pydantic_settings/
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # Supabase configuration (required)
    supabase_url: str = Field(min_length=1, description="Supabase project URL")
    supabase_anon_key: str = Field(min_length=1, description="Supabase anon/public key")

    # CORS configuration
    cors_origins: list[str] = Field(
        default=["http://localhost:8081"],  # Expo default
        description="Allowed CORS origins"
    )

    # Existing settings
    groq_api_key: str = Field(min_length=1, description="Groq API key")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HS256 JWT secret | ES256 with JWKS | 2025-2026 | Better security, no secret distribution needed |
| AsyncStorage | react-native-mmkv | 2024+ | 30x faster, native encryption support |
| supabase.auth.get_user() per request | Local JWT validation with PyJWKClient | Always preferred | 600ms -> instant validation |
| CORS wildcard "*" | Specific origins | Always was best practice | Required for security compliance |
| Manual token refresh | autoRefreshToken with AppState | Supabase 2.x | Handles edge cases, battery-efficient |

**Deprecated/outdated:**
- **HS256 JWT secret:** Still works but Supabase recommends migration to ES256
- **@react-native-async-storage/async-storage:** Works but MMKV is significantly faster
- **python-jose:** Still works but PyJWT is simpler and better maintained
- **detectSessionInUrl: true on React Native:** Causes issues; should be false

## Open Questions

Things that couldn't be fully resolved:

1. **JWKS Migration Timeline**
   - What we know: Supabase recommends ES256/JWKS, legacy HS256 still works
   - What's unclear: Whether there's a deprecation date for HS256
   - Recommendation: Implement ES256/JWKS from the start; it's more secure anyway

2. **Expo Go Limitations**
   - What we know: Google OAuth doesn't work in Expo Go, requires development build
   - What's unclear: Whether email/password auth has any Expo Go limitations
   - Recommendation: Test all auth flows in Expo Go first; build development build if issues arise

3. **Rate Limiting on Email Endpoints**
   - What we know: Supabase has rate limits (magic link: 60s cooldown, default SMTP: 2 emails/hour)
   - What's unclear: Exact rate limits for password reset and verification emails on free tier
   - Recommendation: Configure custom SMTP for production; implement client-side cooldown UI

4. **Offline Session Handling**
   - What we know: Sessions can expire if refresh fails while offline; user gets logged out
   - What's unclear: Best practice for offline-first apps that still need auth
   - Recommendation: For MVP, accept this limitation; revisit if offline support becomes requirement

## Sources

### Primary (HIGH confidence)
- [Supabase React Native Auth Quickstart](https://supabase.com/docs/guides/auth/quickstarts/react-native) - Official setup guide
- [Supabase JWT Signing Keys](https://supabase.com/docs/guides/auth/signing-keys) - JWKS and ES256 documentation
- [Supabase onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange) - Auth event handling
- [Supabase Native Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking) - Deep link setup
- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/) - Official CORS configuration
- [PyJWT Documentation](https://pyjwt.readthedocs.io/en/stable/usage.html) - JWT validation with JWKS
- [Expo Using Supabase Guide](https://docs.expo.dev/guides/using-supabase/) - Official Expo integration

### Secondary (MEDIUM confidence)
- [Ignite Cookbook: Authentication with Supabase](https://ignitecookbook.com/docs/recipes/Authentication/) - MMKV session storage pattern
- [DEV.to: Validating Supabase JWT with FastAPI](https://dev.to/zwx00/validating-a-supabase-jwt-locally-with-python-and-fastapi-59jf) - Local JWT validation approach
- [ObjectGraph: Migrating to JWKS](https://objectgraph.com/blog/migrating-supabase-jwt-jwks/) - ES256 migration guide
- [Supabase Password Reset Reference](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) - Password reset API

### Tertiary (LOW confidence - requires validation)
- [Medium: Supabase Auth Best Practices](https://medium.com/@mustafaazad03/building-a-secure-and-scalable-authentication-system-in-react-native-with-supabase-advanced-3cd76411f9f6) - General best practices
- [GitHub Discussions: JWKS Issues](https://github.com/orgs/supabase/discussions/20763) - Community troubleshooting

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are official recommendations (Supabase docs, FastAPI docs, PyJWT docs)
- Architecture: HIGH - Patterns from official documentation and verified cookbook recipes
- Pitfalls: HIGH - Documented in official sources and confirmed by community discussions

**Research date:** 2026-02-02
**Valid until:** 2026-03-04 (30 days - Supabase auth is evolving; JWKS migration ongoing)

**Key findings:**
1. ES256/JWKS is the recommended approach for JWT validation; HS256 is legacy
2. react-native-mmkv with SecureStore encryption key is the secure session storage pattern
3. Deep linking is mandatory for email verification and password reset
4. CORS must use specific origins (not wildcard) when credentials are enabled
5. Local JWT validation (PyJWKClient) is preferred over server round-trip (600ms vs instant)
6. AppState listener is required to stop token refresh in background (battery optimization)
