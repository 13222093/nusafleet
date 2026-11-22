// "What if prices change?" Three sliders that re-solve the model through the
// API and replace the plan shown on the map and in the headline numbers.
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import { num, t } from '../i18n';
import type { StringKey } from '../i18n';
import type { LiveState, Overrides } from '../live';
import type { Lang } from '../types';

interface Knob {
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
  apiOnline: boolean | null;
}

export type { Knob };

export function WhatIfPanel({ lang, knobs, overrides, onChange, state, message, apiOnline }: Props) {
  const active = Object.values(overrides).some((v) => v !== undefined);
  const offline = apiOnline === false;

  const status =
    state === 'loading' ? (
      <Chip size="small" icon={<CircularProgress size={12} />} label={t(lang, 'wiLoading')} />
    ) : state === 'ready' ? (
      <Chip size="small" color="primary" label={t(lang, 'wiLive')} />
    ) : null;

  return (
    <Card elevation={2} sx={{ mb: 4 }}>
      <CardHeader
        title={t(lang, 'whatIfTitle')}
        subheader={t(lang, 'whatIfSub')}
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        subheaderTypographyProps={{ variant: 'body2' }}
        action={
          <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 1, pr: 1 }}>
            {status}
            <Button size="small" variant="outlined" startIcon={<RestartAltIcon />} disabled={!active} onClick={() => onChange({})}>
              {t(lang, 'wiReset')}
            </Button>
          </Stack>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {offline ? (
          <Alert severity="warning" variant="outlined" sx={{ mb: 2, borderRadius: 3, bgcolor: 'background.paper' }}>
            {t(lang, 'wiOffline')} <code>uv run uvicorn api.main:app --port 8000</code>
          </Alert>
        ) : null}
        {state === 'error' && message ? (
          <Alert severity="error" variant="outlined" sx={{ mb: 2, borderRadius: 3, bgcolor: 'background.paper' }}>
            {message}
          </Alert>
        ) : null}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: { xs: 3, md: 5 } }}>
          {knobs.map((knob) => {
            const value = overrides[knob.key] ?? knob.fallback;
            const changed = overrides[knob.key] !== undefined;
            return (
              <Box key={knob.key}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{t(lang, knob.label)}</Typography>
                  <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: changed ? 'primary.dark' : 'text.primary', whiteSpace: 'nowrap' }}>
                    Rp {num(lang, value)}
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>{knob.unit}</Typography>
                  </Typography>
                </Stack>
                <Slider
                  aria-label={t(lang, knob.label)}
                  value={value}
                  min={knob.min}
                  max={knob.max}
                  step={knob.step}
                  disabled={offline}
                  marks={[{ value: knob.fallback }]}
                  onChange={(_e, v) => onChange({ ...overrides, [knob.key]: v as number })}
                  getAriaValueText={(v: number) => `Rp ${num(lang, v)} ${knob.unit}`}
                  sx={{
                    height: 6,
                    '& .MuiSlider-thumb': { width: 22, height: 22, bgcolor: '#ffffff', border: '4px solid #00695c' },
                    '& .MuiSlider-mark': { width: 3, height: 14, bgcolor: '#004d40', opacity: 1 },
                  }}
                />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{num(lang, knob.min)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t(lang, 'wiDefault')}: {num(lang, knob.fallback)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{num(lang, knob.max)}</Typography>
                </Stack>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
