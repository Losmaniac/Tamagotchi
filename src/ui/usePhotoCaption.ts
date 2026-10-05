import type { StringKey } from '../i18n/en';
import { useT } from '../i18n/useT';
import type { Photo } from './album';
import { formatDuration } from './format';

export function usePhotoCaption() {
  const { t, tp } = useT();
  return (p: Pick<Photo, 'kind' | 'detail'>) => {
    switch (p.kind) {
      case 'hatched':
        return t('album.hatched');
      case 'evolved':
        return t('album.evolved', { stage: t(`stage.${p.detail ?? 'baby'}` as StringKey) });
      case 'birthday':
        return t('album.birthday', { age: formatDuration(Number(p.detail ?? 1) * 86_400_000, tp) });
      default:
        return t('album.photo');
    }
  };
}
