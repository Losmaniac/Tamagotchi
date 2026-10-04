import { create } from 'zustand';
import { registerSW } from 'virtual:pwa-register';

interface PwaState {
  /** A new version is active; reload to use it. */
  needRefresh: boolean;
  offlineReady: boolean;
}

export const usePwaStore = create<PwaState>(() => ({ needRefresh: false, offlineReady: false }));

let registered = false;

/**
 * Registers the Workbox service worker (precaches the whole app shell for offline play).
 * autoUpdate mode activates new versions in the background; instead of reloading under
 * a running game we show "New version — tap to refresh".
 *
 * Push notifications (e.g. "your pet is hungry") would hook in here later. They need a
 * push service + backend, which the MVP intentionally doesn't have.
 */
export function setupServiceWorker(): void {
  if (registered || !('serviceWorker' in navigator) || import.meta.env.DEV) return;
  registered = true;
  registerSW({
    immediate: true,
    onNeedReload: () => usePwaStore.setState({ needRefresh: true }),
    onOfflineReady: () => usePwaStore.setState({ offlineReady: true }),
    onRegisteredSW: (_url, registration) => {
      // Long sessions: look for a new version once an hour.
      if (registration)
        setInterval(() => void registration.update().catch(() => undefined), 60 * 60 * 1000);
    },
  });
}

/** React.lazy factory wrapper: if a chunk from an old version is gone, reload once. */
export function withChunkReload<T>(factory: () => Promise<T>): () => Promise<T> {
  return () =>
    factory().catch((err: unknown) => {
      const key = 'pocketpals:chunk-reload';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        return new Promise<T>(() => undefined);
      }
      throw err;
    });
}
