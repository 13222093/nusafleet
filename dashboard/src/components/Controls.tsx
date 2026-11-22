// The two main controls, drawn on the dark console above the map: a timeline
// of power-supply scenarios (with a play button) and a three-stop priority slider.
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Atom, Pause, Play, Plug, Sun, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { num, t } from '../i18n';
import type { StringKey } from '../i18n';
import type { Lang, ParetoPoint, ScenarioResult } from '../types';

const MINT = '#7fe3d2';
const INK = '#06252b';
const SOFT = 'rgba(255,255,255,0.75)';

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

function Label({ children }: { children: string }) {
  return <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: SOFT, lineHeight: 1 }}>{children}</Typography>;
}

interface TimelineProps {
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

const STOP = 44;

export function ScenarioTimeline({ lang, ids, results, activeId, onSelect, stationCount, playing, onPlay }: TimelineProps) {
  const activeIndex = ids.indexOf(activeId);
  const edge = 50 / ids.length;

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, height: 28 }}>
        <Label>{t(lang, 'ctlSupply')}</Label>
        <ButtonBase
          onClick={onPlay}
          aria-pressed={playing}
          sx={{ height: 28, px: 1.25, gap: 0.75, borderRadius: '999px', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 700, color: playing ? INK : MINT, bgcolor: playing ? MINT : 'transparent', border: `1.5px solid ${MINT}`, '&:hover': { bgcolor: playing ? MINT : 'rgba(127,227,210,0.12)' }, '&.Mui-focusVisible': { outline: `2px solid ${MINT}`, outlineOffset: 2 } }}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {t(lang, playing ? 'pause' : 'play')}
        </ButtonBase>
      </Stack>
      <Box sx={{ position: 'relative', display: 'grid', gridTemplateColumns: `repeat(${ids.length}, 1fr)`, alignItems: 'start' }} role="radiogroup" aria-label={t(lang, 'ctlSupply')}>
        <Box sx={{ position: 'absolute', top: STOP / 2 - 1.5, left: `${edge}%`, right: `${edge}%`, height: 3, bgcolor: 'rgba(255,255,255,0.25)' }} />
        <Box sx={{ position: 'absolute', top: STOP / 2 - 1.5, left: `${edge}%`, width: `${(activeIndex / Math.max(ids.length - 1, 1)) * (100 - 2 * edge)}%`, height: 3, bgcolor: MINT, transition: 'width 0.4s ease' }} />
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
              aria-label={`${s.available_from_year}, ${full}`}
              title={full}
              onClick={() => onSelect(id)}
              sx={{ position: 'relative', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', fontFamily: 'inherit', borderRadius: '12px', pb: 0.5, '&:hover .stop': { borderColor: MINT }, '&.Mui-focusVisible .stop': { outline: `3px solid ${MINT}`, outlineOffset: 3 } }}
            >
              <Box className="stop" sx={{ width: STOP, height: STOP, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: active ? MINT : INK, color: active ? INK : '#ffffff', border: '2px solid', borderColor: active ? MINT : '#ffffff', transition: 'background-color 0.25s, border-color 0.2s' }}>
                <Icon size={20} />
              </Box>
              <Typography sx={{ mt: 0.75, fontSize: '1.2rem', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: '#ffffff' }}>
                {s.available_from_year}
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: '0.78rem', lineHeight: 1.15, textAlign: 'center', fontWeight: 600, color: active ? MINT : SOFT }}>
                {scenarioShort(id, lang, full)}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.4} sx={{ mt: 0.5, color: stations > 0 ? '#ffd27a' : 'rgba(255,255,255,0.55)' }}>
                <Zap size={12} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {num(lang, stations)} {t(lang, 'stations')}
                </Typography>
              </Stack>
            </ButtonBase>
          );
        })}
      </Box>
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
export function PrioritySlider({ lang, points, index, onSelect }: PriorityProps) {
  const named = points.map((p, i) => ({ p, i })).filter(({ p }) => p.label !== null);
  // If an unnamed frontier point is selected (from the chart), show the nearest named stop
  let position = 0;
  named.forEach(({ i }, k) => {
    if (Math.abs(i - index) < Math.abs(named[position].i - index)) position = k;
  });
  const marks = named.map(({ p }, k) => ({ value: k, label: t(lang, p.label === 'least_cost' ? 'cheapest' : p.label === 'lowest_co2' ? 'cleanest' : 'balanced') }));

  return (
    <Box>
      <Box sx={{ mb: 1.5, height: 28, display: 'flex', alignItems: 'center' }}>
        <Label>{t(lang, 'ctlPriority')}</Label>
      </Box>
      <Box sx={{ px: 4, height: STOP, display: 'flex', alignItems: 'center' }}>
        <Slider
          aria-label={t(lang, 'ctlPriority')}
          value={position}
          min={0}
          max={Math.max(named.length - 1, 1)}
          step={1}
          marks={marks}
          disabled={named.length < 2}
          onChange={(_e, value) => onSelect(named[value as number].i)}
          getAriaValueText={(k: number) => marks[k]?.label ?? ''}
          sx={{
            height: 8,
            mb: 0,
            '& .MuiSlider-rail': { opacity: 1, background: 'linear-gradient(90deg, #ffd27a 0%, #7fe3d2 100%)' },
            '& .MuiSlider-track': { border: 'none', background: 'transparent' },
            '& .MuiSlider-thumb': { width: 24, height: 24, bgcolor: '#ffffff', border: `5px solid ${INK}`, boxShadow: '0 0 0 2px #ffffff', '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 2px #ffffff, 0 0 0 9px rgba(127,227,210,0.3)' } },
            '& .MuiSlider-mark': { width: 6, height: 6, borderRadius: '50%', bgcolor: INK, opacity: 0.6 },
            '& .MuiSlider-markLabel': { top: 34, fontSize: '0.8rem', fontWeight: 600, color: SOFT, fontFamily: 'inherit' },
            '& .MuiSlider-markLabelActive': { color: '#ffffff' },
          }}
        />
      </Box>
    </Box>
  );
}
