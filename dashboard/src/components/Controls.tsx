// The two main controls over the model: the supply timeline (with a play
// button) on the left, fleet priority on the right. Drawn as a ruler and a
// segmented text switch on white, not as glowing pills.
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { Pause, Play } from 'lucide-react';

import { MONO, UI } from '../colors';
import { COOP_EVENTS } from '../cooperation';
import { num, t } from '../i18n';
import type { StringKey } from '../i18n';
import type { Lang, ParetoPoint, ScenarioResult } from '../types';

const SCENARIO_SHORT: Record<string, StringKey> = {
  A_grid: 'shortGrid',
  B_grid_solar: 'shortSolar',
  C_floating_nuclear: 'shortFloating',
};

export function scenarioShort(id: string, lang: Lang, fallback: string): string {
  const key = SCENARIO_SHORT[id];
  return key ? t(lang, key) : fallback;
}

const sheet = {
  display: 'flex',
  alignItems: 'stretch',
  bgcolor: UI.surface,
  border: `1px solid ${UI.line}`,
  borderRadius: '3px',
  boxShadow: '0 1px 2px rgba(15,20,23,0.05)',
} as const;

/** Names the axis a control sets: the model has two, supply and priority. */
const axisLabel = {
  display: { xs: 'none', lg: 'flex' },
  alignItems: 'center',
  px: 1.25,
  maxWidth: 74,
  fontSize: '0.68rem',
  fontStyle: 'italic',
  lineHeight: 1.15,
  color: UI.muted,
  borderRight: `1px solid ${UI.line}`,
} as const;

const focusRing = { '&.Mui-focusVisible': { outline: `2px solid ${UI.accent}`, outlineOffset: -2 } } as const;

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
    <Box sx={sheet} role="radiogroup" aria-label={t(lang, 'ctlSupply')}>
      <Box component="span" aria-hidden="true" sx={axisLabel}>{t(lang, 'ctlSupply')}</Box>
      <ButtonBase
        onClick={onPlay}
        aria-pressed={playing}
        aria-label={t(lang, playing ? 'pause' : 'play')}
        title={t(lang, playing ? 'pause' : 'play')}
        sx={{ width: 44, flexShrink: 0, color: playing ? '#ffffff' : UI.ink, bgcolor: playing ? UI.ink : 'transparent', borderRight: `1px solid ${UI.line}`, borderRadius: { xs: '2px 0 0 2px', lg: 0 }, ...focusRing }}
      >
        {playing ? <Pause size={15} strokeWidth={1.75} /> : <Play size={15} strokeWidth={1.75} />}
      </ButtonBase>
      {ids.map((id, i) => {
        const active = id === activeId;
        const s = results[id].scenario;
        const full = lang === 'id' ? s.label_id : s.label_en;
        const stations = stationCount(id);
        return (
          <ButtonBase
            key={id}
            role="radio"
            aria-checked={active}
            aria-label={`${s.available_from_year}, ${full}, ${stations} ${t(lang, 'stations')}`}
            title={full}
            onClick={() => onSelect(id)}
            sx={{ position: 'relative', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', px: 1.5, py: 0.75, minWidth: { xs: 64, md: 108 }, borderLeft: i > 0 ? `1px solid ${UI.line}` : 'none', fontFamily: 'inherit', textAlign: 'left', transition: 'background-color 120ms', bgcolor: active ? UI.bg : 'transparent', '&:hover': { bgcolor: UI.bg }, ...focusRing }}
          >
            <Box component="span" sx={{ fontSize: '0.95rem', fontWeight: active ? 500 : 400, color: active ? UI.ink : UI.muted, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{s.available_from_year}</Box>
            <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, fontSize: '0.7rem', color: UI.muted, lineHeight: 1.3, whiteSpace: 'nowrap' }}>
              {scenarioShort(id, lang, full)}
              {stations > 0 ? <Box component="span" sx={{ ml: 0.75, fontFamily: MONO, color: UI.accent }}>{num(lang, stations)} {t(lang, 'stations')}</Box> : null}
            </Box>
            {active ? <Box aria-hidden="true" sx={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, bgcolor: UI.ink }} /> : null}
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
    <Box sx={{ ...sheet, p: '3px', gap: '2px' }} role="radiogroup" aria-label={t(lang, 'ctlPriority')}>
      <Box component="span" aria-hidden="true" sx={{ ...axisLabel, borderRight: 'none', pl: 1, pr: 0.5 }}>{t(lang, 'ctlPriority')}</Box>
      {named.map(({ p, i }, k) => {
        const active = k === nearest;
        return (
          <ButtonBase
            key={i}
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(i)}
            sx={{ height: 34, px: 1.5, borderRadius: '5px', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: active ? 500 : 400, whiteSpace: 'nowrap', color: active ? '#ffffff' : UI.muted, bgcolor: active ? UI.ink : 'transparent', transition: 'background-color 160ms, color 160ms', '&:hover': { color: active ? '#ffffff' : UI.ink }, ...focusRing }}
          >
            {t(lang, p.label === 'least_cost' ? 'cheapest' : p.label === 'lowest_co2' ? 'cleanest' : 'balanced')}
          </ButtonBase>
        );
      })}
    </Box>
  );
}

/** Dated cooperation milestones as a plain caption line; those reached by the selected year are in ink. */
export function CoopStrip({ lang, year }: { lang: Lang; year: number }) {
  return (
    <Box
      role="list"
      aria-label={t(lang, 'coopStrip')}
      sx={{ display: { xs: 'none', sm: 'flex' }, flexWrap: 'wrap', alignItems: 'center', columnGap: 1.5, rowGap: 0.25, flexBasis: '100%', fontSize: '0.7rem', lineHeight: 1.4 }}
    >
      {COOP_EVENTS.map((e) => {
        const reached = e.year <= year;
        return (
          <Box key={e.when.en} role="listitem" title={e.text[lang]} sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.6, whiteSpace: 'nowrap', color: reached ? UI.ink : UI.faint, transition: 'color 400ms' }}>
            <Box component="span" sx={{ width: 6, height: 6, alignSelf: 'center', borderRadius: '50%', bgcolor: reached ? UI.ink : 'transparent', border: `1px solid ${reached ? UI.ink : UI.faint}` }} />
            <Box component="span" sx={{ fontFamily: MONO, fontSize: '0.66rem' }}>{e.when[lang]}</Box>
            <Box component="span">{e.short[lang]}</Box>
          </Box>
        );
      })}
    </Box>
  );
}
