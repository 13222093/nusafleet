// The two main controls as one slim bar that floats over the top of the map:
// supply scenario (with a play button) on the left, fleet priority on the right.
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { Atom, Pause, Play, Plug, Sun, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { num, t } from '../i18n';
import type { StringKey } from '../i18n';
import type { Lang, ParetoPoint, ScenarioResult } from '../types';

const MINT = '#7fe3d2';
const INK = '#06252b';
const SOFT = 'rgba(255,255,255,0.78)';

// Icon and one short name per scenario, used everywhere outside the Data page
const SCENARIO_LOOK: Record<string, { icon: LucideIcon; short: StringKey }> = {
  A_grid: { icon: Plug, short: 'shortGrid' },
  B_grid_solar: { icon: Sun, short: 'shortSolar' },
  C_floating_nuclear: { icon: Atom, short: 'shortFloating' },
};

export function scenarioShort(id: string, lang: Lang, fallback: string): string {
  const look = SCENARIO_LOOK[id];
  return look ? t(lang, look.short) : fallback;
}

const glass = {
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
  p: '4px',
  borderRadius: '999px',
  bgcolor: 'rgba(6,37,43,0.9)',
  border: '1px solid rgba(127,227,210,0.4)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
} as const;

const focusRing = { '&.Mui-focusVisible': { outline: '2px solid #ffffff', outlineOffset: 2 } } as const;

interface ScenarioProps {
  lang: Lang;
  ids: string[];
  results: Record<string, ScenarioResult>;
  activeId: string;
  onSelect: (id: string) => void;
  /** Charging stations in each scenario at the current priority. */
  stationCount: (id: string) => number;
  playing: boolean;
  onPlay: () => void;
}

export function ScenarioPills({ lang, ids, results, activeId, onSelect, stationCount, playing, onPlay }: ScenarioProps) {
  return (
    <Box sx={glass} role="radiogroup" aria-label={t(lang, 'ctlSupply')}>
      <ButtonBase
        onClick={onPlay}
        aria-pressed={playing}
        aria-label={t(lang, playing ? 'pause' : 'play')}
        title={t(lang, playing ? 'pause' : 'play')}
        sx={{ width: 34, height: 34, borderRadius: '50%', color: playing ? INK : MINT, bgcolor: playing ? MINT : 'rgba(127,227,210,0.14)', flexShrink: 0, ...focusRing }}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </ButtonBase>
      {ids.map((id) => {
        const active = id === activeId;
        const s = results[id].scenario;
        const Icon = SCENARIO_LOOK[id]?.icon ?? Plug;
        const full = lang === 'id' ? s.label_id : s.label_en;
        const stations = stationCount(id);
        return (
          <ButtonBase
            key={id}
            role="radio"
            aria-checked={active}
            aria-label={`${s.available_from_year}, ${full}, ${stations} ${t(lang, 'stations')}`}
            title={`${full} (${num(lang, stations)} ${t(lang, 'stations')})`}
            onClick={() => onSelect(id)}
            sx={{ height: 34, pl: 1.1, pr: 1.25, gap: 0.75, borderRadius: '999px', fontFamily: 'inherit', whiteSpace: 'nowrap', color: active ? INK : SOFT, bgcolor: active ? MINT : 'transparent', transition: 'background-color 0.25s', '&:hover': { color: active ? INK : '#ffffff' }, ...focusRing }}
          >
            <Icon size={16} />
            <Box component="span" sx={{ fontSize: '0.92rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.available_from_year}</Box>
            <Box component="span" sx={{ fontSize: '0.8rem', fontWeight: 600, display: { xs: 'none', xl: active ? 'inline' : 'none', lg: active ? 'inline' : 'none' } }}>{scenarioShort(id, lang, full)}</Box>
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: active ? INK : stations > 0 ? '#ffd27a' : 'rgba(255,255,255,0.5)' }}>
              <Zap size={12} />
              {num(lang, stations)}
            </Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
}

interface PriorityProps {
  lang: Lang;
  points: ParetoPoint[];
  index: number;
  onSelect: (index: number) => void;
}

/** Three named stops only (cheapest, balanced, cleanest), whatever the frontier length. */
export function PrioritySeg({ lang, points, index, onSelect }: PriorityProps) {
  const named = points.map((p, i) => ({ p, i })).filter(({ p }) => p.label !== null);
  // If an unnamed frontier point is selected (from the chart), highlight the nearest named stop
  let nearest = 0;
  named.forEach(({ i }, k) => {
    if (Math.abs(i - index) < Math.abs(named[nearest].i - index)) nearest = k;
  });

  return (
    <Box sx={glass} role="radiogroup" aria-label={t(lang, 'ctlPriority')}>
      {named.map(({ p, i }, k) => {
        const active = k === nearest;
        return (
          <ButtonBase
            key={i}
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(i)}
            sx={{ height: 34, px: 1.5, borderRadius: '999px', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', color: active ? INK : SOFT, bgcolor: active ? MINT : 'transparent', transition: 'background-color 0.25s', '&:hover': { color: active ? INK : '#ffffff' }, ...focusRing }}
          >
            {t(lang, p.label === 'least_cost' ? 'cheapest' : p.label === 'lowest_co2' ? 'cleanest' : 'balanced')}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
