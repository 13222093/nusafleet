// The two main controls: a timeline of power-supply scenarios and a slider
// that walks along the cost vs CO2 frontier.
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { num, rpBn, t } from '../i18n';
import type { Lang, ParetoPoint, ScenarioResult } from '../types';

interface TimelineProps {
  lang: Lang;
  ids: string[];
  results: Record<string, ScenarioResult>;
  activeId: string;
  onSelect: (id: string) => void;
}

export function ScenarioTimeline({ lang, ids, results, activeId, onSelect }: TimelineProps) {
  return (
    <Box sx={{ flex: '1 1 420px', minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {t(lang, 'scenario')}
      </Typography>
      <Box sx={{ position: 'relative', display: 'grid', gridTemplateColumns: `repeat(${ids.length}, 1fr)` }} role="radiogroup" aria-label={t(lang, 'scenario')}>
        {/* The line the three stops sit on */}
        <Box sx={{ position: 'absolute', top: 13, left: `${50 / ids.length}%`, right: `${50 / ids.length}%`, height: 4, borderRadius: 2, bgcolor: '#b2dfdb' }} />
        {ids.map((id) => {
          const active = id === activeId;
          const s = results[id].scenario;
          return (
            <ButtonBase
              key={id}
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(id)}
              sx={{ position: 'relative', flexDirection: 'column', alignItems: 'center', px: 1, pb: 1, borderRadius: 3, '&:hover .stop': { transform: 'scale(1.15)' }, '&.Mui-focusVisible': { outline: '2px solid #009688', outlineOffset: 2 } }}
            >
              <Box
                className="stop"
                sx={{ width: 30, height: 30, borderRadius: '50%', border: '4px solid', borderColor: active ? 'primary.main' : '#80cbc4', bgcolor: active ? 'primary.main' : 'background.paper', boxShadow: active ? '0 0 0 6px rgba(0,150,136,0.18)' : 'none', transition: 'transform 0.15s, box-shadow 0.2s' }}
              />
              <Typography sx={{ mt: 0.75, fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: active ? 'primary.dark' : 'text.secondary' }}>
                {s.available_from_year}
              </Typography>
              <Typography variant="caption" sx={{ lineHeight: 1.25, textAlign: 'center', fontWeight: active ? 700 : 500, color: active ? 'text.primary' : 'text.secondary', maxWidth: 220 }}>
                {lang === 'id' ? s.label_id : s.label_en}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}

interface AmbitionProps {
  lang: Lang;
  points: ParetoPoint[];
  index: number;
  onSelect: (index: number) => void;
}

export function AmbitionSlider({ lang, points, index, onSelect }: AmbitionProps) {
  const describe = (i: number) => `${rpBn(lang, points[i].cost_rp)}, ${num(lang, points[i].co2_t)} t CO2`;
  const single = points.length < 2;

  return (
    <Box sx={{ flex: '1 1 340px', minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {t(lang, 'ambition')}
      </Typography>
      <Box sx={{ px: 1.5 }}>
        <Slider
          aria-label={t(lang, 'ambition')}
          value={index}
          min={0}
          max={Math.max(points.length - 1, 1)}
          step={1}
          marks
          disabled={single}
          onChange={(_e, value) => onSelect(value as number)}
          valueLabelDisplay="auto"
          valueLabelFormat={(i: number) => describe(Math.min(i, points.length - 1))}
          getAriaValueText={(i: number) => describe(Math.min(i, points.length - 1))}
          sx={{
            height: 8,
            py: 1.5,
            '& .MuiSlider-rail': { opacity: 1, background: 'linear-gradient(90deg, #b2dfdb, #009688)' },
            '& .MuiSlider-track': { border: 'none', background: 'transparent' },
            '& .MuiSlider-thumb': { width: 26, height: 26, bgcolor: '#ffffff', border: '5px solid #00695c', '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 8px rgba(0,150,136,0.18)' } },
            '& .MuiSlider-mark': { width: 6, height: 6, borderRadius: '50%', bgcolor: '#ffffff', opacity: 0.9 },
            '& .MuiSlider-valueLabel': { borderRadius: 2, bgcolor: '#004d40', fontWeight: 600 },
          }}
        />
      </Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>{t(lang, 'least_cost')}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>
          {describe(Math.min(index, points.length - 1))}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>{t(lang, 'lowest_co2')}</Typography>
      </Stack>
    </Box>
  );
}
