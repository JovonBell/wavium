# Roadmap: Wavium MVP Completion

## Overview

Wavium completes its MVP by establishing a secure, persistent foundation (authentication, database, reliability fixes), integrating the core audio generation flow with user accounts, and bringing Mindi to life through Rive animations. The roadmap prioritizes security and stability before features, ensuring the audio pipeline works reliably before adding complexity.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Security & Foundation** - Fix critical security holes and platform compatibility blockers
- [ ] **Phase 2: Supabase Authentication** - Establish user accounts and JWT-based auth
- [ ] **Phase 3: Database Integration** - Connect frontend to Supabase with offline-first sync
- [ ] **Phase 4: Core Flow & Audio** - Complete generation workflow with proper asset handling
- [ ] **Phase 5: Mindi Character Animations** - Integrate Rive runtime with emotional states
- [ ] **Phase 6: Reliability & Polish** - Harden pipeline and prepare for MVP launch

## Phase Details

### Phase 1: Security & Foundation
**Goal**: Address critical security vulnerabilities and platform compatibility issues that block development
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, AUDIO-02, REL-01
**Success Criteria** (what must be TRUE):
  1. Groq API key is rotated and removed from git history
  2. All secrets loaded from environment variables with validation on startup
  3. Backend generates audio successfully on Windows, Mac, and Linux
  4. Python modules import correctly without module resolution errors
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md - Add Python __init__.py files for proper module imports
- [x] 01-02-PLAN.md - Add environment validation and cross-platform temp paths
- [x] 01-03-PLAN.md - Rotate Groq API key and clean git history

### Phase 2: Supabase Authentication
**Goal**: Users can create accounts, log in, and maintain sessions across app restarts
**Depends on**: Phase 1
**Requirements**: SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, SEC-08
**Success Criteria** (what must be TRUE):
  1. User can create account with email and password
  2. User can log in and session persists across app restarts
  3. User can reset password via email link
  4. Backend validates JWT tokens on all protected routes
  5. CORS configured for production (specific origins only, not wildcard)
**Plans**: 5 plans

Plans:
- [ ] 02-01-PLAN.md - Frontend Supabase infrastructure (client, encrypted storage, deep links)
- [ ] 02-02-PLAN.md - Backend JWT validation infrastructure (PyJWT, JWKS, CORS)
- [ ] 02-03-PLAN.md - Frontend auth implementation (auth methods, useAuth hook, AuthContext)
- [ ] 02-04-PLAN.md - Backend route protection (add JWT validation to endpoints)
- [ ] 02-05-PLAN.md - Integration verification (env templates, end-to-end testing)

### Phase 3: Database Integration
**Goal**: User data persists to Supabase and syncs across devices
**Depends on**: Phase 2
**Requirements**: DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-07, DB-08, DB-09
**Success Criteria** (what must be TRUE):
  1. User can save generated subliminals to library
  2. User can view their saved subliminals from any device
  3. User can delete subliminals from library
  4. User's listening sessions are recorded automatically
  5. User's streak count updates after completing sessions
  6. Mindi's glow level and XP persist across app restarts
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Core Flow & Audio
**Goal**: Users can complete the full workflow from intention to playback with proper audio assets
**Depends on**: Phase 3
**Requirements**: FLOW-01, FLOW-02, FLOW-03, FLOW-04, FLOW-05, FLOW-06, FLOW-07, FLOW-08, AUDIO-01, AUDIO-03, AUDIO-04, AUDIO-05
**Success Criteria** (what must be TRUE):
  1. User completes onboarding (names Mindi, sets first intention)
  2. User can describe intention and AI generates affirmations
  3. User can review and edit affirmations before generation
  4. User can select voice and background ambient sound
  5. User sees real-time generation progress with WebSocket updates
  6. Generated audio plays in immersive player with proper controls
  7. User can download audio for offline playback
  8. User sees clear error messages when generation fails and can retry
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Mindi Character Animations
**Goal**: Mindi displays emotional states and reacts to app events through Rive animations
**Depends on**: Phase 4
**Requirements**: MINDI-01, MINDI-02, MINDI-03, MINDI-04, MINDI-05
**Success Criteria** (what must be TRUE):
  1. Mindi renders with Rive animation (not static PNG)
  2. Mindi has distinct emotional states (idle, listening, peaceful, happy, excited, generating)
  3. Mindi transitions smoothly between states based on user actions
  4. Particle effects appear when user completes listening sessions
  5. Mindi's glow intensity increases visibly as user accumulates sessions
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Reliability & Polish
**Goal**: Audio pipeline is hardened against failures and ready for production load
**Depends on**: Phase 5
**Requirements**: REL-02, REL-03, REL-04, REL-05, REL-06
**Success Criteria** (what must be TRUE):
  1. FFmpeg operations run without blocking the event loop
  2. Generation endpoint rejects excessive requests with rate limiting
  3. Malformed requests return clear validation errors
  4. Generation requests timeout gracefully after 2 minutes
  5. Audio pipeline has test coverage for critical paths
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security & Foundation | 3/3 | Complete | 2026-02-02 |
| 2. Supabase Authentication | 0/5 | Ready | - |
| 3. Database Integration | 0/TBD | Not started | - |
| 4. Core Flow & Audio | 0/TBD | Not started | - |
| 5. Mindi Character Animations | 0/TBD | Not started | - |
| 6. Reliability & Polish | 0/TBD | Not started | - |

---
*Created: 2026-02-02*
*Last updated: 2026-02-02 (Phase 1 complete)*
