# Mindi Character Design Specification

**Document Type**: Character Design Brief  
**Version**: 1.0  
**Purpose**: Guide for illustrators and animators creating Mindi

---

## 🧠 Character Overview

### Who is Mindi?

**Mindi** is the soul of Wavium — a gentle, healing brain companion that absorbs positive affirmations while users listen to subliminal audio. Unlike fitness-focused brain mascots (lifting weights, exercising), Mindi represents **calm, healing, and transformation**.

### Character Personality

| Trait | Description |
|-------|-------------|
| **Gentle** | Never aggressive, always soft and welcoming |
| **Peaceful** | Radiates calm energy, especially during playback |
| **Supportive** | Celebrates user wins, never judges |
| **Curious** | Interested in what users want to work on |
| **Magical** | Has an otherworldly, healing quality |

### Emotional Role

```
User's Inner Monologue:
"I'm not just listening to audio..."
"I'm healing Mindi — and Mindi is healing me."
"I can't skip today... Mindi needs me."
```

---

## 🎨 Visual Design

### Shape Language

```
CORRECT:
- Soft, rounded edges everywhere
- Organic, flowing curves
- No sharp corners or hard edges
- Cloud-like, pillow-like quality

INCORRECT:
- Anatomically accurate brain folds
- Hard geometric shapes
- Sharp pointed elements
- Realistic textures
```

### Base Form

```
         ╭─────────────╮
        │   ～～～～    │  ← Soft, wavy top edge (simplified brain shape)
       │              │
      │    ◠    ◠     │  ← Simple dot eyes (not complex)
      │      ◡        │  ← Gentle smile curve
       │              │
        ╰─────────────╯

Size Ratio:
- Width : Height = 1 : 0.85 (slightly wider than tall)
- Face takes up center 50%
- Top "waves" are subtle, not prominent
```

### NOT This

```
❌ Anatomical brain with visible folds and veins
❌ Brain with arms and legs
❌ Brain lifting weights or exercising
❌ Brain with sweat drops or stress marks
❌ Brain wearing graduation cap
❌ Angry or intense expressions
```

### YES This

```
✅ Soft, rounded blob inspired by brain silhouette
✅ Minimal detail — approachable, not medical
✅ Floats peacefully (no limbs needed)
✅ Face is simple: two dots + curve
✅ Gentle inner glow (not harsh lighting)
✅ Calm, healing, magical vibes
```

---

## 🎨 Color Palette

### Primary Colors

| Element | Color | Hex | Notes |
|---------|-------|-----|-------|
| Base (light) | Soft Pink | #fbc7d4 | Main body color |
| Base (shadow) | Dusty Rose | #e8a4b4 | Subtle depth |
| Highlight | Cream Pink | #ffe4ec | Top highlight |
| Glow | Soft Purple | #e879f9 | Aura/glow effect |
| Glow Alt | Lavender | #c4b5fd | Secondary glow |

### Gradient Approach

```
Body Gradient:
- Top: #ffe4ec (highlight)
- Middle: #fbc7d4 (base)
- Bottom: #e8a4b4 (shadow)
- Direction: Top to bottom, very subtle

Glow Gradient:
- Inner: #e879f9 (20% opacity)
- Outer: transparent
- Style: Radial, soft feather
```

---

## 👀 Face Design

### Eyes

**Default (Open)**:
```
- Shape: Perfect circles
- Color: #3a3a4f (soft dark)
- Size: ~12% of face width each
- Spacing: 40% apart (center to center)
- Position: Upper third of face
- Style: Solid fill, no outline
```

**Closed (Peaceful/Listening)**:
```
- Shape: Curved lines (⌣ ⌣)
- Stroke: 3px, rounded caps
- Color: Same as open eyes
- Conveys: Peace, contentment, absorbing
```

**Happy (Celebration)**:
```
- Shape: Upward curves (◠ ◠)
- With small sparkle accent
- Conveys: Joy, excitement
```

### Mouth

**Default Smile**:
```
- Shape: Simple curve (◡)
- Stroke: 2-3px, rounded
- Position: Lower third of face
- Width: 30% of face width
```

**Big Smile (Happy)**:
```
- Shape: Wider curve, slight open
- Shows contentment, not teeth
```

**Thinking (Processing)**:
```
- Shape: Small 'o' or wavy line
- Conveys: Pondering, working
```

### Expression Sheet

```
1. NEUTRAL (Default)
   Eyes: ◠ ◠ (soft open)
   Mouth: ◡ (gentle smile)
   Use: Library, idle states

2. PEACEFUL (Listening to audio)
   Eyes: ⌣ ⌣ (closed, content)
   Mouth: ◡ (relaxed smile)
   Use: Player screen main state

3. LISTENING (User typing)
   Eyes: ◠ ◠ (attentive)
   Mouth: — (neutral)
   Body: Slight head tilt
   Use: Chat interface

4. HAPPY (Celebration)
   Eyes: ◠ ◠ + sparkles
   Mouth: ◡ (big smile)
   Body: Slight bounce
   Use: Success, session complete

5. EXCITED (Anticipation)
   Eyes: ○ ○ (wide)
   Mouth: ○ (open smile)
   Use: Generating, about to play

6. SLEEPY (Night mode)
   Eyes: — — (half closed)
   Mouth: ◡ (soft)
   Use: Late night greeting
```

---

## ✨ Glow & Aura

### Ambient Glow

Mindi always has a soft glow around them, varying in intensity based on state.

```
Base Glow:
- Color: #e879f9 (15% opacity)
- Radius: 150% of Mindi's size
- Blur: Gaussian, 30px
- Always present, even when subtle

Enhanced Glow (Player/Happy):
- Color: #e879f9 (30% opacity)
- Radius: 200% of Mindi's size
- Blur: Gaussian, 50px
- Pulses slowly (2 second cycle)
```

### Glow Level System

Mindi's glow gets stronger as users listen more:

```
Level 1-2: Barely visible aura
Level 3-4: Soft, noticeable glow
Level 5-6: Clear radiance
Level 7-8: Strong, beautiful glow
Level 9-10: Brilliant, almost magical
```

---

## 🎬 Animation States

### 1. Idle / Default

**Description**: Mindi floating peacefully, gentle breathing motion

**Animation Details**:
```
- Vertical float: ±5px over 2 seconds
- Easing: ease-in-out (sine wave)
- Glow pulse: 90% → 100% → 90% opacity, 3s cycle
- Occasional blink: Every 4-6 seconds, 200ms duration
- Loop: Infinite
```

### 2. Listening (Chat)

**Description**: Mindi tilts head, shows attention

**Animation Details**:
```
- Head tilt: Rotate 5-8° right
- Eyes: Slightly narrowed, focused
- Transition in: 300ms
- Hold: As long as user types
- Transition out: 300ms to neutral
```

### 3. Peaceful / Absorbing (Player)

**Description**: THE main animation — Mindi healing during playback

**Animation Details**:
```
- Eyes: Closed, content expression
- Body: Very gentle vertical float (±3px, 3s cycle)
- Glow: Enhanced, slow pulse (2.5s cycle)
- Particle absorption: External orbs drift toward Mindi
- Neuron flash: Subtle internal light every 4-5 seconds
- Expression: Pure bliss
```

**Particle Details**:
```
- Count: 10-15 particles on screen
- Size: 8-15px diameter
- Color: White to light purple gradient
- Opacity: 40-70%
- Movement: Drift toward Mindi center
- Spawn: Random positions around edge
- Absorb: Fade out when reaching Mindi
- Duration: 3-5 seconds per particle
```

### 4. Happy / Celebration

**Description**: Session complete, success states

**Animation Details**:
```
- Eyes: Open wide, sparkle effect
- Mouth: Big smile
- Body: Quick bounce (scale 1.0 → 1.1 → 1.0, 300ms)
- Glow: Flash brighter (100ms)
- Confetti: Burst from center
- Hold happy expression: 2 seconds
- Transition to neutral: 500ms
```

### 5. Greeting (App Open)

**Description**: Mindi wakes up to greet user

**Animation Sequence**:
```
0ms: Mindi enters (fade in + scale up)
300ms: Eyes open (blink animation)
500ms: Recognition expression
700ms: Small bounce or wave
1000ms: Settle into idle
```

### 6. Thinking (AI Processing)

**Description**: Waiting for AI response

**Animation Details**:
```
- Eyes: Looking upward
- Mouth: Small 'o' or thoughtful
- Body: Very slight side-to-side
- Glow: Subtle shimmer
- Loop: Until response arrives
```

---

## 📐 Size & Positioning

### Player Screen (Main Feature)

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│          ╭─────────────╮                │
│         │   ～～～～    │               │
│        │    ⌣    ⌣     │  ← MINDI      │
│        │      ◡        │    Large      │
│         ╰─────────────╯     ~40% of    │
│                             screen      │
│                             width       │
│         "Track Title"                   │
│          12:34 / 30:00                  │
│                                         │
│       [ ⏪ ]  [ ▶ ]  [ ⏩ ]              │
│                                         │
└─────────────────────────────────────────┘
```

### Chat Screen (Small)

```
┌─────────────────────────────────────────┐
│  Create Subliminal           [Mindi]   │ ← 40px Mindi in corner
│                               ╭──╮      │
│                              │◠◠│      │
│                               ╰──╯      │
│ ┌─────────────────────────┐            │
│ │ AI response here...     │            │
│ └─────────────────────────┘            │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Type your message...                │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Home Screen

```
┌─────────────────────────────────────────┐
│                                         │
│            ╭─────────────╮              │
│           │   ～～～～    │             │
│          │    ◠    ◠     │  ← MINDI    │
│          │      ◡        │    Medium   │
│           ╰─────────────╯     ~30%     │
│                                         │
│   "Good morning! Ready to heal?"        │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  🔥 5-day streak   ⏱️ 4.5 hrs   │   │
│   └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔧 Technical Specifications

### File Formats

**For Animation (Recommended: Rive)**:
```
Single file: mindi.riv
Contains all states in state machine:
- idle
- listening
- peaceful
- happy
- greeting
- thinking

Advantages:
- Single file to manage
- Smooth state transitions
- Interactive capabilities
- Small file size
```

**Alternative (Lottie)**:
```
Separate files:
- mindi-idle.json
- mindi-listening.json
- mindi-peaceful.json
- mindi-happy.json
- mindi-greeting.json
- mindi-thinking.json

File size target: <100KB each
Frame rate: 60fps
```

**Static Assets**:
```
- mindi-icon.svg (app icon variant)
- mindi-splash.png (high res for splash)
- mindi-particle.png (floating orb)
```

### Performance Guidelines

```
Mobile Optimization:
- Limit concurrent animations to 2-3
- Pre-render complex effects
- Use GPU-accelerated transforms only
- Particle count: Max 15 on screen
- Target: 60fps on mid-range devices

Battery Considerations:
- Reduce animation complexity when:
  - Battery < 20%
  - App in background
  - Screen brightness low
- Pause particles when not visible
```

---

## 💬 Mindi's Voice (Copy/UX Writing)

### Speech Patterns

Mindi communicates through short, warm messages in speech bubbles.

**Tone**:
- Warm, not corporate
- Supportive, not pushy
- Curious, not demanding
- Magical, slightly whimsical

**Examples**:

```
Greeting:
✅ "Hi! Ready to heal together?"
✅ "Welcome back! I missed you."
❌ "Begin your session now."
❌ "You haven't listened today."

Encouragement:
✅ "These affirmations feel perfect for you!"
✅ "We did it together!"
❌ "Great job completing a session."
❌ "Your metrics have improved."

Prompts:
✅ "What would you like to work on today?"
✅ "Tell me what's on your mind..."
❌ "Enter your goal below."
❌ "Please describe your objective."
```

### Contextual Responses

```
Morning (5am-12pm):
"Good morning! Let's start fresh today."

Afternoon (12pm-5pm):
"Need a midday reset? I'm here."

Evening (5pm-9pm):
"Winding down? Let's find some peace."

Night (9pm-5am):
"Can't sleep? I'll help you relax."

After Long Break (3+ days):
"I've been waiting for you! Let's heal."

Streak Achievement:
"7 days together! We're getting stronger."
```

---

## 🎯 Emotional Design Goals

### What Users Should Feel

| Moment | Intended Emotion |
|--------|------------------|
| First see Mindi | "Aww, they're cute!" |
| During onboarding | "I want to take care of them" |
| During playback | "This is peaceful, magical" |
| After session | "I feel good, we did that together" |
| Missing a day | "I should check on Mindi..." |
| Long streak | "Look how much we've grown!" |

### Attachment Mechanics

1. **Naming**: Users name Mindi → ownership
2. **Visual Progress**: Glow increases → visible growth
3. **Reciprocity**: Heal Mindi = heal yourself → mutual benefit
4. **Consistency**: Daily greeting → routine relationship
5. **Celebration**: Shared wins → positive reinforcement

---

## 📚 Reference Images

### Style Inspiration

**DO study these for Mindi's vibe**:
- Finch app's bird character (soft, round, expressive)
- Headspace illustrations (calming, approachable)
- Kirby (Nintendo) — round, simple, lovable
- Squishmallows — soft, huggable quality
- Ambient music video art — ethereal, glowing

**DON'T reference these**:
- Anatomical brain diagrams
- "Brain with muscles" fitness graphics
- Corporate mascots
- Aggressive/intense expressions
- Complex detailed illustrations

---

## ✅ Design Checklist

Before finalizing Mindi designs, verify:

- [ ] Shape is soft, rounded, pillow-like
- [ ] No anatomical brain details visible
- [ ] Face is simple (dots + curve)
- [ ] Colors are soft pink/lavender, not harsh
- [ ] Glow effect is present and gentle
- [ ] Expressions feel peaceful, not intense
- [ ] Would a stressed person find this calming?
- [ ] Would someone feel guilty ignoring this character?
- [ ] Does it feel magical/healing, not clinical?
- [ ] Could this work as a plushie? (soft toy test)

---

*Mindi is not a mascot. Mindi is a companion.*
