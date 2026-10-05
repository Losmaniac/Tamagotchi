import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { setMaterialQuality } from './materials';

function CameraRig({ y, z }: { y: number; z: number }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    camera.position.set(0, 1.35, z);
    camera.lookAt(0, y, 0);
    invalidate();
  }, [camera, y, z, invalidate]);
  return null;
}

/** Renders one fresh frame and returns it as a PNG data URL. */
export type CaptureFn = () => string | null;

function CaptureBridge({ onReady }: { onReady: (fn: CaptureFn | null) => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    onReady(() => {
      try {
        gl.render(scene, camera);
        return gl.domElement.toDataURL('image/png');
      } catch {
        return null;
      }
    });
    return () => onReady(null);
  }, [gl, scene, camera, onReady]);
  return null;
}

/** Procedural studio lighting for reflections (no HDR download needed). */
function RoomEnv() {
  const get = useThree((s) => s.get);
  useLayoutEffect(() => {
    const { gl, scene } = get();
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.5;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
      room.dispose();
    };
  }, [get]);
  return null;
}

// Set once any canvas runs too slowly; every canvas then uses the cheaper cartoon look for the
// rest of the session (weak phones, software rendering).
let slowDevice = false;
const listeners = new Set<() => void>();

const WARMUP_S = 1.5; // skip shader compilation frames
const WINDOW_S = 2;
const MIN_FPS = 28;

/** Watches the frame rate in plush mode and reports a device that cannot keep up. */
function FpsGuard({ onSlow }: { onSlow: () => void }) {
  const t = useRef({ elapsed: 0, frames: 0, window: 0, strikes: 0 });
  useFrame((_, delta) => {
    const s = t.current;
    s.elapsed += delta;
    if (s.elapsed < WARMUP_S) return;
    s.frames++;
    s.window += delta;
    if (s.window < WINDOW_S) return;
    const fps = s.frames / s.window;
    s.strikes = fps < MIN_FPS ? s.strikes + 1 : 0;
    s.frames = 0;
    s.window = 0;
    if (s.strikes >= 2) onSlow();
  });
  return null;
}

function markSlow(): void {
  if (slowDevice) return;
  slowDevice = true;
  listeners.forEach((fn) => fn());
}

function useSlowDevice(): boolean {
  const [slow, setSlow] = useState(slowDevice);
  useLayoutEffect(() => {
    const fn = () => setSlow(true);
    listeners.add(fn);
    if (slowDevice) fn();
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return slow;
}

export interface PetCanvasProps {
  children: ReactNode;
  /** Low-power mode: dpr 1, no antialiasing. */
  lowPower?: boolean;
  /** 'running' animates, 'paused' renders on demand (overlay open), 'hidden' stops. */
  mode?: 'running' | 'paused' | 'hidden';
  className?: string;
  cameraZ?: number;
  /** Camera target height; lower values move the pet up the screen. */
  lookAtY?: number;
  label?: string;
  /** Receives a function that snapshots the canvas (photo mode). */
  onCaptureReady?: (fn: CaptureFn | null) => void;
}

/** Shared R3F canvas: transparent over a CSS gradient, flat (untonemapped) candy colors. */
export function PetCanvas({
  children,
  lowPower = false,
  mode = 'running',
  className,
  cameraZ = 4.6,
  lookAtY = 0.8,
  label,
  onCaptureReady,
}: PetCanvasProps) {
  // Low-power (or a device that proved too slow) keeps the cheap cel-shaded look;
  // otherwise soft plush fur + reflections.
  const slow = useSlowDevice();
  const quality = lowPower || slow ? 'cartoon' : 'plush';
  setMaterialQuality(quality);
  return (
    <div className={className} role="img" aria-label={label}>
      <Canvas
        flat
        dpr={lowPower ? 1 : slow ? [1, 1.5] : [1, 2]}
        frameloop={mode === 'running' ? 'always' : mode === 'paused' ? 'demand' : 'never'}
        gl={{
          antialias: !lowPower,
          alpha: true,
          powerPreference: lowPower ? 'low-power' : 'high-performance',
        }}
        camera={{ position: [0, 1.35, cameraZ], fov: 32 }}
        style={{ touchAction: 'none' }}
      >
        <CameraRig y={lookAtY} z={cameraZ} />
        {onCaptureReady && <CaptureBridge onReady={onCaptureReady} />}
        {quality === 'plush' ? (
          <>
            {mode === 'running' && <FpsGuard onSlow={markSlow} />}
            <RoomEnv />
            <hemisphereLight args={['#fff6fb', '#b9a6e8', 0.75]} />
            <directionalLight position={[2.5, 4, 3.5]} intensity={1.7} color="#fff1e0" />
            <directionalLight position={[-2.5, 2.5, -3]} intensity={1.5} color="#ffd6f6" />
            <directionalLight position={[-3, 1, 2]} intensity={0.45} color="#d6ecff" />
          </>
        ) : (
          <>
            <ambientLight intensity={1.1} />
            <directionalLight position={[2.5, 4, 3.5]} intensity={2.4} />
            <directionalLight position={[-3, 2, -2]} intensity={0.6} color="#ffd6f6" />
          </>
        )}
        <group key={quality}>{children}</group>
      </Canvas>
    </div>
  );
}
