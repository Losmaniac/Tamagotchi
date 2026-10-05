import { timeToNextInterest } from '../../game/bank';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/useAppStore';
import { Sheet } from '../components/Sheet';
import { formatDuration } from '../format';
import { useNow } from '../hooks';

/** Simple bar chart of the savings history (decorative; numbers are shown as text too). */
function SavingsChart({ history }: { history: { t: number; balance: number }[] }) {
  const pts = history.slice(-12);
  const max = Math.max(1, ...pts.map((p) => p.balance));
  const w = 300;
  const h = 120;
  const slot = w / 12;
  const bar = Math.min(slot - 6, 18);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" role="img" aria-hidden="true">
      <line x1={0} y1={h - 0.5} x2={w} y2={h - 0.5} stroke="#2b1a3d" strokeOpacity={0.15} />
      {pts.map((p, i) => {
        const bh = Math.max(3, (p.balance / max) * (h - 30));
        const x = i * slot + (slot - bar) / 2;
        const last = i === pts.length - 1;
        return (
          <g key={i}>
            <rect
              x={x}
              y={h - bh}
              width={bar}
              height={bh}
              rx={4}
              fill={last ? '#d12f7a' : '#f9a8d4'}
            />
            {last && (
              <text
                x={x + bar / 2}
                y={h - bh - 6}
                textAnchor="middle"
                fontSize={12}
                fontWeight={800}
                fill="#2b1a3d"
              >
                {p.balance}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function BankSheet({ onClose }: { onClose: () => void }) {
  const { t, tp, n } = useT();
  const coins = useAppStore((s) => s.game.coins);
  const bank = useAppStore((s) => s.game.bank);
  const deposit = useAppStore((s) => s.bankDeposit);
  const withdraw = useAppStore((s) => s.bankWithdraw);
  const now = useNow(30_000);
  const next = timeToNextInterest(bank, now);
  const btn = 'min-h-12 rounded-xl font-black disabled:opacity-40';

  return (
    <Sheet title={`🐷 ${t('bank.title')}`} onClose={onClose} full>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-pink-50 p-3">
          <p className="text-xs font-bold text-ink/60">{t('bank.balance')}</p>
          <p className="text-3xl font-black text-ink">🐷 {n(bank.balance)}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-3">
          <p className="text-xs font-bold text-ink/60">{t('bank.wallet')}</p>
          <p className="text-3xl font-black text-ink">🪙 {n(coins)}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink/70">{t('bank.explain')}</p>
      {next !== null && (
        <p className="mt-1 text-sm font-bold text-candy-purple">
          ⏳ {t('bank.next', { time: formatDuration(next, tp, 'acc') })}
        </p>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          className={`${btn} bg-pink-100 text-ink`}
          disabled={coins < 10}
          onClick={() => deposit(10)}
        >
          {t('bank.deposit')} 10
        </button>
        <button
          type="button"
          className={`${btn} col-span-2 bg-candy-pink text-white`}
          disabled={coins <= 0}
          onClick={() => deposit(coins)}
        >
          {t('bank.deposit')} {n(coins)}
        </button>
        <button
          type="button"
          className={`${btn} bg-ink/5 text-ink`}
          disabled={bank.balance < 10}
          onClick={() => withdraw(10)}
        >
          {t('bank.withdraw')} 10
        </button>
        <button
          type="button"
          className={`${btn} col-span-2 bg-ink/10 text-ink`}
          disabled={bank.balance <= 0}
          onClick={() => withdraw(bank.balance)}
        >
          {t('bank.withdraw')} {n(bank.balance)}
        </button>
      </div>

      <h3 className="mt-4 font-black text-ink">📈 {t('bank.chart')}</h3>
      {bank.history.length ? (
        <SavingsChart history={bank.history} />
      ) : (
        <p className="py-4 text-ink/60">{t('bank.empty')}</p>
      )}
    </Sheet>
  );
}
