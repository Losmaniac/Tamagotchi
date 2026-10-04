import { useState } from 'react';
import { sfx } from '../../audio/synth';
import { ITEM_SLOTS, SHOP_ITEMS, type ItemId, type ItemSlot } from '../../game/shop';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/useAppStore';
import { Sheet } from '../components/Sheet';

const ITEM_ICON: Record<ItemId, string> = {
  partyHat: '🥳',
  beanie: '🧢',
  flowerCrown: '🌸',
  crown: '👑',
  roundGlasses: '👓',
  sunglasses: '🕶️',
  heartGlasses: '💖',
  redScarf: '🧣',
  stripedScarf: '🧶',
  bowtie: '🎀',
  bgSunset: '🌅',
  bgForest: '🌲',
  bgCandy: '🍭',
  bgSpace: '🌌',
};

/** Cosmetics-only shop (lazy-loaded). Coins come from playing and caring. */
export default function ShopSheet({ onClose }: { onClose: () => void }) {
  const { t, n } = useT();
  const coins = useAppStore((s) => s.game.coins);
  const inventory = useAppStore((s) => s.game.inventory);
  const buy = useAppStore((s) => s.buy);
  const toggleItem = useAppStore((s) => s.toggleItem);
  const [slot, setSlot] = useState<ItemSlot>('hat');

  return (
    <Sheet title={`🛍️ ${t('shop.title')}`} onClose={onClose} half>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink/60">{t('shop.subtitle')}</p>
        <p className="shrink-0 rounded-full bg-amber-100 px-3 py-1 font-black text-ink">
          🪙 {n(coins)}
        </p>
      </div>
      <div
        role="tablist"
        aria-label={t('shop.title')}
        className="mt-3 grid grid-cols-4 gap-1 rounded-2xl bg-ink/5 p-1"
      >
        {ITEM_SLOTS.map((s) => (
          <button
            key={s}
            role="tab"
            type="button"
            aria-selected={slot === s}
            onClick={() => setSlot(s)}
            className={`min-h-11 rounded-xl text-xs font-black ${slot === s ? 'bg-white text-ink shadow' : 'text-ink/60'}`}
          >
            {t(`shop.slot.${s}`)}
          </button>
        ))}
      </div>
      <ul role="tabpanel" className="mt-3 grid grid-cols-2 gap-2 pb-3">
        {SHOP_ITEMS.filter((i) => i.slot === slot).map((item) => {
          const owned = inventory.owned.includes(item.id);
          const worn = inventory.equipped[item.slot] === item.id;
          const affordable = coins >= item.price;
          const accent = 'accent' in item ? item.accent : item.color;
          return (
            <li
              key={item.id}
              className={`flex flex-col rounded-2xl p-2 shadow-sm ${worn ? 'ring-4 ring-candy-pink' : 'ring-1 ring-ink/10'}`}
            >
              <div
                className="flex h-16 items-center justify-center rounded-xl text-4xl"
                style={{ background: `linear-gradient(135deg, ${item.color}, ${accent})` }}
                aria-hidden="true"
              >
                {ITEM_ICON[item.id]}
              </div>
              <p className="mt-1.5 truncate text-sm font-black text-ink">{t(`item.${item.id}`)}</p>
              {owned ? (
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-pressed={worn}
                  className={`mt-1 min-h-11 rounded-xl text-sm font-black ${worn ? 'bg-ink/10 text-ink' : 'bg-candy-purple text-white'}`}
                >
                  {worn ? t('shop.takeOff') : t('shop.wear')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (buy(item.id) === 'ok') sfx.coin();
                    else sfx.no();
                  }}
                  aria-disabled={!affordable}
                  aria-label={`${t('shop.buy')} ${t(`item.${item.id}`)}, ${n(item.price)} ${t('coins.label')}`}
                  className={`mt-1 min-h-11 rounded-xl text-sm font-black ${affordable ? 'bg-candy-pink text-white' : 'bg-ink/10 text-ink/50'}`}
                >
                  {affordable ? `${t('shop.buy')} · ` : '🔒 '}🪙 {n(item.price)}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
