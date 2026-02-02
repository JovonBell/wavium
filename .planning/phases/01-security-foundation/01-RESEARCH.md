# Phase 1: Security & Foundation - Research

**Researched:** 2026-02-02
**Domain:** Security (Secrets Management, Git History Cleanup), Python Backend Configuration
**Confidence:** HIGH

## Summary

Phase 1 addresses four critical security and foundation issues: (1) exposed Groq API key in git history, (2) missing environment variable validation, (3) Windows-incompatible hardcoded `/tmp` paths, and (4) missing `__init__.py` files causing import errors.

The research confirms modern best practices: **git-filter-repo** is GitHub's officially recommended tool for removing secrets (replacing BFG and git-filter-branch), **Pydantic Settings** is the standard for FastAPI environment validation (already available since FastAPI uses Pydantic), **tempfile.TemporaryDirectory** is Python's built-in cross-platform solution, and **explicit `__init__.py` files** remain best practice despite being optional in Python 3.3+.

**Primary recommendation:** Use git-filter-repo for history cleanup, Pydantic BaseSettings for validated config, tempfile.TemporaryDirectory() context manager for cross-platform temp directories, and add explicit `__init__.py` files to all package directories.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| git-filter-repo | 2.47+ | Git history rewriting | GitHub's official recommendation, replaces git-filter-branch and BFG |
| pydantic-settings | 2.x | Environment variable validation | Official Pydantic extension, integrates seamlessly with FastAPI |
| tempfile | stdlib | Cross-platform temp files | Built into Python, no dependencies, handles all platform differences |
| python-dotenv | latest | Load .env files | Standard for local development, works with Pydantic Settings |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| groq SDK | latest | Groq API client | Already in use, needs key from validated settings |
| edge-tts | latest | TTS generation | Already in use, needs validated temp directory |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| git-filter-repo | BFG Repo-Cleaner | BFG is 10-720x faster but git-filter-repo is official GitHub recommendation with --sensitive-data-removal flag |
| git-filter-repo | git-filter-branch | filter-branch deprecated, much slower, more error-prone |
| pydantic-settings | manual os.getenv() | Manual approach has no validation, fails at runtime instead of startup |
| tempfile | os.path.join("/tmp") | Hardcoded paths fail on Windows (no /tmp directory) |

**Installation:**
```bash
# Git history cleanup tool (one-time use)
pip install git-filter-repo
# Or via Homebrew on macOS/Linux:
brew install git-filter-repo

# Backend dependencies (add to requirements.txt)
pydantic-settings>=2.0.0  # Environment validation
python-dotenv>=1.0.0      # .env file loading
```

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── services/
│   ├── __init__.py           # Package marker (explicit)
│   ├── groq_service.py       # Groq API integration
│   └── tts_service.py        # Edge-TTS integration
├── core/
│   ├── __init__.py           # Package marker
│   └── config.py             # Settings class with validation
├── main.py                   # FastAPI app entry point
└── .env                      # Local secrets (gitignored)
```

### Pattern 1: Validated Settings with Pydantic BaseSettings
**What:** Centralized configuration class that validates all environment variables on application startup
**When to use:** Always - prevents runtime failures from missing/invalid config
**Example:**
```python
# backend/core/config.py
# Source: https://docs.pydantic.dev/latest/concepts/pydantic_settings/
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # Required fields - ValidationError if missing
    groq_api_key: str = Field(min_length=1, description="Groq API key")
    supabase_url: str = Field(min_length=1, description="Supabase project URL")
    supabase_key: str = Field(min_length=1, description="Supabase anon key")

    # Optional fields with defaults
    app_name: str = "Wavium API"
    debug: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False  # Allows GROQ_API_KEY or groq_api_key
    )

# backend/main.py
# Source: https://fastapi.tiangolo.com/advanced/settings/
from functools import lru_cache
from core.config import Settings

@lru_cache
def get_settings():
    return Settings()  # Validates on first call, raises if invalid

# Initialize at startup (fail-fast)
settings = get_settings()
```

### Pattern 2: Cross-Platform Temporary Directories
**What:** Use tempfile.TemporaryDirectory context manager for automatic cleanup
**When to use:** Any time you need temporary file storage (TTS output, downloads)
**Example:**
```python
# Source: https://docs.python.org/3/library/tempfile.html
import tempfile
from pathlib import Path

async def generate_audio(affirmations: list[str], voice: str) -> str:
    # Creates platform-appropriate temp dir, auto-cleans on exit
    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = Path(tmpdir) / f"audio_{uuid.uuid4().hex[:8]}.mp3"

        # Generate audio to temp location
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(output_path))

        # Move to permanent storage if needed
        final_path = PERMANENT_STORAGE / output_path.name
        output_path.rename(final_path)

        return str(final_path)
    # tmpdir automatically deleted here
```

### Pattern 3: Git History Cleanup with git-filter-repo
**What:** Remove committed secrets using GitHub's recommended tool
**When to use:** One-time operation after secret exposure, before rotating keys
**Example:**
```bash
# Source: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

# 1. Clone fresh copy
git clone --mirror https://github.com/user/repo.git
cd repo.git

# 2. Create expressions.txt with secrets to remove
cat > expressions.txt << EOF
gsk_[a-zA-Z0-9_-]{50,}==>***REMOVED_GROQ_KEY***
EOF

# 3. Run git-filter-repo to replace secrets
git filter-repo --sensitive-data-removal --replace-text ../expressions.txt

# 4. Force push (COORDINATE WITH TEAM FIRST)
git push --force --mirror origin
```

### Pattern 4: Explicit Package Structure
**What:** Add `__init__.py` to every package directory, even if empty
**When to use:** Always - prevents ModuleNotFoundError across Python versions
**Example:**
```python
# backend/services/__init__.py
# Source: https://realpython.com/python-init-py/
"""
Services package for Wavium backend.

This package contains:
- groq_service: AI affirmation generation via Groq
- tts_service: Text-to-speech via edge-tts
"""

# Option 1: Empty file (valid, just marks package)
# (leave blank)

# Option 2: Expose public API (recommended for usability)
from .groq_service import generate_affirmations
from .tts_service import generate_audio, get_available_voices

__all__ = ["generate_affirmations", "generate_audio", "get_available_voices"]
```

### Anti-Patterns to Avoid
- **Empty string defaults for secrets:** `GROQ_API_KEY: str = ""` passes validation but fails at runtime. Use Field() with min_length or no default.
- **Hardcoded OS paths:** `/tmp` doesn't exist on Windows. Always use `tempfile` module.
- **Using mktemp():** Deprecated due to race condition vulnerabilities. Use `TemporaryDirectory()` or `NamedTemporaryFile()`.
- **Reusing compromised keys:** Even after removing from history, compromised keys must be rotated before cleanup.
- **git-filter-branch:** Officially deprecated, use git-filter-repo instead.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Environment variable validation | Manual os.getenv() with if-checks | pydantic-settings BaseSettings | Type conversion, validation errors with field names, .env file support, nested config |
| Cross-platform temp directories | os.path.join("/tmp", filename) | tempfile.TemporaryDirectory() | Handles Windows/Mac/Linux differences, automatic cleanup, secure permissions |
| Git history rewriting | Manual git commands or scripts | git-filter-repo | Handles edge cases, references cleanup, prevents reintroduction |
| API key rotation | Manual search-and-replace | Groq console + git-filter-repo | Ensures old keys are actually revoked, removes all traces |

**Key insight:** Configuration and security code is where subtle bugs hide. Use battle-tested libraries that handle edge cases (Windows paths, environment variable encoding, git ref cleanup, etc.) rather than rolling your own.

## Common Pitfalls

### Pitfall 1: Removing Secrets Without Rotating First
**What goes wrong:** Old secret still works, attacker can use it before cleanup completes
**Why it happens:** Developers focus on removing evidence, forget the key itself is compromised
**How to avoid:**
1. Rotate/revoke the secret FIRST (Groq console: https://console.groq.com/keys)
2. Update production with new secret
3. THEN clean git history
**Warning signs:** Planning to clean history before visiting API provider's console

### Pitfall 2: ValidationError on Empty Strings
**What goes wrong:** `GROQ_API_KEY: str = ""` passes Pydantic validation, fails at Groq API call
**Why it happens:** Pydantic validates type (str) not content by default
**How to avoid:** Use Field constraints: `groq_api_key: str = Field(min_length=1)` or no default for required fields
**Warning signs:** os.getenv("KEY", "") or os.getenv("KEY") or "" patterns in existing code

### Pitfall 3: Windows Path Failures
**What goes wrong:** Code works on Mac/Linux dev machines, fails in Windows production/testing
**Why it happens:** Unix assumes /tmp exists, Windows uses C:\Users\<user>\AppData\Local\Temp
**How to avoid:** Always use `tempfile.TemporaryDirectory()` or `tempfile.gettempdir()`, never hardcode paths
**Warning signs:** Literal "/tmp" strings in code, os.path.join("/tmp", ...) patterns

### Pitfall 4: Recontamination After History Cleanup
**What goes wrong:** Cleaned history gets re-polluted with old commits containing secrets
**Why it happens:** Team members merge from old branches instead of rebasing
**How to avoid:**
1. Coordinate with entire team before force-pushing
2. Require all collaborators to delete local clones and re-clone
3. Have team rebase (not merge) any in-progress branches
**Warning signs:** No team communication plan before git push --force

### Pitfall 5: Missing __init__.py in Subdirectories
**What goes wrong:** `from services.groq_service import generate_affirmations` works in IDE, fails at runtime
**Why it happens:** IDE uses different import resolution than Python interpreter
**How to avoid:** Add `__init__.py` (even empty) to every directory you import from
**Warning signs:** ModuleNotFoundError in production but not in development

### Pitfall 6: Cached Git Objects After Cleanup
**What goes wrong:** git-filter-repo cleans refs but GitHub still caches old commits
**Why it happens:** GitHub maintains caches for fork coordination and pull request history
**How to avoid:** Contact GitHub Support to purge cached commits after force-push
**Warning signs:** Old commits still visible via direct URL after cleanup

## Code Examples

Verified patterns from official sources:

### Startup Validation with Error Handling
```python
# backend/main.py
# Source: https://fastapi.tiangolo.com/advanced/settings/
from fastapi import FastAPI
from core.config import Settings
from pydantic import ValidationError

app = FastAPI(title="Wavium API")

try:
    settings = Settings()  # Validates immediately
except ValidationError as e:
    print("❌ Configuration Error - Missing/invalid environment variables:")
    for error in e.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        print(f"  - {field}: {error['msg']}")
    raise SystemExit(1)

# Use settings throughout app
from services.groq_service import create_groq_client
groq_client = create_groq_client(settings.groq_api_key)
```

### Cross-Platform Audio Output
```python
# backend/services/tts_service.py
# Source: https://docs.python.org/3/library/tempfile.html
import tempfile
import shutil
from pathlib import Path

PERMANENT_AUDIO_DIR = Path(__file__).parent.parent / "audio_output"
PERMANENT_AUDIO_DIR.mkdir(exist_ok=True)

async def generate_audio(affirmations: list[str], voice: str) -> str:
    """Generate TTS audio with cross-platform temp directory handling"""

    # Create platform-appropriate temp directory (auto-cleanup)
    with tempfile.TemporaryDirectory() as tmpdir:
        # Work in temp directory
        temp_path = Path(tmpdir) / f"audio_{uuid.uuid4().hex[:8]}.mp3"

        # Generate audio
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(temp_path))

        # Move to permanent storage
        final_path = PERMANENT_AUDIO_DIR / temp_path.name
        shutil.move(str(temp_path), str(final_path))

        return str(final_path)
    # tmpdir cleaned up automatically, even if exception occurs
```

### Safe Settings Access with Dependency Injection
```python
# backend/main.py
# Source: https://fastapi.tiangolo.com/advanced/settings/
from functools import lru_cache
from typing import Annotated
from fastapi import Depends

@lru_cache  # Settings created once, cached for app lifetime
def get_settings():
    return Settings()

@app.post("/api/generate-affirmations")
async def generate_affirmations(
    request: GenerateAffirmationsRequest,
    settings: Annotated[Settings, Depends(get_settings)]
):
    # settings.groq_api_key is guaranteed to be valid string
    # (validated at startup, not per-request)
    affirmations = await groq_service.generate(
        intention=request.intention,
        api_key=settings.groq_api_key
    )
    return {"affirmations": affirmations}
```

### Complete Git History Cleanup Workflow
```bash
# Source: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

# STEP 1: Rotate the compromised secret
# Go to https://console.groq.com/keys
# Click trash icon on old key, create new key, update .env

# STEP 2: Install git-filter-repo
pip install git-filter-repo

# STEP 3: Clone fresh mirror (not regular clone)
git clone --mirror https://github.com/yourusername/wavium.git
cd wavium.git

# STEP 4: Backup (in case something goes wrong)
cd ..
cp -r wavium.git wavium.git.backup
cd wavium.git

# STEP 5: Create patterns file for secret replacement
cat > ../expressions.txt << 'EOF'
gsk_[a-zA-Z0-9_-]{50,}==>***REMOVED_GROQ_KEY***
EOF

# STEP 6: Run git-filter-repo to rewrite history
git filter-repo --sensitive-data-removal --replace-text ../expressions.txt

# STEP 7: Verify changes (check a few commits)
git log --all --full-history --grep="REMOVED_GROQ_KEY"

# STEP 8: Force push (COORDINATE WITH TEAM FIRST!)
git push --force --mirror origin

# STEP 9: Clean local checkouts
cd ../..
rm -rf wavium.git
git clone https://github.com/yourusername/wavium.git

# STEP 10: Notify team to delete and re-clone
# Everyone must: rm -rf wavium && git clone <url>

# STEP 11: Contact GitHub Support to purge cached objects
# https://support.github.com/contact - request purge for security
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| git-filter-branch | git-filter-repo | ~2019 | 10-100x faster, official GitHub recommendation, simpler syntax |
| BFG Repo-Cleaner | git-filter-repo | ~2021 | Official GitHub docs now recommend filter-repo (though BFG still works) |
| Manual os.getenv() validation | Pydantic BaseSettings | ~2020 | Type-safe, fails at startup, better error messages |
| Hardcoded /tmp paths | tempfile module | Always standard | Windows compatibility, security (proper permissions) |
| Optional __init__.py (PEP 420) | Explicit __init__.py | Python 3.3+ allows implicit, but explicit remains best practice | Clarity, IDE support, explicit package API |

**Deprecated/outdated:**
- **git-filter-branch:** Officially deprecated in favor of git-filter-repo
- **tempfile.mktemp():** Removed from docs, security vulnerability (race condition)
- **Empty string defaults for secrets:** Pydantic 2.0+ encourages Field() constraints for validation

## Open Questions

Things that couldn't be fully resolved:

1. **GitHub Cached Commits Timeline**
   - What we know: GitHub caches commit objects even after force-push
   - What's unclear: How long it takes GitHub Support to purge caches
   - Recommendation: File support ticket immediately after force-push, assume 24-48 hour turnaround

2. **Production Secret Management**
   - What we know: .env files work for development, need production strategy
   - What's unclear: Whether deploying to cloud (needs cloud secrets manager) or self-hosted
   - Recommendation: Plan Phase 2 should address production secrets (AWS Secrets Manager, GCP Secret Manager, or similar based on deployment target)

3. **Supabase Key Exposure**
   - What we know: Groq key confirmed exposed in history
   - What's unclear: Whether Supabase keys are also in history (need git log check)
   - Recommendation: During implementation, check for any other API keys in history before cleanup

## Sources

### Primary (HIGH confidence)
- [GitHub Docs: Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) - Official GitHub recommendation for git-filter-repo
- [Pydantic Settings Documentation](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) - Official Pydantic Settings patterns
- [FastAPI Settings Management](https://fastapi.tiangolo.com/advanced/settings/) - Official FastAPI integration with Pydantic Settings
- [Python tempfile Documentation](https://docs.python.org/3/library/tempfile.html) - Official stdlib documentation for cross-platform temp files
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) - Official BFG documentation (alternative to git-filter-repo)
- [Real Python: Python __init__.py](https://realpython.com/python-init-py/) - Comprehensive guide to package structure
- [Groq API Keys Console](https://console.groq.com/keys) - Official Groq key management interface

### Secondary (MEDIUM confidence)
- [How to Rotate Groq API Keys](https://howtorotate.com/docs/tutorials/groq/) - Step-by-step rotation guide
- [GitGuardian: Groq API Key Detection](https://docs.gitguardian.com/secrets-detection/secrets-detection-engine/detectors/specifics/groq_api_key) - Secret scanning patterns
- [TheLinuxCode: Python tempfile Patterns](https://thelinuxcode.com/python-tempfile-module-practical-patterns-pitfalls-and-real-world-use/) - Practical patterns (updated 2026)
- [ArjanCodes: Python Package Structure](https://arjancodes.com/blog/organizing-python-code-with-packages-and-modules/) - Modern best practices

### Secondary (LOW confidence - requires validation)
- [FreeCodeCamp: ModuleNotFoundError](https://www.freecodecamp.org/news/module-not-found-error-in-python-solved/) - Common solutions for import errors
- [Towards Data Science: Pydantic Environment Variables](https://towardsdatascience.com/manage-environment-variables-with-pydantic/) - Tutorial-style guide

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools are official recommendations (GitHub recommends git-filter-repo, Pydantic Settings is official, tempfile is stdlib)
- Architecture: HIGH - Patterns verified from official documentation (FastAPI docs, Python docs, Pydantic docs)
- Pitfalls: HIGH - Documented in official sources (GitHub warns about recontamination, Python docs show mktemp deprecation, Pydantic docs explain validation)

**Research date:** 2026-02-02
**Valid until:** 2026-04-02 (60 days - stable domain, established best practices unlikely to change)

**Key findings:**
1. git-filter-repo with --sensitive-data-removal flag is GitHub's official recommendation (replaces BFG)
2. Pydantic BaseSettings provides startup validation with clear error messages for missing secrets
3. tempfile.TemporaryDirectory() solves cross-platform path issues automatically
4. Explicit __init__.py files remain best practice despite being optional since Python 3.3
5. Key rotation MUST happen before history cleanup to prevent security window
