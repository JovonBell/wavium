/**
 * WAVIUM - CrossfadeAudioPair
 * Seamless crossfade looping audio system using two Audio.Sound instances.
 * When the active sound nears its end (within 3s), the inactive sound preloads
 * and crossfades in, eliminating hard loop boundaries.
 */

import { Audio } from 'expo-av';

const CROSSFADE_TRIGGER_MS = 3000; // Start crossfade this many ms before end
const CROSSFADE_DURATION_MS = 2500; // Duration of the crossfade in ms
const CROSSFADE_STEP_MS = 50; // Interval between volume steps

export class CrossfadeAudioPair {
  private soundA: Audio.Sound | null = null;
  private soundB: Audio.Sound | null = null;
  private activeIsA = true;
  private currentUri = '';
  private currentVolume = 1.0;
  private crossfading = false;
  private crossfadeInterval: ReturnType<typeof setInterval> | null = null;
  private statusUpdateAttached = false;

  /** Load a URI and start playing it on soundA */
  async load(uri: string, volume: number): Promise<void> {
    this.currentUri = uri;
    this.currentVolume = volume;
    this.activeIsA = true;
    this.crossfading = false;

    try {
      if (this.soundA) {
        await this.soundA.unloadAsync().catch(() => {});
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume, isLooping: false }
      );
      this.soundA = sound;
      this._attachStatusUpdate(sound, true);
    } catch (e) {
      console.warn('[CrossfadeAudioPair] load failed:', e);
    }
  }

  /** Set volume on the currently active sound */
  async setVolume(volume: number): Promise<void> {
    this.currentVolume = volume;
    const active = this.activeIsA ? this.soundA : this.soundB;
    try {
      await active?.setVolumeAsync(volume);
    } catch {}
  }

  /** Seek the active sound to a position in milliseconds */
  async setPosition(positionMs: number): Promise<void> {
    const active = this.activeIsA ? this.soundA : this.soundB;
    try {
      await active?.setPositionAsync(positionMs);
    } catch {}
  }

  /** Get the current playback status of the active sound */
  async getStatusAsync() {
    const active = this.activeIsA ? this.soundA : this.soundB;
    return active?.getStatusAsync() ?? null;
  }

  /** Stop both sounds */
  async stop(): Promise<void> {
    this._clearCrossfadeInterval();
    try { await this.soundA?.stopAsync(); } catch {}
    try { await this.soundB?.stopAsync(); } catch {}
  }

  /** Unload both sounds */
  async unload(): Promise<void> {
    this._clearCrossfadeInterval();
    try { await this.soundA?.unloadAsync(); } catch {}
    try { await this.soundB?.unloadAsync(); } catch {}
    this.soundA = null;
    this.soundB = null;
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private _attachStatusUpdate(sound: Audio.Sound, isA: boolean): void {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      const { durationMillis, positionMillis, isPlaying } = status;
      if (!durationMillis || !isPlaying) return;

      const remaining = durationMillis - positionMillis;
      if (remaining <= CROSSFADE_TRIGGER_MS && !this.crossfading) {
        // Only trigger if this is the active sound
        const amActive = isA ? this.activeIsA : !this.activeIsA;
        if (amActive) {
          this._startCrossfade();
        }
      }
    });
  }

  private async _startCrossfade(): Promise<void> {
    if (this.crossfading) return;
    this.crossfading = true;

    const inactiveRef = this.activeIsA ? 'B' : 'A';

    // Load inactive sound (same URI, fresh start)
    try {
      const inactiveSound = this.activeIsA ? this.soundB : this.soundA;
      if (inactiveSound) {
        await inactiveSound.unloadAsync().catch(() => {});
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: this.currentUri },
        { shouldPlay: true, volume: 0, isLooping: false }
      );

      if (inactiveRef === 'B') {
        this.soundB = newSound;
        this._attachStatusUpdate(newSound, false);
      } else {
        this.soundA = newSound;
        this._attachStatusUpdate(newSound, true);
      }

      // Crossfade: active fades out, inactive fades in
      const steps = CROSSFADE_DURATION_MS / CROSSFADE_STEP_MS;
      let step = 0;

      const activeSound = this.activeIsA ? this.soundA : this.soundB;
      const incomingSound = inactiveRef === 'B' ? this.soundB : this.soundA;

      this._clearCrossfadeInterval();
      this.crossfadeInterval = setInterval(async () => {
        step++;
        const t = Math.min(step / steps, 1);
        const incomingVol = this.currentVolume * t;
        const outgoingVol = this.currentVolume * (1 - t);

        try {
          await activeSound?.setVolumeAsync(outgoingVol);
          await incomingSound?.setVolumeAsync(incomingVol);
        } catch {}

        if (t >= 1) {
          this._clearCrossfadeInterval();
          // Swap active
          this.activeIsA = inactiveRef === 'A';
          this.crossfading = false;
          // Stop the old active sound
          try { await activeSound?.stopAsync(); } catch {}
        }
      }, CROSSFADE_STEP_MS);
    } catch (e) {
      console.warn('[CrossfadeAudioPair] crossfade failed:', e);
      this.crossfading = false;
    }
  }

  private _clearCrossfadeInterval(): void {
    if (this.crossfadeInterval) {
      clearInterval(this.crossfadeInterval);
      this.crossfadeInterval = null;
    }
  }
}

export default CrossfadeAudioPair;
