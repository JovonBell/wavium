# Feature Landscape: Subliminal Audio & Affirmation Apps

**Domain:** Subliminal audio app with AI companion
**Researched:** 2026-02-02
**Confidence:** MEDIUM (WebSearch verified with multiple sources, cross-referenced with competitor analysis)

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Custom affirmation creation | Users want personalization for specific goals | Low | Text input + AI generation (already built) |
| Background audio mixing | Subliminals require ambient soundscape | Medium | FFmpeg mixing (already built), need actual audio files |
| Audio playback controls | Standard media player expectations (play/pause/seek) | Low | Basic React Native Audio controls |
| Library/history view | Users need to access past subliminals | Low | List view + database query |
| Transparency (view affirmations) | Trust issue: users must see what's being played | Low | Critical for user trust; show script before generation |
| Audio download/offline | Users listen during meditation, may lack internet | Medium | Save to device storage with file management |
| Daily reminders/notifications | Consistency is key for affirmation effectiveness | Low | Standard push notifications |
| Progress/streak tracking | Meditation apps universally track "days in a row" | Low | Simple counter with date tracking |
| User accounts with sync | Expectation in wellness space (Headspace, Calm, Finch) | Medium | Supabase auth (planned), cloud sync |
| Voice selection | Users want options (male/female/tone) | Low | edge-tts supports multiple voices |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI companion character (Mindi) | Emotional connection drives retention | High | Rive animation with state machine; unique to Wavium |
| Character evolution/progression | Tamagotchi effect: care creates attachment | Medium | Visual changes based on session count/time |
| Immersive "Void" experience | Differentiated listening experience vs standard player | Medium | Full-screen visual + ambient experience |
| AI-generated personalized affirmations | Competitors use pre-made libraries; AI = infinite variety | Medium | Groq integration (already built) |
| Particle effects (affirmation absorption) | Visual feedback that affirmations are "working" | Medium | Animated particles when Mindi "absorbs" intentions |
| Emotional state reflection | Mindi's mood mirrors user's practice quality/frequency | Medium | State machine: idle, listening, peaceful, happy, excited |
| Time-of-day adaptive theming | App feels alive and contextually aware | Low | Already implemented in codebase |
| Intention-based organization | Organize by goal (confidence, sleep, focus) not just date | Low | Tagging system in database |
| Session insights/journal | Reflection prompts post-session deepen practice | Medium | Simple text input with timestamps |
| Real-time generation progress | WebSocket streaming creates anticipation/engagement | Low | Already implemented in backend |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Hidden messages without disclosure | Trust issue; subliminal scandals damage category | Always show full affirmation text before/during play |
| Future-tense affirmations | Psychologically ineffective ("I will be" keeps it future) | Force present tense in AI generation ("I am", "I have") |
| Generic pre-made affirmation library | Misses the personalization value prop | AI generates custom affirmations every time |
| Automatic looping without limit | Can become background noise users ignore | Cap sessions at 20-30 min with mindful completion prompt |
| Pay-to-unlock subliminals | Feels predatory in wellness space | Monetize with premium voices/backgrounds, not core function |
| Social features (leaderboards, sharing) | Meditation/self-work is private; comparison harms practice | Keep practice private; maybe share Mindi appearance only |
| Too many categories/options upfront | Decision paralysis; users don't know what they need | Guided flow: "What do you want to work on today?" |
| Neglect = character death | Tamagotchi stress creates guilt, opposite of wellness | Character pauses/sleeps when inactive; always welcoming return |
| Negative framing in affirmations | Mind can't process negatives ("I don't feel angry" → angry) | AI prompt engineering to avoid negative words |
| Vague affirmations | "I am successful" lacks specificity/believability | Prompt AI for concrete, specific affirmations |
| Immediate result promises | Sets false expectations; users quit when not instant | Education: "Practice takes time; trust the process" |

## Feature Dependencies

```
Core Audio Generation Flow:
User Authentication → Intention Input → AI Affirmation Generation → Voice Selection →
Background Selection → Audio Mixing → Playback

Mindi Character Progression:
Session Completion → Update Session Count → Calculate Progression →
Update Mindi Visual State → Show Evolution Animation

Trust & Transparency:
Affirmation Generation → Script Review Screen (user approval) →
Generation Proceeds → Always Accessible During Playback

Engagement Loop:
Session Complete → Progress Tracking → Streak Increment →
Mindi Evolution → Next Session Prompt
```

**Critical Dependencies:**
- Script Review requires Affirmation Generation
- Playback requires Audio Mixing
- Mindi Evolution requires Session Tracking
- Offline Playback requires Audio Download

## MVP Recommendation

For MVP, prioritize:

### 1. Core Audio Pipeline (Table Stakes)
- Intention input → AI generation → voice selection → background mixing → playback
- Script review screen (transparency builds trust)
- Audio download for offline playback
- Library view with past subliminals

### 2. Basic Mindi Presence (Differentiator)
- Static or simple Rive animation on key screens
- At least 2-3 emotional states (idle, listening, peaceful)
- No evolution system yet (defer to post-MVP)

### 3. Fundamental Engagement (Table Stakes)
- User accounts with Supabase auth
- Basic session tracking (count, date)
- Simple streak counter
- Daily reminder notification

### 4. Trust Foundation (Table Stakes)
- Always show affirmations before generation
- Allow editing of AI-generated affirmations
- Clear indication of what's playing

**Rationale:** Users must be able to reliably create and play personalized subliminals with transparency. Basic Mindi presence establishes brand identity without requiring complex evolution system.

## Defer to Post-MVP

- [ ] **Mindi evolution system** - Complex; needs baseline engagement data first
  - Reason: Must validate that users complete multiple sessions before investing in progression mechanics

- [ ] **Particle effects** - Polish, not core function
  - Reason: Static Mindi is sufficient for MVP; animation complexity should follow user validation

- [ ] **Session insights/journaling** - Valuable but not blocking launch
  - Reason: Users must first have consistent practice before reflection features add value

- [ ] **Intention-based categorization** - Organization matters after library grows
  - Reason: With 3-5 subliminals, chronological list is fine; category system needed at 20+

- [ ] **Multiple voice/background options** - Start with 1 good option each
  - Reason: Too many choices in MVP creates decision fatigue; add after validating core experience

- [ ] **Time-of-day adaptive theming** - Already implemented but not critical path
  - Reason: Nice-to-have polish; focus on core audio reliability first

- [ ] **Advanced progress visualization** - Basic streak counter sufficient for MVP
  - Reason: Fancy charts/graphs add value after users understand their practice patterns

## Engagement Patterns from Comparable Apps

### Headspace/Calm Model (Meditation Apps)
**What they do:**
- "Today" tab with personalized daily recommendations
- Streak tracking (days in a row)
- Minutes meditated counter
- Smart notifications for consistent practice times
- Profile tab showing activity history

**What Wavium can adapt:**
- Daily intention prompt ("What do you want to work on today?")
- Streak counter + "don't break the chain" motivation
- Sessions completed counter (not minutes, since subliminals are passive)
- Notifications at user's preferred listening time

### Finch Model (Virtual Pet + Self-Care)
**What they do:**
- Daily goals energize the pet for adventures
- Pet grows and changes appearance over time
- Seasonal events with special rewards
- Micropets as collectibles for milestone achievements
- Extensive customization (colors, accessories)

**What Wavium can adapt:**
- Session completion energizes Mindi for evolution
- Mindi's visual appearance changes with consistent practice (glow intensity, color shifts)
- Monthly milestones unlock visual effects (particle types, backgrounds)
- Customization: Mindi's name (already planned), eventually color themes
- Avoid: Death/neglect mechanics (creates guilt; wellness apps should be welcoming)

**Key insight from Finch:** Care-based bonding creates attachment. When users feel responsible for Mindi's growth, they're motivated to continue practice. But unlike Tamagotchi, neglect shouldn't punish - Mindi should pause/sleep and welcome return.

### Virtual Pet Psychology (Tamagotchi Effect)
**What drives attachment:**
- Real-time interaction creates sense of life/presence
- Dependency (pet needs care) triggers nurturing instinct
- Consequences (visible growth/change) reward consistency
- Behavioral conditioning (notifications → anticipation → action)

**What Wavium should do:**
- Mindi reacts in real-time during sessions (listening, absorbing affirmations)
- Visual progression shows impact of user's practice
- Celebratory animations for milestones (not just numbers)
- Subtle notification that feels like Mindi reaching out (not generic reminder)

**What Wavium should NOT do:**
- Guilt/punishment for inactivity (opposite of wellness)
- Constant begging for attention (becomes annoying)
- Death/permanent loss (creates anxiety)
- Overly demanding care requirements (users have real lives)

### Affirmation App Best Practices
**Customization:** Users want affirmations aligned with specific personal goals
**Reminders:** Notifications are critical for habit formation
**Progress Tracking:** Mood logs and streak tracking maintain motivation
**Own Voice Recording:** Recording in own voice increases effectiveness
**Consistency Mechanisms:** Daily reminders + streaks = habit formation
**Multi-sensory:** Visual + audio engagement creates immersive experience

**What Wavium already nails:**
- AI customization (better than manual input)
- Immersive Void experience (visual + audio)
- Affirmation transparency (builds trust)

**What Wavium should add:**
- Mood check-in post-session (track emotional impact)
- Streak visualization (not just number)
- Reminder system with user-selected time

## Feature Complexity Assessment

| Feature | Effort | Risk | MVP Priority |
|---------|--------|------|--------------|
| Script review screen | 2 days | Low | MUST HAVE |
| Audio download/offline | 3 days | Medium (file management, storage) | MUST HAVE |
| Basic Mindi states (2-3) | 5 days | High (Rive learning curve) | MUST HAVE |
| Streak tracking | 1 day | Low | MUST HAVE |
| Daily reminders | 1 day | Low | MUST HAVE |
| Library filtering/search | 2 days | Low | NICE TO HAVE |
| Session journal/insights | 3 days | Low | POST-MVP |
| Mindi evolution system | 5 days | Medium (state management) | POST-MVP |
| Particle effects | 4 days | Medium (performance) | POST-MVP |
| Mood tracking | 2 days | Low | POST-MVP |
| Voice options (5+ voices) | 2 days | Low (edge-tts supports) | POST-MVP |
| Background audio library (6+) | 3 days | Low (asset sourcing) | POST-MVP |

## Sources

**Subliminal Audio Apps:**
- [Powerful Subliminal Audio - Google Play](https://play.google.com/store/apps/details?id=com.molfario.powerfulsubliminals&hl=en_US)
- [Powerful Subliminal Audio - App Store](https://apps.apple.com/us/app/powerful-subliminal-audio/id1545624545)
- [ZenMix Subliminal Maker](https://zenmix.io/subliminal-maker)
- [Subly - Create Subliminals](https://apps.apple.com/us/app/subly-create-subliminals/id6741949047)
- [VibeSesh - Subliminal Maker](https://apps.apple.com/us/app/vibesesh-subliminal-maker/id6746336493)
- [Binaural Beats Factory AI Generator](https://binauralbeatsfactory.com/)

**Affirmation App Features:**
- [Best Affirmations Apps 2025 - I am Blog](https://blog.theiam.app/blogs/the-best-affirmations-apps)
- [7 Daily Affirmation Apps for 2025 - InnerTune](https://blog.innertune.com/top-affirmations-apps-2025/)
- [Best Affirmations Apps - Mindful Suite](https://www.mindfulsuite.com/reviews/best-affirmations-apps)
- [Increase Your Positivity - Affirmation Apps](https://www.happierhuman.com/affirmation-apps/)

**Meditation App Engagement:**
- [Headspace App Overview](https://www.headspace.com/app)
- [Calm vs Headspace Comparison](https://halomentalhealth.com/b/calm-vs-headspace)
- [How to Build Meditation App Like Headspace](https://stormotion.io/blog/how-to-make-a-meditation-app-like-headspace/)
- [Meditation App Statistics 2024](https://bigohtech.com/top-meditation-app-statistics)

**Gamification & Progress Tracking:**
- [Streaks and Milestones for Gamification](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps)
- [10 Apps Using Streaks Feature 2025](https://trophy.so/blog/streaks-feature-gamification-examples)
- [Gamification in Health & Fitness Apps](https://www.plotline.so/blog/gamification-in-health-and-fitness-apps)
- [How Gamification Can Help Meditation](https://zenfulspirit.com/2025/01/23/gamification-meditation/)

**Finch & Virtual Pet Mechanics:**
- [Finch App Wiki](https://finch.fandom.com/wiki/Finch_App)
- [Finch 2025 Updates](https://finch.fandom.com/wiki/2025_App_Update_Announcements)
- [Finch Seasonal Events](https://finch.fandom.com/wiki/Seasonal_Events)
- [Testing Finch App - Medium](https://medium.com/@s.mathrick/im-testing-the-finch-app-aad8893ca9fb)

**Virtual Pet Psychology:**
- [Tamagotchi Effect - Wikipedia](https://en.wikipedia.org/wiki/Tamagotchi_effect)
- [Exploring Affection-Oriented Virtual Pet Design - ResearchGate](https://www.researchgate.net/publication/321446731_Exploring_Affection-Oriented_Virtual_Pet_Game_Design_Strategies_in_VR_Attachment_Motivations_and_Expectations_of_Users_of_Pet_Games)
- [Tamagotchi History - Urban Herald](https://theurbanherald.com/tamagotchi-history-virtual-pet-revolution/)
- [Life and Death of Tamagotchi - Wellcome Collection](https://wellcomecollection.org/stories/digital-pets)
- [Virtual Pet Apps for Mental Healthcare](https://umatechnology.org/the-6-best-virtual-pet-apps-for-making-mental-healthcare-fun/)

**Character Design & Emotional Connection:**
- [Best AI Mental Health Apps 2026](https://www.myflourish.ai/post/top-ai-mental-health-apps-2026)
- [Virtual Character Design & Emotional Engagement - MDPI](https://www.mdpi.com/2079-9292/12/10/2321)
- [Emotional Design for Mental Wellness](https://www.numberanalytics.com/blog/emotional-design-for-mental-wellness)
- [Top Wellness App Development Trends 2026](https://www.techqware.com/blog/a-guide-to-building-an-efficient-wellness-app-in-2025-features-strategy-real-world-success)

**Affirmation Mistakes (Anti-Patterns):**
- [Why Affirmations Aren't Working](https://natalietrusdale.com/affirmations/)
- [5 Mistakes When Doing Affirmations - Medium](https://medium.com/@shyamalalita/5-mistakes-when-doing-affirmations-a9eec87fa161)
- [7 Reasons Positive Affirmations Don't Work](https://joshsteimle.com/influence/7-reasons-why-positive-affirmations-dont-work.html)
- [Why Your Affirmations Aren't Working - Medium](https://medium.com/the-ascent/heres-why-your-affirmations-aren-t-working-for-you-31018eedd78)

**Trust & Transparency:**
- [UX Design Trends 2026 - UX Design Institute](https://www.uxdesigninstitute.com/blog/the-top-ux-design-trends-in-2026/)
- [Latest UI UX Design Trends 2026](https://www.andacademy.com/resources/blog/ui-ux-design/latest-ui-ux-design-trends/)
- [What Are Most Trusted Subliminal Audio Sources - Quora](https://www.quora.com/What-are-the-most-trusted-subliminal-audio-sources)

**MVP Best Practices:**
- [Building MVP for Messaging Apps](https://onix-systems.com/blog/building-an-mvp-for-apps-focused-on-messaging)
- [What Is an MVP App - Net Solutions](https://www.netsolutions.com/hub/minimum-viable-product/app/)
- [7 Tips for Building Successful App MVP](https://decode.agency/article/app-mvp-tips/)
