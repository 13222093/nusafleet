// "What if prices change?" Three sliders that re-solve the model through the
// API and replace the plan shown on the map and in the headline numbers.
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { RotateCcw } from 'lucide-react';

import { num, t } from '../i18n';
import type { StringKey } from '../i18n';
import type { LiveState, Overrides } from '../live';
import type { Lang } from '../types';

export interface Knob {
  key: keyof Overrides;
  label: StringKey;
  unit: string;
  min: number;
  max: number;
  step: number;
  fallback: number;
}

interface Props {
  lang: Lang;
  knobs: Knob[];
  overrides: Overrides;
  onChange: (next: Overrides) => void;
  state: LiveState;
  message: string | null;
}

export function WhatIfPanel({ lang, knobs, overrides, onChange, state, message }: Props) {
  const active = Object.values(overrides).some((v) => v !== undefined);

  return (
    <Card>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2.5, minHeight: 32 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{t(lang, 'whatIfTitle')}</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{t(lang, 'whatIfShort')}</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            {state === 'loading' ? <Chip size="small" icon={<CircularProgress size={12} />} label={t(lang, 'wiLoading')} /> : null}
            {state === 'ready' ? <Chip size="small" color="primary" label={t(lang, 'wiLive')} /> : null}
            {active ? (
              <Button size="small" variant="outlined" startIcon={<RotateCcw size={14} />} onClick={() => onChange({})} sx={{ borderRadius: '999px' }}>
                {t(lang, 'wiReset')}
              </Button>
            ) : null}
          </Stack>
        </Stack>

        {state === 'error' && message ? (
          <Alert severity="error" variant="outlined" sx={{ mb: 2, borderRadius: '12px' }}>
            {message}
          </Alert>
        ) : null}

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.5 }}>
          {knobs.map((knob) => {
            const value = overrides[knob.key] ?? knob.fallback;
            const changed = overrides[knob.key] !== undefined;
            return (
              <Box key={knob.key}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>{t(lang, knob.label)}</Typography>
                  <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: changed ? 'primary.dark' : 'text.primary', whiteSpace: 'nowrap' }}>
                    Rp {num(lang, value)}
                    <Typography component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', ml: 0.5 }}>{knob.unit}</Typography>
                  </Typography>
                </Stack>
                <Slider
                  aria-label={t(lang, knob.label)}
                  value={value}
                  min={knob.min}
                  max={knob.max}
                  step={knob.step}
                  marks={[{ value: knob.fallback }]}
                  onChange={(_e, v) => onChange({ ...overrides, [knob.key]: v as number })}
                  getAriaValueText={(v: number) => `Rp ${num(lang, v)} ${knob.unit}`}
                  sx={{
                    height: 6,
                    '& .MuiSlider-thumb': { width: 22, height: 22, bgcolor: '#ffffff', border: '4px solid #00695c' },
                    '& .MuiSlider-mark': { width: 3, height: 14, bgcolor: '#0c2a2e', opacity: 1 },
                  }}
                />
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{num(lang, knob.min)}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{num(lang, knob.max)}</Typography>
                </Stack>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
