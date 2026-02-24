/**
 * WAVIUM - useLoop Hook
 * Safe repeating animation with proper cancelAnimation cleanup
 */

import { useEffect } from 'react';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

interface UseLoopOptions {
  from?: number;
  to?: number;
  duration?: number;
  easing?: (value: number) => number;
  autoStart?: boolean;
}

export function useLoop(options: UseLoopOptions = {}): SharedValue<number> {
  const {
    from = 0,
    to = 1,
    duration = 2000,
    easing = Easing.inOut(Easing.sin),
    autoStart = true,
  } = options;

  const value = useSharedValue(from);

  useEffect(() => {
    if (autoStart) {
      value.value = withRepeat(
        withTiming(to, { duration, easing }),
        -1,
        true
      );
    }
    return () => {
      cancelAnimation(value);
    };
  }, [autoStart, to, duration]);

  return value;
}
