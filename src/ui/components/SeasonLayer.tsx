import type { Season, SkyPhase } from '../../game/world';

const PARTICLE: Record<Season, string> = { spring: '🌸', summer: '✨', autumn: '🍂', winter: '❄️' };

/** Gentle seasonal particles and night stars behind the pet (decorative only). */
export function SeasonLayer({
  season,
  phase,
  enabled,
}: {
  season: Season;
  phase: SkyPhase;
  enabled: boolean;
}) {
  const night = phase === 'night' || phase === 'dusk';
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {night &&
        Array.from({ length: 14 }, (_, i) => (
          <span
            key={`s${i}`}
            className="anim-twinkle absolute rounded-full bg-white"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 23) % 45}%`,
              width: i % 3 ? 2 : 3,
              height: i % 3 ? 2 : 3,
              animationDelay: `${(i % 5) * 0.7}s`,
            }}
          />
        ))}
      {enabled &&
        Array.from({ length: 7 }, (_, i) => (
          <span
            key={`p${i}`}
            className="anim-fall absolute -top-8 text-lg opacity-70"
            style={{
              left: `${8 + ((i * 41) % 84)}%`,
              animationDelay: `${i * 1.9}s`,
              animationDuration: `${11 + (i % 3) * 3}s`,
            }}
          >
            {season === 'summer' && night ? '✨' : PARTICLE[season]}
          </span>
        ))}
    </div>
  );
}
