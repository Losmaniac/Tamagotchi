import { useState } from 'react';
import { sfx } from '../../audio/synth';
import { FACTS_PER_SPECIES, QUIZ_COINS_PER_CORRECT, QUIZ_MIN_FACTS } from '../../game/constants';
import { hasSeen, learnedFacts, makeQuiz, type QuizQuestion } from '../../game/facts';
import { canQuizToday } from '../../game/game';
import { SPECIES, type Species } from '../../game/types';
import { FACTS } from '../../i18n/facts';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/useAppStore';
import { Sheet } from '../components/Sheet';
import { SPECIES_ICON } from '../icons';

function Quiz({ questions, onDone }: { questions: QuizQuestion[]; onDone: () => void }) {
  const { t, n, locale } = useT();
  const finishQuiz = useAppStore((s) => s.finishQuiz);
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answer, setAnswer] = useState<Species | null>(null);
  const [coins, setCoins] = useState<number | null>(null);
  const q = questions[i];

  if (coins !== null || !q) {
    return (
      <div className="py-6 text-center">
        <p className="text-5xl" aria-hidden="true">
          🎓
        </p>
        <p role="status" className="mt-3 text-xl font-black text-ink">
          {t('quiz.result', {
            correct: n(correct),
            total: n(questions.length),
            coins: n(coins ?? 0),
          })}
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-4 h-12 rounded-2xl bg-candy-pink px-6 font-black text-white"
        >
          {t('common.gotIt')}
        </button>
      </div>
    );
  }

  const choose = (s: Species) => {
    if (answer) return;
    setAnswer(s);
    if (s === q.species) {
      setCorrect((c) => c + 1);
      sfx.perfect();
    } else sfx.no();
  };
  const next = () => {
    setAnswer(null);
    if (i + 1 >= questions.length) {
      const earned = finishQuiz(correct);
      if (earned > 0) sfx.coin();
      setCoins(earned);
    } else setI(i + 1);
  };

  return (
    <div className="pb-3">
      <p className="text-sm font-bold text-ink/60">
        {t('quiz.question', { n: n(i + 1), total: n(questions.length) })}
      </p>
      <blockquote className="mt-2 rounded-2xl bg-sky-50 p-3 font-semibold text-ink">
        “{FACTS[locale][q.species][q.index]}”
      </blockquote>
      <p className="mt-3 font-black text-ink">{t('quiz.which')}</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {q.options.map((s) => {
          const state = !answer
            ? 'bg-white'
            : s === q.species
              ? 'bg-emerald-100 ring-4 ring-emerald-400'
              : s === answer
                ? 'bg-rose-100'
                : 'bg-white opacity-50';
          return (
            <button
              key={s}
              type="button"
              onClick={() => choose(s)}
              className={`flex min-h-20 flex-col items-center justify-center rounded-2xl shadow ${state}`}
            >
              <span className="text-3xl" aria-hidden="true">
                {SPECIES_ICON[s]}
              </span>
              <span className="text-xs font-black text-ink">{t(`species.${s}`)}</span>
            </button>
          );
        })}
      </div>
      {answer && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p
            role="status"
            className={`font-black ${answer === q.species ? 'text-emerald-700' : 'text-rose-700'}`}
          >
            {answer === q.species
              ? t('quiz.right')
              : t('quiz.wrong', { species: t(`species.${q.species}`) })}
          </p>
          <button
            type="button"
            onClick={next}
            autoFocus
            className="h-12 shrink-0 rounded-2xl bg-candy-purple px-5 font-black text-white"
          >
            {t('quiz.next')}
          </button>
        </div>
      )}
    </div>
  );
}

/** Animal facts learned from your pals, plus a daily quiz. */
export function EncyclopediaSheet({ onClose }: { onClose: () => void }) {
  const { t, n, locale } = useT();
  const seen = useAppStore((s) => s.game.progress.factsSeen);
  const game = useAppStore((s) => s.game);
  const now = useAppStore((s) => s.now);
  const current = useAppStore((s) => s.game.pet?.species ?? 'cat');
  const bilingual = useAppStore((s) => s.settings.bilingual);
  const [species, setSpecies] = useState<Species>(current);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const learned = learnedFacts(seen).length;
  const total = SPECIES.length * FACTS_PER_SPECIES;
  const quizToday = canQuizToday(game, now());
  const other = locale === 'cs' ? 'en' : 'cs';

  return (
    <Sheet title={`📚 ${t('ency.title')}`} onClose={onClose} full>
      {quiz ? (
        <Quiz questions={quiz} onDone={() => setQuiz(null)} />
      ) : (
        <>
          <p className="font-bold text-ink/60">
            {t('ency.progress', { done: n(learned), total: n(total) })}
          </p>
          <div className="mt-2 rounded-2xl bg-amber-50 p-3">
            <p className="font-black text-ink">🎓 {t('ency.quiz')}</p>
            <p className="text-sm text-ink/70">
              {learned < QUIZ_MIN_FACTS
                ? t('ency.quizNeed', { n: n(QUIZ_MIN_FACTS) })
                : quizToday
                  ? t('ency.quizDesc', { coins: n(QUIZ_COINS_PER_CORRECT) })
                  : t('ency.quizDone')}
            </p>
            {learned >= QUIZ_MIN_FACTS && quizToday && (
              <button
                type="button"
                onClick={() => setQuiz(makeQuiz(seen, Date.now() >>> 0))}
                className="mt-2 h-11 rounded-xl bg-candy-pink px-4 font-black text-white"
              >
                {t('mg.start')}
              </button>
            )}
          </div>
          <div role="tablist" className="mt-3 grid grid-cols-6 gap-1">
            {SPECIES.map((s) => (
              <button
                key={s}
                role="tab"
                type="button"
                aria-selected={species === s}
                aria-label={t(`species.${s}`)}
                onClick={() => setSpecies(s)}
                className={`flex min-h-12 items-center justify-center rounded-xl text-2xl ${species === s ? 'bg-white shadow ring-2 ring-candy-purple' : 'bg-ink/5'}`}
              >
                {SPECIES_ICON[s]}
              </button>
            ))}
          </div>
          <h3 className="mt-3 text-lg font-black text-ink">{t(`species.${species}`)}</h3>
          <ol className="mt-2 space-y-2 pb-4">
            {FACTS[locale][species].map((fact, i) =>
              hasSeen(seen, species, i) ? (
                <li
                  key={i}
                  className="rounded-2xl bg-sky-50 px-3 py-2 text-sm font-semibold text-ink"
                >
                  💡 {fact}
                  {bilingual && (
                    <span className="mt-1 block text-xs font-normal text-ink/60" lang={other}>
                      {FACTS[other][species][i]}
                    </span>
                  )}
                </li>
              ) : (
                <li key={i} className="rounded-2xl bg-ink/5 px-3 py-2 text-sm text-ink/50">
                  🔒 {t('ency.locked')}
                </li>
              ),
            )}
          </ol>
        </>
      )}
    </Sheet>
  );
}
