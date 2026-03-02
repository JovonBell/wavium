# Requirements: Wavium

**Defined:** 2026-02-02
**Core Value:** Users can create and listen to personalized subliminal audio that actually works, every single time.

## v1 Requirements

Requirements for MVP release. Each maps to roadmap phases.

### Security

- [x] **SEC-01**: Rotate Groq API key and remove from git history
- [x] **SEC-02**: Secure all secrets via environment variables with validation
- [ ] **SEC-03**: User can create account with email and password via Supabase
- [ ] **SEC-04**: User receives email verification after signup
- [ ] **SEC-05**: User can reset password via email link
- [ ] **SEC-06**: User session persists across app restarts
- [ ] **SEC-07**: All backend routes validate JWT tokens
- [ ] **SEC-08**: CORS configured for production (specific origins only)

### Database

- [ ] **DB-01**: Supabase schema created (users, subliminals, sessions, mindi_state)
- [ ] **DB-02**: User can save subliminals to library
- [ ] **DB-03**: User can view their saved subliminals
- [ ] **DB-04**: User can delete subliminals from library
- [ ] **DB-05**: User's listening sessions are recorded
- [ ] **DB-06**: User can view session history
- [ ] **DB-07**: User's streak is tracked and displayed
- [ ] **DB-08**: Mindi evolution state persists (glow level, XP)
- [ ] **DB-09**: User data syncs across devices with same account

### Core Flow

- [ ] **FLOW-01**: User completes onboarding (name Mindi, set intention)
- [ ] **FLOW-02**: User can describe intention on create screen
- [ ] **FLOW-03**: User can review AI-generated affirmations
- [ ] **FLOW-04**: User can edit affirmations before generation
- [ ] **FLOW-05**: User can select voice for audio
- [ ] **FLOW-06**: User can select background ambient sound
- [ ] **FLOW-07**: User sees real-time progress during generation
- [ ] **FLOW-08**: User can play generated audio in immersive player

### Audio

- [ ] **AUDIO-01**: Background audio assets exist (ocean, rain, forest, campfire, space, silence)
- [x] **AUDIO-02**: Audio generation works on all platforms (cross-platform paths)
- [ ] **AUDIO-03**: User can download audio for offline playback
- [ ] **AUDIO-04**: User sees clear error message when generation fails
- [ ] **AUDIO-05**: Failed generation can be retried

### Mindi Character

- [ ] **MINDI-01**: Mindi renders with Rive animation
- [ ] **MINDI-02**: Mindi has emotional states (idle, listening, peaceful, happy, excited, generating)
- [ ] **MINDI-03**: Mindi transitions smoothly between states based on app events
- [ ] **MINDI-04**: Particle effects appear when Mindi absorbs affirmations
- [ ] **MINDI-05**: Mindi's glow increases with listening sessions

### Reliability

- [x] **REL-01**: Python __init__.py files added for proper imports
- [ ] **REL-02**: FFmpeg calls wrapped with asyncio (non-blocking)
- [ ] **REL-03**: Rate limiting enforced on generation endpoints
- [ ] **REL-04**: Request validation rejects malformed input
- [ ] **REL-05**: Requests timeout gracefully (not hang forever)
- [ ] **REL-06**: Basic test coverage for audio pipeline

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Platform Expansion

- **PLAT-01**: iOS support
- **PLAT-02**: Web support (Expo Web)

### Authentication Expansion

- **AUTH-01**: Sign in with Google
- **AUTH-02**: Sign in with Apple
- **AUTH-03**: Magic link login (passwordless)

### Social Features

- **SOC-01**: Share subliminal with friends
- **SOC-02**: Public subliminal library
- **SOC-03**: User profiles

### Advanced Audio

- **ADV-01**: Custom voice upload
- **ADV-02**: Custom background upload
- **ADV-03**: Sleep timer
- **ADV-04**: Playlist/queue functionality

### Monetization

- **MON-01**: Subscription tiers
- **MON-02**: Premium voices
- **MON-03**: Usage limits for free tier

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| iOS support | Android-only for MVP, reduces testing surface |
| Web support | Mobile-first, web later |
| OAuth (Google/Apple) | Email/password sufficient for MVP |
| Real-time chat/social | Solo experience, not social network |
| Custom voice upload | Use preset voices only for MVP |
| Subscription/payments | Free during validation phase |
| Analytics/telemetry | Add after core is stable |
| Push notifications | Add after user accounts work |
| Multi-language | English only for MVP |
| Admin dashboard | Manage via Supabase console |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 1 | Complete |
| AUDIO-02 | Phase 1 | Complete |
| REL-01 | Phase 1 | Complete |
| SEC-03 | Phase 2 | Pending |
| SEC-04 | Phase 2 | Pending |
| SEC-05 | Phase 2 | Pending |
| SEC-06 | Phase 2 | Pending |
| SEC-07 | Phase 2 | Pending |
| SEC-08 | Phase 2 | Pending |
| DB-01 | Phase 3 | Pending |
| DB-02 | Phase 3 | Pending |
| DB-03 | Phase 3 | Pending |
| DB-04 | Phase 3 | Pending |
| DB-05 | Phase 3 | Pending |
| DB-06 | Phase 3 | Pending |
| DB-07 | Phase 3 | Pending |
| DB-08 | Phase 3 | Pending |
| DB-09 | Phase 3 | Pending |
| FLOW-01 | Phase 4 | Pending |
| FLOW-02 | Phase 4 | Pending |
| FLOW-03 | Phase 4 | Pending |
| FLOW-04 | Phase 4 | Pending |
| FLOW-05 | Phase 4 | Pending |
| FLOW-06 | Phase 4 | Pending |
| FLOW-07 | Phase 4 | Pending |
| FLOW-08 | Phase 4 | Pending |
| AUDIO-01 | Phase 4 | Pending |
| AUDIO-03 | Phase 4 | Pending |
| AUDIO-04 | Phase 4 | Pending |
| AUDIO-05 | Phase 4 | Pending |
| MINDI-01 | Phase 5 | Pending |
| MINDI-02 | Phase 5 | Pending |
| MINDI-03 | Phase 5 | Pending |
| MINDI-04 | Phase 5 | Pending |
| MINDI-05 | Phase 5 | Pending |
| REL-02 | Phase 6 | Pending |
| REL-03 | Phase 6 | Pending |
| REL-04 | Phase 6 | Pending |
| REL-05 | Phase 6 | Pending |
| REL-06 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0 ✓

**Phase Distribution:**
- Phase 1 (Security & Foundation): 4 requirements
- Phase 2 (Supabase Authentication): 6 requirements
- Phase 3 (Database Integration): 9 requirements
- Phase 4 (Core Flow & Audio): 12 requirements
- Phase 5 (Mindi Character Animations): 5 requirements
- Phase 6 (Reliability & Polish): 5 requirements

---
*Requirements defined: 2026-02-02*
*Last updated: 2026-02-02 after roadmap creation*
