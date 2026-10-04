interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 py-2">
      <span>
        <span className="block font-bold text-ink">{label}</span>
        {description && <span className="block text-sm text-ink/60">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${checked ? 'bg-candy-pink' : 'bg-ink/20'}`}
      >
        <span
          className={`absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : ''
          }`}
        />
        <span className="sr-only">{label}</span>
      </button>
    </label>
  );
}
