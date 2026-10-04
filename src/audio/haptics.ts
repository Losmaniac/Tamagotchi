// navigator.vibrate exists on Android Chrome; iOS Safari ignores it. Fail silently.

let enabled = true;

export function setHapticsEnabled(on: boolean): void {
  enabled = on;
}

export function vibrate(pattern: number | number[]): void {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function')
    return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* unsupported */
  }
}

export const haptic = {
  tap: () => vibrate(10),
  success: () => vibrate([15, 40, 15]),
  error: () => vibrate([40, 30, 40]),
  alert: () => vibrate([60, 40, 60, 40, 60]),
};
