// Placeholder until Milestone 4.
import { useMemo } from 'react';
import { moodOf } from '../game/status';
import { useAppStore } from '../store/useAppStore';
import { themeGradient } from '../three/palette';
import { ParticleLayer, ParticleSystem } from '../three/Particles';
import { PetCanvas } from '../three/PetCanvas';
import { PetStage } from '../three/PetStage';
import { useGameLoop } from './hooks';

export function MainScreen() {
  useGameLoop();
  const pet = useAppStore((s) => s.game.pet)!;
  const particles = useMemo(() => new ParticleSystem(), []);
  return (
    <main className="h-full" style={{ background: themeGradient(pet.species) }}>
      <PetCanvas className="h-full">
        <PetStage look={pet} mood={moodOf(pet)} particles={particles} poops={pet.poops} />
        <ParticleLayer system={particles} />
      </PetCanvas>
    </main>
  );
}
