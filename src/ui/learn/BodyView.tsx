import { BODY_TOPICS, type BodyTopic } from '../../game/learning';
import { useAppStore } from '../../store/useAppStore';
import { useLearn } from './useLearn';

const TOPIC_ICON: Record<BodyTopic, string> = {
  food: '🍽️',
  play: '⚽',
  sleep: '😴',
  hygiene: '🧼',
  germs: '🦠',
  medicine: '💊',
};

/** Body book: a page unlocks each time the pet needs something. */
export function BodyView() {
  const { L, n } = useLearn();
  const unlocked = useAppStore((s) => s.game.progress.bodyTopics);
  return (
    <div className="space-y-2 pb-3">
      <p className="text-sm text-ink/70">
        {L.body.intro} ({n(unlocked.length)}/{n(BODY_TOPICS.length)})
      </p>
      {BODY_TOPICS.map((topic) => {
        const open = unlocked.includes(topic);
        const page = L.body.topics[topic];
        return open ? (
          <details key={topic} className="group rounded-2xl bg-rose-50 p-3">
            <summary className="flex min-h-10 cursor-pointer items-center gap-2 font-black text-ink">
              <span className="text-2xl" aria-hidden="true">
                {TOPIC_ICON[topic]}
              </span>
              {page.title}
            </summary>
            <div className="mt-2 space-y-2 text-sm text-ink">
              {page.text.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </details>
        ) : (
          <div key={topic} className="flex items-center gap-2 rounded-2xl bg-ink/5 p-3 text-ink/60">
            <span className="text-2xl" aria-hidden="true">
              🔒
            </span>
            <span>
              <span className="block font-black">{L.body.locked}</span>
              <span className="text-sm">{L.body.unlock[topic]}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
