import { registerSW } from 'virtual:pwa-register';

/**
 * Registers the Workbox service worker that precaches the app shell for offline play.
 * Install prompt + "New version — tap to refresh" UX arrive in the Polish milestone.
 *
 * Push notifications (e.g. "your pet is hungry") would hook in here later; they need a
 * backend push service, which the MVP intentionally doesn't have.
 */
export function setupServiceWorker(onOfflineReady?: () => void): void {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  registerSW({ immediate: true, onOfflineReady });
}
