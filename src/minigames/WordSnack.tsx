import { useState } from 'react';
import { haptic } from '../audio/haptics';
import { sfx } from '../audio/synth';
import { isImmersionDay } from '../game/game';
import { learnedCount } from '../game/words';
import { useT } from '../i18n/useT';
import { PACK_ICON, WORDS, WORD_PACKS, type Word, type WordPack } from '../i18n/words';
import { useAppStore } from '../store/useAppStore';
import { SPECIES_ICON } from '../ui/icons';
import { WORD_ROUNDS, makeWordRounds, wordNormalized, type WordRound } from './wordSnackLogic';
import type { MinigameProps } from './types';

function PackPicker({ onPick }: { onPick: (pack: WordPack) => void }) {
  const { t, n, locale } = useT();
  const boxes = useAppStore((s) => s.game.progress.words);
  const name = useAppStore((s) => s.game.pet?.name ?? '');
  const immersion = useAppStore((s) => isImmersionDay(s.game, s.now()));
  const setImmersion = useAppStore((s) => s.setImmersion);
  const other = locale === 'cs' ? 'en' : 'cs';
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      <h3 className="text-center text-xl font-black text-ink">{t('mg.wordSnack.pickPack')}</h3>
      <ul className="grid grid-cols-2 gap-2">
        {WORD_PACKS.map((pack) => {
          const ids = WORDS[pack].map((w) => w.id);
          return (
            <li key={pack}>
              <button
                type="button"
                onClick={() => onPick(pack)}
                className="flex min-h-20 w-full flex-col items-center justify-center rounded-2xl bg-white px-2 py-2 shadow-md active:scale-95"
              >
                <span className="text-3xl" aria-hidden="true">
                  {PACK_ICON[pack]}
                </span>
                <span className="font-black text-ink">{t(`pack.${pack}`)}</span>
                <span className="text-xs font-bold text-ink/60">
                  {t('mg.wordSnack.learned', {
                    learned: n(learnedCount(ids, boxes)),
                    total: n(ids.length),
                  })}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="rounded-2xl bg-white/70 p-3 text-center">
        <p className="text-sm font-bold text-ink">
          🗣️ {t('mg.wordSnack.immersion', { name, lang: t(`langAdv.${other}`) })}
        </p>
        <button
          type="button"
          onClick={() => setImmersion(!immersion)}
          aria-pressed={immersion}
          className={`mt-2 min-h-12 rounded-xl px-4 font-black ${immersion ? 'bg-candy-purple text-white' : 'bg-violet-100 text-ink'}`}
        >
          {immersion ? t('mg.wordSnack.immersionStop') : t('mg.wordSnack.immersionStart')}
        </button>
      </div>
    </div>
  );
}

function Rounds({ pack, species, onFinish, reduced }: MinigameProps & { pack: WordPack }) {
  const { t, n, locale } = useT();
  const recordWords = useAppStore((s) => s.recordWords);
  const other = locale === 'cs' ? 'en' : 'cs';
  const words = WORDS[pack];
  const byId = (id: string): Word => words.find((w) => w.id === id)!;
  const [rounds] = useState<WordRound[]>(() =>
    makeWordRounds(
      Date.now() >>> 0,
      words.map((w) => w.id),
      useAppStore.getState().game.progress.words,
    ),
  );
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answers, setAnswers] = useState<{ id: string; correct: boolean }[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const round = rounds[i]!;
  const word = byId(round.answer);

  const pick = (option: string) => {
    if (picked !== null) return;
    setPicked(option);
    const ok = option === round.answer;
    if (ok) {
      sfx.eat();
      haptic.success();
    } else sfx.no();
    const nextCorrect = correct + (ok ? 1 : 0);
    const nextAnswers = [...answers, { id: round.answer, correct: ok }];
    window.setTimeout(() => {
      setPicked(null);
      setCorrect(nextCorrect);
      setAnswers(nextAnswers);
      if (i + 1 >= rounds.length) {
        recordWords(nextAnswers);
        onFinish(wordNormalized(nextCorrect, rounds.length), nextCorrect);
      } else setI(i + 1);
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
        <p className="text-3xl" aria-hidden="true">
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
      <div className="word-options grid gap-2 pt-3">
        {round.options.map((o) => {
          const w = byId(o);
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

/**
 * Language game: pick a themed pack; each word is shown in the *other* language and you pick
 * its translation. Missed words come back first next time (spaced repetition).
 */
export default function WordSnack(props: MinigameProps) {
  const [pack, setPack] = useState<WordPack | null>(null);
  if (!pack) return <PackPicker onPick={setPack} />;
  return <Rounds {...props} pack={pack} />;
}
