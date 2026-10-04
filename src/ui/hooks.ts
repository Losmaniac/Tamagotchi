import { useEffect, useState } from 'react';
import { LIVE_TICK_MS } from '../game/constants';
import { useAppStore } from '../store/useAppStore';

export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** Re-renders every `intervalMs` with the current game clock. */
export function useNow(intervalMs = 1000): number {
  const now = useAppStore((s) => s.now);
  const [t, setT] = useState(now);
  useEffect(() => {
    const id = window.setInterval(() => setT(now()), intervalMs);
    return () => window.clearInterval(id);
  }, [now, intervalMs]);
  return t;
}

/**
 * Drives the simulation while the app is open: catch up on open/resume (shows the
 * "while you were away" card), tick every 10 s, stop while hidden.
 * The debug time multiplier advances the game clock faster than real time.
 */
export function useGameLoop(): void {
  const visible = usePageVisible();
  const timeScale = useAppStore((s) => s.debugTimeScale);

  useEffect(() => {
    if (!visible) return;
    const store = useAppStore.getState();
    store.resume();
    let last = Date.now();
    const interval = timeScale > 1 ? 1000 : LIVE_TICK_MS;
    const id = window.setInterval(() => {
      const real = Date.now();
      const s = useAppStore.getState();
      if (s.debugTimeScale > 1) {
        useAppStore.setState({
          debugOffset: s.debugOffset + (real - last) * (s.debugTimeScale - 1),
        });
      }
      last = real;
      useAppStore.getState().tick();
    }, interval);
    return () => window.clearInterval(id);
  }, [visible, timeScale]);
}
