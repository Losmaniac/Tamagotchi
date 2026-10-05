import { useState } from 'react';
import { haptic } from '../audio/haptics';
import { sfx } from '../audio/synth';
import { useT } from '../i18n/useT';
import { WORDS } from '../i18n/vocab';
import { SPECIES_ICON } from '../ui/icons';
import { WORD_ROUNDS, makeWordRounds, wordNormalized } from './wordSnackLogic';
import type { MinigameProps } from './types';

/** Language game: the word is shown in the *other* language; pick its translation. */
export default function WordSnack({ species, onFinish, reduced }: MinigameProps) {
  const { t, n, locale } = useT();
  const other = locale === 'cs' ? 'en' : 'cs';
  const [rounds] = useState(() => makeWordRounds(Date.now() >>> 0, WORDS.length));
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const round = rounds[i]!;
  const word = WORDS[round.answer]!;

  const pick = (option: number) => {
    if (picked !== null) return;
    setPicked(option);
    const ok = option === round.answer;
    if (ok) {
      sfx.eat();
      haptic.success();
    } else sfx.no();
    const nextCorrect = correct + (ok ? 1 : 0);
    window.setTimeout(() => {
      setPicked(null);
      setCorrect(nextCorrect);
      if (i + 1 >= rounds.length) onFinish(wordNormalized(nextCorrect, rounds.length), nextCorrect);
      else setI(i + 1);
    }, 1100);
  };

  const ok = picked === round.answer;
  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-between px-4 py-2 text-lg font-black text-ink">
        <span>
          {n(i + 1)}/{n(Math.min(WORD_ROUNDS, rounds.length))}
        </span>
        <span>✓ {n(correct + (picked !== null && ok ? 1 : 0))}</span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl bg-white/40 p-4 text-center">
        <span
          className={`text-7xl ${picked !== null && ok && !reduced ? 'anim-wiggle' : ''}`}
          aria-hidden="true"
        >
          {SPECIES_ICON[species]}
        </span>
        <p className="text-sm font-bold text-ink/60" lang={other}>
          {word.emoji}
        </p>
        <p className="text-2xl font-black text-ink">
          {t('mg.wordSnack.prompt', { word: word[other] })}
        </p>
        <p
          role="status"
          className={`h-8 text-xl font-black ${ok ? 'text-emerald-600' : 'text-rose-600'}`}
        >
          {picked === null
            ? ''
            : ok
              ? t('mg.wordSnack.right')
              : t('mg.wordSnack.wrong', { word: word[locale] })}
        </p>
      </div>
      <div className="grid gap-2 pt-3">
        {round.options.map((o) => {
          const w = WORDS[o]!;
          const state =
            picked === null
              ? ''
              : o === round.answer
                ? 'bg-emerald-100 ring-4 ring-emerald-400'
                : o === picked
                  ? 'bg-rose-100'
                  : 'opacity-60';
          return (
            <button
              key={o}
              type="button"
              onClick={() => pick(o)}
              disabled={picked !== null}
              className={`min-h-14 rounded-2xl bg-white text-xl font-black text-ink shadow-md active:scale-95 ${state}`}
            >
              {w[locale]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
