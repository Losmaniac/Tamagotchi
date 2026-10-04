import { useEffect } from 'react';
import { haptic, setHapticsEnabled } from '../audio/haptics';
import { setSoundEnabled, sfx, unlockAudio, type SfxName } from '../audio/synth';
import { isCritical } from '../game/status';
import { useAppStore } from '../store/useAppStore';
import type { ReactionKind } from '../three/anim';

const REACTION_SFX: Record<ReactionKind, SfxName> = {
  poke: 'poke',
  stroke: 'stroke',
  eat: 'eat',
  snack: 'eat',
  hop: 'happy',
  play: 'happy',
  clean: 'clean',
  medicine: 'medicine',
  scold: 'scold',
  refuse: 'no',
  evolve: 'levelUp',
};

/** Sounds + haptics driven by store changes, so game logic stays effect-free. */
export function useFeedbackEffects(): void {
  const sound = useAppStore((s) => s.settings.sound);
  const haptics = useAppStore((s) => s.settings.haptics);

  useEffect(() => setSoundEnabled(sound), [sound]);
  useEffect(() => setHapticsEnabled(haptics), [haptics]);

  useEffect(() => {
    // Audio may only start after a user gesture.
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(
    () =>
      useAppStore.subscribe((s, prev) => {
        if (s.reaction && s.reaction !== prev.reaction) {
          sfx[REACTION_SFX[s.reaction.kind]]();
          if (s.reaction.kind === 'refuse') haptic.error();
          else if (s.reaction.kind === 'evolve') haptic.success();
          else haptic.tap();
        }
        if (s.feedback && s.feedback !== prev.feedback) {
          if (s.feedback.action === 'lights' && s.feedback.outcome === 'ok') sfx.lights();
          if (s.feedback.outcome === 'gotSick') sfx.alert();
        }
        const pet = s.game.pet;
        const before = prev.game.pet;
        if (!pet || !before || pet.id !== before.id) return;
        if (pet.dead && !before.dead) {
          sfx.sad();
          haptic.alert();
        } else if ((isCritical(pet) && !isCritical(before)) || (pet.sick && !before.sick)) {
          sfx.alert();
          haptic.alert();
        }
        if (s.achievementQueue.length > prev.achievementQueue.length) sfx.coin();
      }),
    [],
  );
}
