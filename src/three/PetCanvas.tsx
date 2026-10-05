import { useLayoutEffect, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';

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
  return (
    <div className={className} role="img" aria-label={label}>
      <Canvas
        flat
        dpr={lowPower ? 1 : [1, 2]}
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
        <ambientLight intensity={1.1} />
        <directionalLight position={[2.5, 4, 3.5]} intensity={2.4} />
        <directionalLight position={[-3, 2, -2]} intensity={0.6} color="#ffd6f6" />
        {children}
      </Canvas>
    </div>
  );
}
