/**
 * WAVIUM - Theme Store
 * Time-shifting theme management
 */

import { create } from 'zustand';
import { getCurrentTimeOfDay, getThemeForTime, type TimeOfDay, type ThemeColors } from '../theme';

interface ThemeStoreState {
  // Current time of day
  timeOfDay: TimeOfDay;

  // Current theme colors
  colors: ThemeColors;

  // Manual override (null = auto based on time)
  manualTheme: TimeOfDay | null;

  // Actions
  updateTimeOfDay: () => void;
  setManualTheme: (theme: TimeOfDay | null) => void;
}

export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  timeOfDay: getCurrentTimeOfDay(),
  colors: getThemeForTime(getCurrentTimeOfDay()),
  manualTheme: null,

  updateTimeOfDay: () => {
    const { manualTheme } = get();
    const newTime = manualTheme ?? getCurrentTimeOfDay();

    set({
      timeOfDay: newTime,
      colors: getThemeForTime(newTime),
    });
  },

  setManualTheme: (theme) => {
    const newTime = theme ?? getCurrentTimeOfDay();

    set({
      manualTheme: theme,
      timeOfDay: newTime,
      colors: getThemeForTime(newTime),
    });
  },
}));

// Hook to auto-update theme based on time
export function useTimeBasedTheme() {
  const updateTimeOfDay = useThemeStore((state) => state.updateTimeOfDay);

  // This would be called periodically (every minute) in the app
  return { updateTimeOfDay };
}
