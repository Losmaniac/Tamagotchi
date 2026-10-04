import { canPlay } from '../../game/actions';
import type { MinigameId } from '../../game/save';
import type { Pet } from '../../game/types';
import { useT } from '../../i18n/useT';
import type { PetAction } from '../../store/useAppStore';
import { Sheet } from '../components/Sheet';
import { GAMES } from '../games';
import { MenuButton } from './FeedSheet';

interface PlaySheetProps {
  pet: Pet;
  onClose: () => void;
  onAction: (a: PetAction) => void;
  onGame: (id: MinigameId) => void;
}

export function PlaySheet({ pet, onClose, onAction, onGame }: PlaySheetProps) {
  const { t } = useT();
  const ok = canPlay(pet);
  return (
    <Sheet title={t('play.title')} onClose={onClose}>
      {!ok && (
        <p
          role="status"
          className="mb-3 rounded-2xl bg-amber-100 px-3 py-2 font-bold text-amber-900"
        >
          {pet.asleep
            ? t('outcome.asleep', { name: pet.name })
            : t('outcome.tooTired', { name: pet.name })}
        </p>
      )}
      <div className="space-y-3 pb-2">
        <MenuButton
          icon="🧶"
          title={t('play.toy')}
          desc={t('play.toyDesc')}
          disabled={!ok}
          onClick={() => {
            onAction('toy');
            onClose();
          }}
        />
        {GAMES.map((g) => (
          <MenuButton
            key={g.id}
            icon={g.icon}
            title={t(`game.${g.id}`)}
            desc={t(`game.${g.id}Desc`)}
            disabled={!ok}
            onClick={() => onGame(g.id)}
          />
        ))}
      </div>
    </Sheet>
  );
}
