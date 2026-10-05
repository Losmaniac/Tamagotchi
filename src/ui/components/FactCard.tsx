import type { Pet } from '../../game/types';
import { FACTS } from '../../i18n/facts';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/useAppStore';

export function FactCard({
  pet,
  index,
  onClose,
}: {
  pet: Pet;
  index: number;
  onClose: () => void;
}) {
  const { t, locale } = useT();
  const learnFact = useAppStore((s) => s.learnFact);
  const bilingual = useAppStore((s) => s.settings.bilingual);
  const other = locale === 'cs' ? 'en' : 'cs';
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/45 p-5"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="fact-title"
        className="anim-pop w-full max-w-sm rounded-[2rem] bg-white p-5 shadow-2xl"
      >
        <h2 id="fact-title" className="text-2xl font-black text-ink">
          💡 {t('fact.title')}
        </h2>
        <p className="mt-3 text-lg font-semibold text-ink">{FACTS[locale][pet.species][index]}</p>
        {bilingual && (
          <p className="mt-2 text-sm text-ink/60" lang={other}>
            {FACTS[other][pet.species][index]}
          </p>
        )}
        <p className="mt-2 text-right text-sm font-bold text-ink/50">— {pet.name}</p>
        <button
          type="button"
          autoFocus
          onClick={() => {
            learnFact(pet.species, index);
            onClose();
          }}
          className="mt-4 h-14 w-full rounded-2xl bg-candy-pink text-lg font-black text-white shadow-md"
        >
          📚 {t('fact.add')}
        </button>
      </section>
    </div>
  );
}
