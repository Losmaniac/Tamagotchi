import { useState } from 'react';
import { SPECIES, type Species } from '../../game/types';
import { IUCN, WILD, type IucnStatus, type Region } from '../../game/wild';
import { SPECIES_ICON } from '../icons';
import { Card } from './shared';
import { useLearn } from './useLearn';
import { formatYears } from './units';

const STATUS_COLOR: Record<IucnStatus, string> = {
  LC: '#3ddc97',
  NT: '#b5e655',
  VU: '#ffd23f',
  EN: '#ff8c42',
  CR: '#e5484d',
};

// Rough continent blobs on a 200×100 map (decorative; region names are listed as text).
const REGION_SHAPES: Record<Exclude<Region, 'sea'>, string> = {
  na: 'M18 18 L62 12 L70 26 L56 44 L44 50 L34 42 L22 34 Z',
  sa: 'M52 54 L66 56 L72 66 L64 86 L58 94 L54 80 L50 64 Z',
  eu: 'M92 18 L112 14 L118 24 L106 32 L94 30 Z',
  af: 'M94 38 L116 36 L124 50 L118 70 L108 80 L100 64 L92 50 Z',
  as: 'M118 14 L170 12 L184 26 L170 44 L150 50 L132 44 L120 30 Z',
  oc: 'M158 66 L182 64 L188 76 L176 84 L160 80 Z',
  an: 'M40 96 L160 96 L150 100 L50 100 Z',
};

function WorldMap({ regions }: { regions: Region[] }) {
  const sea = regions.includes('sea');
  return (
    <svg viewBox="0 0 200 100" className="h-28 w-full" aria-hidden="true">
      <rect width="200" height="100" rx="10" fill={sea ? '#7dd3fc' : '#e0f2fe'} />
      {(Object.keys(REGION_SHAPES) as Exclude<Region, 'sea'>[]).map((r) => (
        <path
          key={r}
          d={REGION_SHAPES[r]}
          fill={regions.includes(r) ? '#d12f7a' : '#cbd5e1'}
          stroke="#fff"
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}

function StatusScale({ status }: { status: IucnStatus }) {
  return (
    <div className="flex gap-1" aria-hidden="true">
      {IUCN.map((s) => (
        <span
          key={s}
          className={`flex h-7 flex-1 items-center justify-center rounded-md text-[11px] font-black ${s === status ? 'text-ink ring-2 ring-ink' : 'text-ink/40'}`}
          style={{ background: s === status ? STATUS_COLOR[s] : `${STATUS_COLOR[s]}55` }}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

/** Wild cousins: the real animal behind each pal — range, diet, lifespan and Red List status. */
export function WildView({ initial }: { initial: Species }) {
  const { L, locale } = useLearn();
  const [species, setSpecies] = useState<Species>(initial);
  const w = WILD[species];
  const W = L.wild;
  return (
    <div className="space-y-3 pb-3">
      <p className="text-sm text-ink/70">{W.intro}</p>
      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1" role="tablist">
        {SPECIES.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={s === species}
            aria-label={W.realName[s]}
            onClick={() => setSpecies(s)}
            className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl ${s === species ? 'bg-candy-pink/20 ring-2 ring-candy-pink' : 'bg-ink/5'}`}
          >
            {SPECIES_ICON[s]}
          </button>
        ))}
      </div>
      <Card tint="bg-sky-50">
        <h3 className="text-xl font-black text-ink">{W.realName[species]}</h3>
        <p className="text-sm text-ink/60 italic">{w.latin}</p>
        <p className="mt-1 text-sm font-semibold text-ink">{W.relation[species]}</p>
      </Card>
      <Card tint="bg-amber-50">
        <p className="text-sm font-black text-ink">
          {W.labels.status}: {W.status[w.status]} ({w.status})
        </p>
        <div className="mt-2">
          <StatusScale status={w.status} />
        </div>
        <p className="mt-2 text-sm text-ink">
          <span className="font-bold">{W.labels.why}:</span> {W.threat[species]}
        </p>
        <p className="mt-1 text-xs text-ink/50">{W.iucnNote}</p>
      </Card>
      <Card tint="bg-emerald-50">
        <p className="text-sm font-black text-ink">{W.labels.where}</p>
        <WorldMap regions={w.regions} />
        <p className="text-sm text-ink">{w.regions.map((r) => W.region[r]).join(', ')}</p>
      </Card>
      <Card tint="bg-pink-50">
        <p className="text-sm text-ink">
          <span className="font-black">{W.labels.diet}:</span> {W.diet[species]}
        </p>
        <p className="mt-1 text-sm text-ink">
          <span className="font-black">
            {w.domestic ? W.labels.lifespanPet : W.labels.lifespan}:
          </span>{' '}
          {W.about.replace('{value}', formatYears(locale, w.lifespan[0], w.lifespan[1]))}
        </p>
      </Card>
    </div>
  );
}
