# Wavium — Product Requirements Document v2.0

**Version**: 2.0  
**Last Updated**: December 31, 2025  
**Status**: Ready for Development  
**Design Philosophy**: A+ Premium Experience with Emotional Connection

---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design Vision: Beyond VibeSesh](#2-design-vision-beyond-vibesesh)
3. [Meet Mindi: The Mascot](#3-meet-mindi-the-mascot)
4. [Problem & Solution](#4-problem--solution)
5. [Target Users](#5-target-users)
6. [User Journey](#6-user-journey)
7. [Feature Requirements](#7-feature-requirements)
8. [Screen Specifications](#8-screen-specifications)
9. [Technical Architecture](#9-technical-architecture)
10. [API Specifications](#10-api-specifications)
11. [Data Models](#11-data-models)
12. [Design System](#12-design-system)
13. [Animation & Interaction Guide](#13-animation--interaction-guide)
14. [MVP Scope](#14-mvp-scope)
15. [Success Metrics](#15-success-metrics)
16. [Future Roadmap](#16-future-roadmap)

---

## 1. Executive Summary

### Product Name
**Wavium** — AI-Powered Subliminal Audio Creator

### One-Liner
Create personalized subliminal audio in 60 seconds by simply describing what you want — then watch your mind heal.

### What Makes This A+ (Not C)

| VibeSesh (C Grade) | Wavium (A+ Grade) |
|--------------------|-----------------------|
| Static UI | Living, breathing interface |
| Generic visualizer | **Mindi** — emotional mascot that heals while you listen |
| Basic animations | Micro-interactions on EVERYTHING |
| Functional | **Delightful** — makes you smile |
| Transactional | Relationship-building |
| Forgettable | "I can't disappoint Mindi" |

### Core Emotional Hook
> "You're not just listening to audio. You're healing Mindi — and yourself."

Like Focus Friend's Bean that knits while you focus, and Finch's bird that grows when you complete tasks, **Mindi** (your brain companion) absorbs positive energy while you listen to subliminals. Users will return daily because they've formed an emotional bond.

---

## 2. Design Vision: Beyond VibeSesh

### Why VibeSesh is a C

VibeSesh has good bones but lacks soul:
- Generic dark theme (could be any app)
- Static elements that don't respond to touch
- No personality or character
- Functional but not delightful
- No emotional hook to bring users back

### What Makes an A+ Wellness App

**Finch's Magic Formula:**
- Character tilts head to mimic active listening
- Idle animations (preening, looking around) make it feel alive
- Sparkle/confetti celebrations for achievements
- Haptic feedback mimics physical touch
- Character grows and evolves with you

**Focus Friend's Magic Formula:**
- Simple looping animation (Bean knits)
- Emotional manipulation ("Don't disappoint Bean!")
- Reward system tied to character
- Screen-off simplicity during focus time

**Headspace's Magic Formula:**
- Soft, rounded shapes (psychological comfort)
- Breathing animations in UI
- Playful illustrations with personality
- Progression that feels meaningful

### Wavium's A+ Design Pillars

1. **Living UI** — Nothing is static. Everything breathes, pulses, responds.
2. **Emotional Mascot** — Mindi creates attachment and daily return.
3. **Sensory Richness** — Haptics, particles, sound design, smooth 60fps.
4. **Premium Feel** — Glassmorphism, depth, sophisticated palette.
5. **Celebration** — Every action feels rewarding.

---

## 3. Meet Mindi: The Mascot

### Character Concept

**Mindi** is a cute, round brain character with a gentle, peaceful face. Unlike workout-focused brain mascots (lifting weights), Mindi represents **healing, calm, and growth**.

### Why "Mindi"?
- Sounds like "mind" + friendly diminutive
- Gender-neutral, approachable
- Easy to say, easy to remember
- Users can rename if they want

### Character Design

```
Visual Description:
- Shape: Soft, rounded brain silhouette (simplified, not anatomically gross)
- Size: Fits comfortably in circular player visualizer area
- Face: Two closed/peaceful eyes, gentle smile
- Color: Soft pink/lavender gradient base
- Glow: Subtle inner glow that pulses
- Details: Small sparkle accents, no hard edges

Style Reference:
- Finch bird's softness
- Headspace's rounded aesthetic
- NOT cartoon brain with arms/legs
- Think: Kirby meets meditation app
```

### Mindi's States & Animations

**1. Idle State (Library/Home)**
- Gentle floating bob (like breathing)
- Occasional slow blink
- Soft ambient glow
- Sometimes looks around curiously

**2. Listening State (Player Active)**
- Eyes peacefully closed
- Surrounded by soft particle aura
- Neurons/pathways light up rhythmically
- Absorbing orbs float toward Mindi (representing affirmations)
- Gentle pulsing in sync with ambient audio
- Expression: Pure bliss

**3. Session Complete**
- Eyes open with delight
- Big smile
- Confetti/sparkle celebration
- Brief "powered up" glow
- Shows progress indicator

**4. Greeting State (App Open)**
- Wakes up animation
- Happy to see user
- Subtle wave or bounce
- Personalized greeting based on time of day

**5. Waiting State (Between Actions)**
- Looking at user expectantly
- Occasional head tilt
- Idle animations (like Finch's preening)

**6. Creating State (Generating Subliminal)**
- Excited anticipation
- Watching the progress
- Building energy

### Emotional Engineering

**The Hook: Reciprocal Care**
> "Take care of Mindi by taking care of your mind."

Users listen to subliminals → Mindi absorbs positive energy → Mindi glows brighter → User feels good → User returns

**Progress System:**
- Mindi's glow/aura gets stronger over time
- Unlockable Mindi accessories (premium)
- Mindi's home environment evolves
- Streaks increase Mindi's happiness

**Daily Return Triggers:**
- "Mindi misses you" notifications (tasteful)
- "Mindi has been waiting to help you heal"
- Streak system with Mindi reactions

### Technical Implementation

```
Animation Format: Lottie/Rive
- Lottie for simpler state animations
- Rive for interactive, state-based complexity
- Or: React Native Animated for basic version

Particle System:
- Lightweight particle library
- Orbs floating toward Mindi during playback
- Sparkles on celebrations

Performance:
- Pre-render complex animations
- 60fps target
- Battery-conscious (reduce when not visible)
```

---

## 4. Problem & Solution

### The Problem
People want to create their own subliminal audio but face major barriers:

1. **Technical Complexity**: Creating subliminals requires Audacity, audio plugins, engineering knowledge
2. **Trust Issues**: YouTube creators exposed for negative affirmations — users don't know what they're listening to
3. **Poor Existing Apps**: Buggy, ad-filled, broken features, expensive
4. **Generic Content**: Pre-made subliminals don't address specific, personal goals
5. **No Emotional Hook**: Existing apps are transactional, not relationship-building

### The Solution

| Problem | Wavium Solution |
|---------|---------------------|
| Too technical | Chat with AI in plain English |
| Trust issues | Full transparency — see every affirmation |
| Buggy apps | Modern, reliable tech stack |
| Generic content | AI personalizes to YOUR situation |
| No emotional hook | **Mindi** — your brain companion who heals with you |

---

## 5. Target Users

### Primary Persona: "The Self-Improver"
- **Age**: 18-35
- **Profile**: Interested in manifestation, law of attraction, personal development
- **Behavior**: Already listens to subliminals, wants something personalized
- **Emotional Need**: Wants to feel like they're doing something for themselves
- **What Hooks Them**: Mindi's personality, seeing their mind "heal"

### Secondary Persona: "The Skeptical Beginner"
- **Age**: 25-45
- **Profile**: Curious about subliminals but skeptical
- **Emotional Need**: Needs permission to try "woo-woo" stuff
- **What Hooks Them**: AI legitimacy, transparency, cute mascot makes it approachable

### Why Mindi Works for Both
- Self-improvers: Mindi is a companion on their journey
- Skeptics: Mindi makes subliminals feel less weird, more friendly

---

## 6. User Journey

### First-Time User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    🌟 ONBOARDING (MAGICAL)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Splash Animation                                             │
│     - App logo morphs into Mindi                                 │
│     - Mindi wakes up, looks at camera                           │
│     - "Hi! I'm Mindi. I'll help heal your mind."                │
│     - Haptic: Gentle pulse                                       │
│                                                                  │
│  2. Name Your Mindi (Optional)                                   │
│     - "What would you like to call me?"                         │
│     - Default: "Mindi"                                          │
│     - Mindi reacts happily to name                              │
│                                                                  │
│  3. Goal Selection                                               │
│     - "What do you want to transform?"                          │
│     - Cards with icons + subtle animations                      │
│     - Mindi floats beside selected card                         │
│     - Haptic: Selection confirmation                            │
│                                                                  │
│  4. How Subliminals Work (Trust Building)                        │
│     - "Did you know?"                                           │
│     - Conscious vs Subconscious visual                          │
│     - Mindi demonstrates "absorbing" affirmations               │
│     - "That's what I do — I help your mind absorb positivity"   │
│                                                                  │
│  5. First Subliminal Teaser                                      │
│     - "Let's create your first subliminal together!"            │
│     - Mindi excited animation                                   │
│     - Transition to Create screen                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      ✨ CREATE SUBLIMINAL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  6. Chat Interface                                               │
│     - Mindi appears as small avatar in corner                   │
│     - Mindi "listens" while user types (head tilt)              │
│     - AI generates affirmations                                 │
│     - Mindi reacts: "These sound perfect for you!"              │
│                                                                  │
│  7. Customize                                                    │
│     - Voice selection (Mindi previews each)                     │
│     - Background audio selection                                │
│     - Mindi "tests" each option with you                        │
│                                                                  │
│  8. Generation                                                   │
│     - Mindi watches progress excitedly                          │
│     - "Preparing your healing session..."                       │
│     - Progress bar with particle effects                        │
│                                                                  │
│  9. Ready!                                                       │
│     - Mindi celebration animation                               │
│     - Confetti burst                                            │
│     - "Your subliminal is ready! Let's heal together."          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     🎧 PLAYER (THE MAGIC)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  10. Player Screen                                               │
│     - Mindi is center stage (replaces generic visualizer)       │
│     - Mindi in "listening state":                               │
│       • Eyes closed, peaceful expression                        │
│       • Soft glow pulsing                                       │
│       • Particle orbs floating toward Mindi                     │
│       • Neurons occasionally light up                           │
│     - This is THE MAIN FEATURE — watching Mindi heal            │
│                                                                  │
│  11. Session Complete                                            │
│     - Mindi opens eyes, smiles                                  │
│     - "That felt amazing!"                                      │
│     - Streak counter updates                                    │
│     - Mindi's glow is slightly stronger                         │
│                                                                  │
│  12. View Affirmations (Transparency)                            │
│     - Always accessible                                         │
│     - Full list of what's in the track                          │
│     - Mindi: "Here's what we absorbed today"                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      📚 LIBRARY & HOME                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  13. Library                                                     │
│     - Grid of subliminals with mini Mindi states               │
│     - Each card shows related imagery                           │
│     - Quick play, Mindi appears on selected card               │
│                                                                  │
│  14. Home/Dashboard                                              │
│     - Mindi greeting based on time of day                       │
│     - "Good morning! Ready to heal?"                            │
│     - Quick stats: streak, total listening time                 │
│     - Mindi's current "glow level" progress                    │
│     - Recent subliminals for quick access                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Feature Requirements

### P0 — Must Have (MVP)

| Feature | Description | Emotional Element |
|---------|-------------|-------------------|
| **Mindi Mascot** | Animated character with states | Core emotional hook |
| **Onboarding** | Name Mindi + goal selection | Relationship building |
| **AI Chat** | Describe goal, get affirmations | Mindi "listens" |
| **Audio Generation** | Create subliminal track | Mindi anticipation |
| **Player with Mindi** | Mindi as visualizer, absorbing | THE main feature |
| **Session Complete** | Celebration animation | Reward feeling |
| **View Affirmations** | Transparency feature | Trust building |
| **Library** | Store/access subliminals | Mindi on each card |
| **Streaks** | Daily listening counter | Return motivation |

### P1 — Should Have (Post-MVP)

| Feature | Emotional Element |
|---------|-------------------|
| Mindi accessories/customization | Personalization, investment |
| Push notifications with Mindi | "Mindi misses you" |
| Mindi home environment | Progression, decoration |
| Record own voice | Deeper personalization |
| Sleep timer | Practical utility |
| Offline downloads | Convenience |

### P2 — Nice to Have (Future)

| Feature | Emotional Element |
|---------|-------------------|
| Mindi friends (other characters) | Community |
| Mindi evolution stages | Long-term progression |
| Share Mindi stats | Social proof |
| Voice cloning | Ultimate personalization |
| Binaural beats layer | Advanced features |

---

## 8. Screen Specifications

### Screen 1: Splash / Mindi Intro

**Purpose**: Create magical first impression, introduce Mindi

**Animation Sequence** (3-4 seconds):
1. App logo fades in (0.5s)
2. Logo morphs/transitions to Mindi (1s)
3. Mindi "wakes up" — eyes open, looks at camera (0.5s)
4. Mindi gentle wave/bounce (0.5s)
5. Text fades in: "Hi! I'm Mindi." (0.5s)

**Design Notes**:
- Dark background with subtle gradient
- Mindi centered, takes up 40% of screen
- Soft ambient glow around Mindi
- Haptic: Gentle double-pulse when Mindi wakes

---

### Screen 2: Name Your Mindi

**Purpose**: Create ownership and attachment

**Layout**:
- Mindi centered (curious expression)
- Text: "What would you like to call me?"
- Text input field
- Default suggestion: "Mindi"
- [Continue] button

**Behavior**:
- As user types, Mindi watches curiously
- On submit, Mindi reacts happily
- Mindi says: "I love it! I'm [Name]!"
- Haptic: Celebration pulse

---

### Screen 3: Goal Selection

**Purpose**: Understand user's primary goal, Mindi reacts

**Layout**:
- Mindi floating in corner (small, attentive)
- Question: "What do you want to transform?"
- 6 cards in 2x3 grid (animated icons)

**Cards**:
```
💪 Confidence       💰 Wealth
❤️ Relationships    🧠 Focus  
😴 Sleep            ✨ Custom
```

**Behavior**:
- Cards have subtle hover/floating animation
- On tap: Card glows, Mindi floats to that card
- Mindi: "Great choice! I can help with that."
- Haptic: Selection confirmation
- Auto-advance after 1s delay

---

### Screen 4: How Subliminals Work

**Purpose**: Build trust, show Mindi's role

**Layout**:
- Mindi centered with visual diagram
- Conscious vs Subconscious comparison
- Animated demo of Mindi "absorbing" text

**Content**:
```
"Did you know?"

[Visual: Two bars]
Conscious Mind: 40 bits/second
Subconscious: 11 MILLION bits/second

[Animation: Text particles floating toward Mindi]

"That's what I do — I help your subconscious 
absorb positive affirmations while you relax."

[Mindi glows happily]
```

**Behavior**:
- Animated particles flow toward Mindi
- Mindi "absorbs" them, glows slightly
- Shows the core mechanic in action

---

### Screen 5: Create / Chat Interface

**Purpose**: AI conversation to generate affirmations

**Layout**:
- Top: Header with "Create Subliminal"
- Top-right corner: Small Mindi avatar (listening state)
- Middle: Chat message area
- Bottom: Text input

**Mindi Behavior**:
- Mindi is small (50px) in corner
- When user types: Mindi tilts head, "listening"
- When AI responds: Mindi looks at the message
- On affirmation generation: Mindi excited, "These are perfect!"

**Chat Flow**:
```
MINDI (greeting bubble): "Tell me what you want to work on. 
I'll help create the perfect affirmations! ✨"

USER: "I want to feel confident in social situations"

AI: "Here are personalized affirmations for social confidence:

✓ I am naturally confident in every social situation
✓ People enjoy my company and value my presence
✓ I speak with clarity and genuine warmth
✓ Social interactions energize and fulfill me
✓ I radiate authentic confidence wherever I go
✓ I am worthy of connection and belonging
✓ Every conversation flows naturally for me

Would you like me to adjust these?"

MINDI (small bubble): "These feel right for you! 🧠✨"

[Edit] [Add More] [Looks Great →]
```

---

### Screen 6: Customize

**Purpose**: Select voice, background, duration

**Layout**:
- Header with back button
- Mindi floating beside current selection
- Three sections: Voice, Background, Duration

**Voice Selection**:
```
┌─────────────────────────────────────────┐
│ Choose Voice                            │
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ 🎙️  │ │ 🎙️  │ │ 🎙️  │ │ 🎙️  │       │
│  │Jenny│ │ Guy │ │Aria │ │Sonia│       │
│  │Warm │ │Calm │ │Soft │ │UK   │       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
│      ↑ Selected (glowing border)        │
│                                         │
│  [▶ Preview Voice]                      │
└─────────────────────────────────────────┘
```

**Mindi Behavior**:
- When preview plays, Mindi "listens" along
- On voice selection, Mindi nods approvingly
- Mindi: "This voice feels calming" (contextual)

---

### Screen 7: Generation / Loading

**Purpose**: Show progress while generating

**Layout**:
- Mindi centered, excited/anticipating state
- Progress ring around Mindi
- Status text below

**Animation**:
- Mindi looking up expectantly
- Particles building around Mindi
- Progress ring fills
- Energy accumulating

**Status Messages** (rotate):
```
"Crafting your affirmations..."
"Generating voice audio..."
"Mixing with background..."
"Mindi is getting ready..."
"Almost there..."
```

---

### Screen 8: Ready / Success

**Purpose**: Celebrate creation, prompt listening

**Layout**:
- Mindi celebration animation (center)
- Confetti burst
- Summary card
- Two CTAs

**Animation Sequence**:
1. Progress hits 100%
2. Flash/burst effect
3. Confetti explodes
4. Mindi eyes open wide, big smile
5. Mindi does happy bounce
6. Text: "Your subliminal is ready!"
7. Haptic: Celebration pattern

**Summary Card**:
```
┌─────────────────────────────────────┐
│ 📝 7 affirmations                   │
│ 🎙️ Voice: Jenny (Warm)              │
│ 🌧️ Background: Rain                 │
│ ⏱️ Duration: 30 minutes             │
└─────────────────────────────────────┘
```

**CTAs**:
- Primary: "Listen with Mindi"
- Secondary: "Save for Later"

---

### Screen 9: Player (THE MAIN EVENT)

**Purpose**: THE core experience — listening while Mindi heals

**Layout**:
- Full screen, immersive
- Mindi takes center stage (large)
- Controls at bottom
- Minimal UI — focus on Mindi

**Mindi Player State**:
```
┌─────────────────────────────────────────────────────────────┐
│                        Now Playing                    [↓]   │
│                                                             │
│                                                             │
│                     ╭──────────────╮                       │
│                    │   ✧  ✧  ✧    │  ← Floating particles  │
│                   │    ◠    ◠     │  ← Eyes closed         │
│          ✧        │      ◡        │  ← Peaceful smile      │
│             ○     │  ～～～～～    │  ← Soft glow           │
│           ○       │               │                        │
│              ○    ╰──────────────╯  ← Pulsing aura         │
│         ○                    ○                              │
│              ○        ○                                     │
│                                                             │
│              "Interview Confidence"                         │
│                   12:34 / 30:00                             │
│           ───────────●──────────────                        │
│                                                             │
│          [ ⏪ ]      [ ▶ ]      [ ⏩ ]                      │
│                                                             │
│   🔁 Loop    ⏰ Timer    📜 Affirmations    🔊 Volume       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Mindi Animations During Playback**:
1. **Breathing Glow**: Mindi's aura gently pulses (1-2 second cycle)
2. **Particle Absorption**: Small orbs drift toward Mindi, get absorbed
3. **Neuron Flashes**: Occasional subtle "synapse" lights inside Mindi
4. **Peaceful Expression**: Eyes closed, slight smile
5. **Subtle Float**: Very gentle vertical movement

**Technical Notes**:
- Particles: 10-15 orbs floating at any time
- Performance: Pre-render, optimize for battery
- Haptic: Optional subtle pulse sync (can disable)

---

### Screen 10: Session Complete

**Purpose**: Celebrate, reinforce habit, show progress

**Trigger**: Audio finishes or user reaches milestone

**Animation Sequence**:
1. Mindi's eyes flutter open
2. Big smile spreads
3. "Powered up" flash effect
4. Confetti burst (smaller than creation)
5. Progress update

**Content**:
```
"Session Complete! ✨"

[Mindi glowing brightly]

"That was a 15-minute healing session!
You've listened for 2 hours this week."

🔥 3-day streak!

[Listen Again]  [Done]
```

---

### Screen 11: Home / Dashboard

**Purpose**: Daily landing, relationship with Mindi

**Layout**:
- Top: Mindi greeting (large)
- Middle: Quick stats
- Bottom: Recent subliminals + Create CTA

**Time-Based Greetings**:
```
Morning (5am-12pm):
Mindi (stretching/waking): "Good morning! Ready to set positive intentions?"

Afternoon (12pm-5pm):
Mindi (alert): "Hey there! Need a midday mind boost?"

Evening (5pm-9pm):
Mindi (relaxed): "Winding down? Let's do some healing."

Night (9pm-5am):
Mindi (sleepy): "Can't sleep? I'll help you relax..."
```

**Stats Display**:
```
┌─────────────────────────────────────────┐
│  🔥 5-day streak    ⏱️ 4.5 hours total  │
│                                         │
│  Mindi's Glow: ████████░░ Level 8       │
└─────────────────────────────────────────┘
```

---

### Screen 12: View Affirmations Modal

**Purpose**: Full transparency — THE differentiator

**Layout**:
- Slide-up modal
- Mindi at top (explaining)
- Scrollable list of affirmations

**Content**:
```
┌─────────────────────────────────────────┐
│                                    [✕]  │
│                                         │
│    [Mindi small, happy]                │
│    "Here's everything in this track"    │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ✓ I am naturally confident in every   │
│    social situation                     │
│                                         │
│  ✓ People enjoy my company and value   │
│    my presence                          │
│                                         │
│  ✓ I speak with clarity and genuine    │
│    warmth                               │
│                                         │
│  ✓ Social interactions energize and    │
│    fulfill me                           │
│                                         │
│  ... (scrollable)                       │
│                                         │
└─────────────────────────────────────────┘
```

---

## 9. Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       MOBILE APP                                 │
│                   (React Native + Expo)                          │
│                                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│   │ Screens  │  │  Mindi   │  │  Stores  │  │  Theme   │       │
│   │          │  │ Animator │  │ (Zustand)│  │          │       │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                      ↓                                          │
│             ┌───────────────┐                                   │
│             │ Lottie / Rive │ ← Mindi animations                │
│             └───────────────┘                                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND API                                │
│                   (Python + FastAPI)                             │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  POST /api/chat           — AI conversation               │  │
│   │  POST /api/generate       — Create subliminal audio       │  │
│   │  GET  /api/subliminals    — List user's subliminals       │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   │ Groq Service │  │ TTS Service  │  │Audio Service │         │
│   │ (LLM)        │  │ (edge-tts)   │  │ (FFmpeg)     │         │
│   └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Mobile** | React Native + Expo | Cross-platform |
| **Animations** | Lottie or Rive | Mindi animations |
| **Particles** | react-native-particles | Floating orbs |
| **Haptics** | expo-haptics | Tactile feedback |
| **State** | Zustand | Simple state management |
| **Audio** | expo-av | Background playback |
| **Backend** | FastAPI (Python) | API server |
| **LLM** | Groq (Llama 3.1 8B) | AI chat |
| **TTS** | edge-tts | FREE voice generation |
| **Audio** | FFmpeg | Mixing |
| **Database** | Supabase | PostgreSQL |
| **Storage** | Cloudflare R2 | Audio files |

### Mindi Animation Implementation

**Option A: Lottie (Simpler)**
```javascript
import LottieView from 'lottie-react-native';

<LottieView
  source={require('./animations/mindi-listening.json')}
  autoPlay
  loop
/>
```
- Pros: Easy to implement, good performance
- Cons: Limited interactivity, need multiple files for states

**Option B: Rive (Recommended)**
```javascript
import Rive from 'rive-react-native';

<Rive
  resourceName="mindi"
  stateMachineName="MindiStates"
  onStateChange={(state) => handleMindiState(state)}
/>
```
- Pros: Single file, state machine, interactive, responds to inputs
- Cons: Slightly more complex

**Particle System**
```javascript
import ParticleSystem from 'react-native-particles';

// Floating orbs toward Mindi
<ParticleSystem
  count={15}
  speed={2}
  direction="center"
  style={styles.particleContainer}
/>
```

---

## 10. API Specifications

(Same as v1 PRD — no changes needed)

---

## 11. Data Models

### Mindi State
```
MindiState {
  name: string           // User's name for Mindi
  glow_level: number     // 1-100, increases with use
  current_streak: number // Days in a row
  total_listening_minutes: number
  last_session_at: timestamp
  accessories: string[]  // Future: purchased items
}
```

### User
```
User {
  id: string
  created_at: timestamp
  goal_category: string
  mindi: MindiState
  preferences: {
    default_voice: string
    default_background: string
    haptics_enabled: boolean
    notifications_enabled: boolean
  }
}
```

### Subliminal
```
Subliminal {
  id: string
  user_id: string
  title: string
  audio_url: string
  duration_seconds: number
  voice: string
  background: string
  affirmations: string[]
  play_count: number
  created_at: timestamp
}
```

---

## 12. Design System

### Color Palette (Premium Dark)

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | #0a0a12 | Main background |
| `backgroundAlt` | #12121e | Elevated cards |
| `surface` | #1a1a2e | Cards, inputs |
| `surfaceGlow` | rgba(139,92,246,0.1) | Subtle glows |
| `primary` | #a78bfa | Primary accent (soft purple) |
| `primaryLight` | #c4b5fd | Lighter purple |
| `secondary` | #60a5fa | Secondary (soft blue) |
| `accent` | #f0abfc | Highlight (pink-purple) |
| `mindiPink` | #fbc7d4 | Mindi base color |
| `mindiGlow` | #e879f9 | Mindi aura |
| `textPrimary` | #ffffff | Main text |
| `textSecondary` | #a1a1aa | Muted text |
| `success` | #34d399 | Success states |

### Typography

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| `h1` | 28px | Bold | Screen titles |
| `h2` | 22px | Semibold | Section headers |
| `h3` | 18px | Semibold | Card titles |
| `body` | 16px | Regular | Main text |
| `bodySmall` | 14px | Regular | Secondary text |
| `caption` | 12px | Regular | Labels, timestamps |
| `mindi` | 16px | Medium | Mindi's speech |

**Font**: Inter (or system default)

### Spacing

| Token | Value |
|-------|-------|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |
| `2xl` | 48px |

### Shadows & Glow

```css
/* Soft glow for cards */
shadowGlow: {
  shadowColor: '#a78bfa',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.15,
  shadowRadius: 20,
}

/* Mindi glow */
mindiGlow: {
  shadowColor: '#e879f9',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.4,
  shadowRadius: 30,
}
```

### Component Styles

**Primary Button**:
```css
{
  background: linear-gradient(135deg, #a78bfa, #60a5fa),
  borderRadius: 9999,
  paddingVertical: 16,
  paddingHorizontal: 32,
  shadowColor: '#a78bfa',
  shadowOpacity: 0.3,
  shadowRadius: 15,
}
```

**Card**:
```css
{
  background: '#1a1a2e',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.05)',
  padding: 20,
}
```

**Glassmorphism Panel**:
```css
{
  background: 'rgba(26, 26, 46, 0.7)',
  backdropFilter: 'blur(10px)',
  borderRadius: 24,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
}
```

---

## 13. Animation & Interaction Guide

### Animation Timing

| Animation | Duration | Easing |
|-----------|----------|--------|
| Screen transition | 300ms | ease-in-out |
| Button press | 80ms | ease-out |
| Card tap | 100ms | ease-out |
| Modal slide | 300ms | ease-out |
| Mindi state change | 400ms | ease-in-out |
| Particle float | 3000ms | linear |
| Glow pulse | 2000ms | ease-in-out, infinite |
| Confetti burst | 1500ms | ease-out |

### Haptic Feedback

| Action | Haptic Pattern |
|--------|----------------|
| Button tap | `impactLight` |
| Selection | `impactMedium` |
| Success/Complete | `notificationSuccess` |
| Error | `notificationError` |
| Mindi reaction | `impactLight` × 2 (double tap) |
| Session milestone | `notificationSuccess` + `impactHeavy` |

### Micro-Interactions

1. **Button Press**: Scale to 0.95, slight shadow reduction
2. **Card Tap**: Scale to 0.98, border glow
3. **Slider Drag**: Haptic tick every 10%
4. **Tab Switch**: Smooth indicator slide
5. **Pull to Refresh**: Mindi pokes head down from top
6. **Loading**: Mindi looking up expectantly
7. **Success**: Confetti + Mindi celebration

### Mindi Expressions

| Expression | Eyes | Mouth | Body | Trigger |
|------------|------|-------|------|---------|
| Neutral | Open, relaxed | Slight smile | Gentle bob | Default |
| Listening | Slightly narrowed | Neutral | Head tilt | User typing |
| Thinking | Looking up | Hmm shape | Still | AI processing |
| Happy | Wide, sparkle | Big smile | Bounce | Success |
| Excited | Very wide | Open smile | Wiggle | Celebration |
| Peaceful | Closed | Content smile | Slow glow | Playing audio |
| Sleepy | Half-closed | Small smile | Slow bob | Night mode |

---

## 14. MVP Scope

### In Scope (MVP)

**Core Features**:
- ✅ Mindi mascot with 4 states (idle, listening, peaceful, happy)
- ✅ Onboarding with Mindi intro
- ✅ AI chat for affirmation generation
- ✅ Voice selection (4 voices)
- ✅ Background selection (6 backgrounds)
- ✅ Audio generation
- ✅ Player with Mindi as visualizer
- ✅ Particle effects during playback
- ✅ Session complete celebration
- ✅ View affirmations
- ✅ Library
- ✅ Basic streak tracking
- ✅ Haptic feedback

**Mindi MVP Scope**:
- 4 emotional states (not 10)
- Lottie animations (not Rive state machine)
- 15 particles max (performance)
- Pre-rendered animations only

### Out of Scope (MVP)

- ❌ Mindi accessories/customization
- ❌ Mindi home environment
- ❌ Push notifications
- ❌ User accounts (device-based)
- ❌ Record own voice
- ❌ Offline downloads
- ❌ Sleep timer
- ❌ Premium paywall

---

## 15. Success Metrics

### North Star
**Daily Active Users Who Complete a Session** — shows both retention AND engagement

### Mindi-Specific Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Onboarding completion | >80% | Mindi intro working |
| % who name Mindi | >60% | Emotional investment |
| Session completion rate | >70% | Mindi keeps attention |
| D1 retention | 50% | Want to see Mindi again |
| D7 retention | 30% | Habit forming |
| Avg sessions/week | 4+ | Regular relationship |

### Qualitative Signals
- Users mention Mindi in reviews
- Social shares include Mindi screenshots
- "I can't disappoint Mindi" sentiment
- Feature requests for more Mindi content

---

## 16. Future Roadmap

### v1.1 — Mindi Expansion
- Mindi accessories (hats, colors)
- More emotional states
- Mindi's room/environment
- Push notifications with Mindi

### v1.2 — Premium & Polish
- Premium subscription
- Offline downloads
- More voices/backgrounds
- Sleep timer

### v1.3 — Social
- Share Mindi stats
- Mindi friends (invite system)
- Community templates

### v2.0 — Mindi Evolution
- Mindi evolves over time
- Multiple Mindi forms to unlock
- Voice cloning
- Advanced techniques (ultrasonic)

---

## 📎 Appendix

### A. Mindi Asset Requirements

**For MVP (Lottie)**:
1. `mindi-idle.json` — Default floating state
2. `mindi-listening.json` — Head tilt, attentive
3. `mindi-peaceful.json` — Eyes closed, healing (player)
4. `mindi-happy.json` — Celebration, eyes wide
5. `mindi-greeting.json` — Wake up, wave

**Particle Assets**:
- Soft glowing orb (PNG or vector)
- Confetti pieces (5 colors)
- Sparkle burst

### B. Sound Design Requirements

| Sound | Description | Duration |
|-------|-------------|----------|
| `mindi-wake` | Soft chime, rising | 0.5s |
| `mindi-happy` | Sparkle, uplifting | 0.3s |
| `session-complete` | Celebration jingle | 1.5s |
| `button-tap` | Soft click | 0.1s |
| `selection` | Gentle pop | 0.1s |
| `confetti` | Light sprinkle | 1s |

### C. Competitor Comparison

| App | Mascot | Emotional Hook | Our Advantage |
|-----|--------|----------------|---------------|
| Focus Friend | Bean (knits) | "Don't disappoint Bean" | Mindi heals with you |
| Finch | Bird (grows) | Nurture pet = nurture self | More visual transformation |
| Duolingo | Duo (reminds) | Guilt/streak | Positive reinforcement |
| VibeSesh | None | — | Mindi adds soul |

Wavium + Mindi = Finch's emotional engineering + subliminal power

---

### D. Design References

**Aesthetic Inspiration**:
- Calm app (premium feel, soothing)
- Headspace (playful illustrations, rounded)
- Finch (character design, emotional)
- Linear app (micro-interactions, polish)

**Mindi Inspiration**:
- Kirby (soft, round, friendly)
- Finch bird (simple face, expressive)
- Headspace characters (rounded, approachable)
- NOT: Anatomical brain, workout brain, corporate mascot

---

*End of PRD v2.0*

**Remember**: Mindi is not a feature. Mindi IS the app.
