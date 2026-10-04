import type { StateStorage } from 'zustand/middleware';

type Listener = (failed: boolean) => void;
const listeners = new Set<Listener>();
let failed = false;

function setFailed(next: boolean) {
  if (failed === next) return;
  failed = next;
  listeners.forEach((l) => l(failed));
}

export function onStorageFailure(listener: Listener): () => void {
  listeners.add(listener);
  listener(failed);
  return () => listeners.delete(listener);
}

/**
 * localStorage wrapper that never throws: if storage is unavailable or full we keep
 * playing in memory and flag the failure so the UI can show a non-blocking warning.
 */
const memory = new Map<string, string>();
export const safeStorage: StateStorage = {
  getItem(name) {
    try {
      return window.localStorage.getItem(name) ?? memory.get(name) ?? null;
    } catch {
      setFailed(true);
      return memory.get(name) ?? null;
    }
  },
  setItem(name, value) {
    memory.set(name, value);
    try {
      window.localStorage.setItem(name, value);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  },
  removeItem(name) {
    memory.delete(name);
    try {
      window.localStorage.removeItem(name);
    } catch {
      setFailed(true);
    }
  },
};
