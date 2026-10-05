import { useEffect, useState } from 'react';
import { useT } from '../../i18n/useT';
import { listPhotos, type Photo } from '../album';
import { Sheet } from '../components/Sheet';
import { dataUrlToFile, shareOrDownload } from '../photo';
import { usePhotoCaption } from '../usePhotoCaption';

/** Photos of one pet (or all pets), stored on this device. */
export function AlbumSheet({
  petId,
  title,
  onClose,
}: {
  petId?: string;
  title?: string;
  onClose: () => void;
}) {
  const { t, locale } = useT();
  const caption = usePhotoCaption();
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [open, setOpen] = useState<Photo | null>(null);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });

  useEffect(() => {
    let alive = true;
    void listPhotos(petId).then((p) => alive && setPhotos(p));
    return () => {
      alive = false;
    };
  }, [petId]);

  return (
    <Sheet title={`🖼️ ${title ?? t('album.title')}`} onClose={onClose} full>
      {open ? (
        <div className="pb-4 text-center">
          <img
            src={open.image}
            alt={`${open.petName} — ${caption(open)}`}
            className="mx-auto w-full max-w-xs rounded-xl shadow-lg"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="min-h-12 rounded-xl bg-ink/5 font-bold text-ink"
            >
              {t('common.back')}
            </button>
            <button
              type="button"
              onClick={() =>
                void shareOrDownload(
                  dataUrlToFile(open.image, `pocketpals-${open.petName}-${open.t}.jpg`),
                )
              }
              className="min-h-12 rounded-xl bg-candy-pink font-black text-white"
            >
              📤 {t('photo.share')}
            </button>
          </div>
        </div>
      ) : photos === null ? null : photos.length === 0 ? (
        <p className="py-8 text-center font-semibold text-ink/60">{t('album.empty')}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 pb-2">
          {photos.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => setOpen(p)} className="w-full text-left">
                <img src={p.image} alt="" className="w-full rounded-xl shadow" loading="lazy" />
                <span className="mt-1 block text-xs font-black text-ink">{caption(p)}</span>
                <span className="block text-[11px] text-ink/50">{date.format(p.t)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="pb-4 text-xs text-ink/50">{t('album.note')}</p>
    </Sheet>
  );
}
