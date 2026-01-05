/**
 * WAVIUM - Offline System
 * Download and manage subliminals for offline use
 */

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Offline track metadata
export interface OfflineTrack {
  id: string;
  title: string;
  category: string;
  audioUrl: string;
  localPath: string;
  duration: number;
  affirmations: string[];
  downloadedAt: string;
  fileSize: number;
}

// Download progress
export interface DownloadProgress {
  id: string;
  progress: number;
  status: 'pending' | 'downloading' | 'complete' | 'error';
  error?: string;
}

const OFFLINE_STORAGE_KEY = 'wavium-offline-tracks';
const getOfflineDir = () => `${FileSystem.documentDirectory || ''}offline/`;

class OfflineSystem {
  private tracks: Map<string, OfflineTrack> = new Map();
  private downloadCallbacks: Map<string, (progress: DownloadProgress) => void> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Create offline directory if it doesn't exist
    const offlineDir = getOfflineDir();
    const dirInfo = await FileSystem.getInfoAsync(offlineDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(offlineDir, { intermediates: true });
    }

    // Load saved track metadata
    await this.loadSavedTracks();
  }

  private async loadSavedTracks() {
    try {
      const saved = await AsyncStorage.getItem(OFFLINE_STORAGE_KEY);
      if (saved) {
        const tracks: OfflineTrack[] = JSON.parse(saved);
        tracks.forEach(track => {
          this.tracks.set(track.id, track);
        });
      }
    } catch (error) {
      console.error('Error loading offline tracks:', error);
    }
  }

  private async saveTracks() {
    try {
      const tracks = Array.from(this.tracks.values());
      await AsyncStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(tracks));
    } catch (error) {
      console.error('Error saving offline tracks:', error);
    }
  }

  // Check if a track is downloaded
  isDownloaded(id: string): boolean {
    return this.tracks.has(id);
  }

  // Get local path for a track
  getLocalPath(id: string): string | null {
    const track = this.tracks.get(id);
    return track?.localPath || null;
  }

  // Get all downloaded tracks
  getAllTracks(): OfflineTrack[] {
    return Array.from(this.tracks.values());
  }

  // Get total storage used
  async getStorageUsed(): Promise<number> {
    let total = 0;
    for (const track of this.tracks.values()) {
      total += track.fileSize;
    }
    return total;
  }

  // Download a track
  async download(
    subliminal: {
      id: string;
      title: string;
      category: string;
      audioUrl: string;
      duration: number;
      affirmations: string[];
    },
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    const { id, audioUrl } = subliminal;

    // Already downloaded
    if (this.tracks.has(id)) {
      onProgress?.({ id, progress: 100, status: 'complete' });
      return true;
    }

    // Set up callback
    if (onProgress) {
      this.downloadCallbacks.set(id, onProgress);
    }

    try {
      onProgress?.({ id, progress: 0, status: 'downloading' });

      const localPath = `${getOfflineDir()}${id}.mp3`;

      // Download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        audioUrl,
        localPath,
        {},
        (downloadProgress: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => {
          const progress =
            (downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite) *
            100;
          onProgress?.({ id, progress, status: 'downloading' });
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result) {
        throw new Error('Download failed');
      }

      // Get file info for size
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      const fileSize = (fileInfo as any).size || 0;

      // Save track metadata
      const offlineTrack: OfflineTrack = {
        id,
        title: subliminal.title,
        category: subliminal.category,
        audioUrl,
        localPath,
        duration: subliminal.duration,
        affirmations: subliminal.affirmations,
        downloadedAt: new Date().toISOString(),
        fileSize,
      };

      this.tracks.set(id, offlineTrack);
      await this.saveTracks();

      onProgress?.({ id, progress: 100, status: 'complete' });
      this.downloadCallbacks.delete(id);

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Download failed';
      onProgress?.({ id, progress: 0, status: 'error', error: errorMessage });
      this.downloadCallbacks.delete(id);
      return false;
    }
  }

  // Delete a downloaded track
  async delete(id: string): Promise<boolean> {
    const track = this.tracks.get(id);
    if (!track) return false;

    try {
      // Delete file
      await FileSystem.deleteAsync(track.localPath, { idempotent: true });

      // Remove from map
      this.tracks.delete(id);
      await this.saveTracks();

      return true;
    } catch (error) {
      console.error('Error deleting offline track:', error);
      return false;
    }
  }

  // Delete all downloaded tracks
  async deleteAll(): Promise<boolean> {
    try {
      // Delete all files
      for (const track of this.tracks.values()) {
        await FileSystem.deleteAsync(track.localPath, { idempotent: true });
      }

      // Clear map
      this.tracks.clear();
      await this.saveTracks();

      return true;
    } catch (error) {
      console.error('Error deleting all offline tracks:', error);
      return false;
    }
  }

  // Check storage availability
  async getAvailableStorage(): Promise<number> {
    const freeSpace = await FileSystem.getFreeDiskStorageAsync();
    return freeSpace;
  }
}

// Export singleton instance
export const offline = new OfflineSystem();

// React hook for offline system
import { useState, useEffect, useCallback } from 'react';

export function useOffline(trackId?: string) {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [allTracks, setAllTracks] = useState<OfflineTrack[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);

  useEffect(() => {
    if (trackId) {
      setIsDownloaded(offline.isDownloaded(trackId));
    }
    setAllTracks(offline.getAllTracks());
    offline.getStorageUsed().then(setStorageUsed);
  }, [trackId]);

  const download = useCallback(
    async (subliminal: Parameters<typeof offline.download>[0]) => {
      setDownloading(true);
      setProgress(0);

      const result = await offline.download(subliminal, (p) => {
        setProgress(p.progress);
        if (p.status === 'complete' || p.status === 'error') {
          setDownloading(false);
          setIsDownloaded(p.status === 'complete');
        }
      });

      setAllTracks(offline.getAllTracks());
      setStorageUsed(await offline.getStorageUsed());

      return result;
    },
    []
  );

  const remove = useCallback(async (id: string) => {
    const result = await offline.delete(id);
    if (result && id === trackId) {
      setIsDownloaded(false);
    }
    setAllTracks(offline.getAllTracks());
    setStorageUsed(await offline.getStorageUsed());
    return result;
  }, [trackId]);

  const getLocalPath = useCallback((id: string) => {
    return offline.getLocalPath(id);
  }, []);

  return {
    isDownloaded,
    downloading,
    progress,
    allTracks,
    storageUsed,
    download,
    remove,
    getLocalPath,
  };
}
