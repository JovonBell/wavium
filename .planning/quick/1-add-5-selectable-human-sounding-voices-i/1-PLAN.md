---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/services/tts_service.py
  - wavium/src/stores/useMindiStore.ts
  - wavium/app/(main)/tracks.tsx
  - wavium/src/services/api.ts
autonomous: true
requirements: [VOICE-SELECT]
must_haves:
  truths:
    - "User can see 5 distinct voice options with name, description, and gender"
    - "User can tap to select any voice independently of their chosen soundtrack"
    - "Selected voice is used when generating subliminal audio"
    - "Voice selection persists through creation flow into audio generation"
  artifacts:
    - path: "backend/services/tts_service.py"
      provides: "5 human-sounding edge-tts voices with metadata"
      contains: "VOICES"
    - path: "wavium/src/stores/useMindiStore.ts"
      provides: "Voice type, voice config data, selectedVoice in creation state"
      contains: "selectedVoice"
    - path: "wavium/app/(main)/tracks.tsx"
      provides: "Voice picker UI section on tracks screen"
      contains: "Voice"
  key_links:
    - from: "wavium/app/(main)/tracks.tsx"
      to: "wavium/src/stores/useMindiStore.ts"
      via: "setSelectedVoice action"
      pattern: "setSelectedVoice"
    - from: "wavium/app/(main)/tracks.tsx"
      to: "wavium/src/services/api.ts"
      via: "generateVoiceAudio(affirmations, selectedVoice)"
      pattern: "generateVoiceAudio.*selectedVoice"
    - from: "wavium/src/services/api.ts"
      to: "backend/services/tts_service.py"
      via: "POST /api/generate-audio with voice param"
      pattern: "voice"
---

<objective>
Add 5 selectable human-sounding voices to replace the current system where voice is silently coupled to soundtrack selection.

Purpose: Users should be able to pick who whispers their affirmations, independently of which ambient track they choose. This is a core personalization feature -- the voice IS the subliminal experience.

Output: Voice picker UI on tracks screen, 5 curated edge-tts voices on backend, decoupled voice selection in store.
</objective>

<context>
@wavium/src/stores/useMindiStore.ts
@wavium/app/(main)/tracks.tsx
@backend/services/tts_service.py
@wavium/src/services/api.ts
</context>

<interfaces>
<!-- Current contracts the executor needs -->

From wavium/src/stores/useMindiStore.ts:
```typescript
export type SoundTrack = 'ocean-waves' | 'rainfall' | 'deep-focus' | 'cosmic-drift' | 'lofi-chill';

export interface CreationState {
  intention: string;
  affirmations: string[];
  selectedTrack: SoundTrack | null;
  audioUrl: string | null;
}

// SOUND_TRACKS currently has a `voice` field per track that auto-selects voice
export const SOUND_TRACKS: Record<SoundTrack, { name: string; description: string; frequency: string; voice: string }>;
```

From wavium/src/services/api.ts:
```typescript
export async function generateVoiceAudio(
  affirmations: string[],
  voice: string = 'jenny'
): Promise<{ audioUrl: string; error?: string }>;

export async function getVoices(): Promise<VoiceInfo[]>;
```

From backend/services/tts_service.py:
```python
VOICES = {
    "jenny": "en-US-JennyNeural",
    "guy": "en-US-GuyNeural",
    "aria": "en-US-AriaNeural",
    "sonia": "en-GB-SoniaNeural",
}

async def get_available_voices() -> list[dict]:
    # Returns id, name, description
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Expand backend to 5 curated voices and update store with voice selection</name>
  <files>backend/services/tts_service.py, wavium/src/stores/useMindiStore.ts</files>
  <action>
**Backend (tts_service.py):**
Replace the existing 4-voice VOICES dict with 5 curated human-sounding voices. Use these specific edge-tts voices chosen for warmth and natural quality:

```python
VOICES = {
    "ava": "en-US-AvaNeural",         # Warm, smooth female (US) -- newest, most natural
    "emma": "en-US-EmmaNeural",        # Gentle, soothing female (US)
    "andrew": "en-US-AndrewNeural",    # Calm, deep male (US)
    "sonia": "en-GB-SoniaNeural",      # Warm, elegant female (UK)
    "brian": "en-US-BrianNeural",      # Steady, reassuring male (US)
}
```

Update `get_available_voices()` to return the new 5 voices with richer metadata -- add a `gender` field:
```python
async def get_available_voices() -> list[dict]:
    return [
        {"id": "ava", "name": "Ava", "gender": "female", "description": "Warm & smooth (US)"},
        {"id": "emma", "name": "Emma", "gender": "female", "description": "Gentle & soothing (US)"},
        {"id": "andrew", "name": "Andrew", "gender": "male", "description": "Calm & deep (US)"},
        {"id": "sonia", "name": "Sonia", "gender": "female", "description": "Warm & elegant (UK)"},
        {"id": "brian", "name": "Brian", "gender": "male", "description": "Steady & reassuring (US)"},
    ]
```

Update the default voice parameter in `generate_audio()` and `generate_subliminal()` from `"jenny"` to `"ava"` (the new default).

Also update backend/main.py VoiceInfo model to include the `gender` field:
```python
class VoiceInfo(BaseModel):
    id: str
    name: str
    gender: str
    description: str
```

**Store (useMindiStore.ts):**
1. Add a `VoiceId` type: `export type VoiceId = 'ava' | 'emma' | 'andrew' | 'sonia' | 'brian';`

2. Add a `VOICES` config constant (similar pattern to `SOUND_TRACKS`):
```typescript
export const VOICES: Record<VoiceId, { name: string; gender: 'male' | 'female'; description: string; icon: string }> = {
  'ava': { name: 'Ava', gender: 'female', description: 'Warm & smooth', icon: 'person-circle' },
  'emma': { name: 'Emma', gender: 'female', description: 'Gentle & soothing', icon: 'person-circle' },
  'andrew': { name: 'Andrew', gender: 'male', description: 'Calm & deep', icon: 'person-circle' },
  'sonia': { name: 'Sonia', gender: 'female', description: 'Warm & elegant', icon: 'person-circle' },
  'brian': { name: 'Brian', gender: 'male', description: 'Steady & reassuring', icon: 'person-circle' },
};
```

3. Add `selectedVoice: VoiceId | null` to `CreationState` interface (default null in initialCreation).

4. Add `setSelectedVoice: (voice: VoiceId) => void` action to MindiStoreState interface and implement it (same pattern as setSelectedTrack).

5. Remove the `voice` field from SOUND_TRACKS entries (it's no longer coupled to tracks). Keep name, description, frequency only.
  </action>
  <verify>
    <automated>cd /Users/joshuabellhome/wavium && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Backend serves 5 voices via /api/voices with gender field. Store has VoiceId type, VOICES config, selectedVoice in creation state, and setSelectedVoice action. SOUND_TRACKS no longer has voice field.</done>
</task>

<task type="auto">
  <name>Task 2: Add voice picker UI to tracks screen and wire voice through audio generation</name>
  <files>wavium/app/(main)/tracks.tsx, wavium/src/services/api.ts</files>
  <action>
**Tracks screen (tracks.tsx):**

1. Import the new voice types: `import { useMindiStore, SoundTrack, SOUND_TRACKS, VoiceId, VOICES } from '../../src/stores/useMindiStore';`

2. Add voice state and store action alongside existing track state:
```typescript
const { creation, setSelectedTrack, setSelectedVoice, saveSubliminal } = useMindiStore();
const [selectedVoiceId, setSelectedVoiceIdLocal] = useState<VoiceId | null>(creation.selectedVoice);
```

3. Add a `handleSelectVoice` handler (similar to `handleSelectTrack` but simpler -- no audio preview needed):
```typescript
const handleSelectVoice = (voiceId: VoiceId) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setSelectedVoiceIdLocal(voiceId);
  setSelectedVoice(voiceId);
};
```

4. Add a "Choose Your Voice" section ABOVE the track selection section. Use the same visual pattern as track cards (GlassmorphicCard with radio button) but more compact since there are 5 voices. Use a horizontal scrollable row of smaller glass cards OR a vertical list with smaller card height. Recommended approach: vertical list with compact cards (56px height instead of full track card height).

Each voice card shows:
- Left: Ionicons icon -- use `"woman"` for female voices and `"man"` for male voices
- Center: Voice name (bold) + description (secondary text) on one line each
- Right: Radio button (same style as track selection)

The section header should say "Choose Your Voice" with subtitle "Who whispers your affirmations?"

5. Update `handleCreateSubliminal` to use the selected voice instead of the track-coupled voice:
```typescript
// BEFORE (remove this):
const trackConfig = SOUND_TRACKS[selectedTrackId];
const voice = trackConfig.voice || 'jenny';

// AFTER:
const voice = selectedVoiceId || 'ava';
```

6. Update the "Create My Subliminal" button disabled condition to also require a voice selection:
```typescript
disabled={!selectedTrackId || !selectedVoiceId || isCreating}
```

**API service (api.ts):**
Update the default voice parameter in `generateVoiceAudio` and `generateSubliminalAudio` from `'jenny'` to `'ava'` to match the new backend default.

**Visual ordering on screen:** Back button -> Header "Choose Your Sound" -> Voice picker section -> Track picker section -> Headphones info -> Create button. This puts the voice choice first (it's the more personal decision) before the ambient background choice.

Match the existing glassmorphic card styling, gold primary color for selected state, FadeInDown stagger animations consistent with the existing track cards.
  </action>
  <verify>
    <automated>cd /Users/joshuabellhome/wavium && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Tracks screen shows 5 voice options in a vertical list above the track selection. User can independently select voice and track. Selected voice flows through to generateVoiceAudio call. Button requires both voice and track selected. TypeScript compiles without errors.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `cd wavium && npx tsc --noEmit` passes
2. Backend voices endpoint returns 5 voices: `curl http://localhost:8000/api/voices` returns JSON array with 5 entries including gender field
3. Visual check: tracks screen shows voice picker section with 5 cards, each with name/description/radio button
4. Flow check: selecting a voice + track + tapping Create calls generateVoiceAudio with the chosen voice ID
</verification>

<success_criteria>
- 5 distinct human-sounding voices available (Ava, Emma, Andrew, Sonia, Brian)
- Voice selection is independent of track selection (decoupled)
- Voice picker UI matches existing glassmorphic design language
- Selected voice propagates through creation flow to backend TTS generation
- Default voice is "ava" when no explicit selection
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/1-add-5-selectable-human-sounding-voices-i/1-SUMMARY.md`
</output>
