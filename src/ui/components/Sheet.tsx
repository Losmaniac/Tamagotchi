import { useEffect, useRef, type ReactNode } from 'react';
import { useT } from '../../i18n/useT';

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Full-height panel instead of a bottom sheet. */
  full?: boolean;
  /** Keep the top ~40 % of the screen visible (e.g. to preview cosmetics). */
  half?: boolean;
}

/** Accessible modal bottom sheet (Escape and backdrop close it, focus moves inside). */
export function Sheet({ title, onClose, children, full = false, half = false }: SheetProps) {
  const { t } = useT();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="presentation">
      <div
        className={`anim-fade absolute inset-0 ${half ? 'bg-transparent' : 'bg-ink/40'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`anim-sheet relative flex w-full max-w-md flex-col rounded-t-[2rem] bg-white shadow-2xl outline-none ${
          full ? 'h-[92%]' : half ? 'h-[58%]' : 'max-h-[85%]'
        }`}
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-xl font-black text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-12 items-center justify-center rounded-full bg-ink/5 text-2xl font-bold text-ink/70 active:scale-95"
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-2">{children}</div>
      </div>
    </div>
  );
}
