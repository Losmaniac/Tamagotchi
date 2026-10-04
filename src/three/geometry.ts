import {
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
} from 'three';

// Shared unit geometries; meshes scale them. Created once, never disposed.
export const GEO = {
  sphere: new SphereGeometry(1, 32, 24),
  sphereLow: new SphereGeometry(1, 16, 12),
  cone: new ConeGeometry(1, 1, 24),
  capsule: new CapsuleGeometry(1, 1, 8, 16),
  cylinder: new CylinderGeometry(1, 1, 1, 16),
  /** Upper half-ring "∩" in the XY plane, radius 1. */
  arc: new TorusGeometry(1, 0.24, 8, 20, Math.PI),
  ring: new TorusGeometry(1, 0.22, 8, 24),
};
