// The three numbers a viewer should remember, set large and light: the change
// against today's fleet in rupiah, tonnes of CO2 and trips not cancelled.
import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { UI } from '../colors';
import { num, rpBn, t } from '../i18n';
import type { Kpis, Lang, ParetoPoint } from '../types';
import { EstimateChip } from './KPICard';

/** Eases a displayed number from its previous value to the new one. */
function useCountUp(target: number, ms = 700): number {
  const [shown, setShown] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.current = target;
      setShown(target);
      return undefined;
    }
    const from = current.current;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / ms));
      const value = from + (target - from) * (1 - (1 - p) ** 3);
      current.current = value;
      setShown(value);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, ms]);
  return shown;
}

// The direction of each change is said in words, so the number never needs a sign
const SAY = {
  cheaper: { id: 'lebih hemat per tahun', en: 'cheaper per year' },
  dearer: { id: 'lebih mahal per tahun', en: 'more expensive per year' },
  lessCo2: { id: 'lebih sedikit per tahun', en: 'less per year' },
  moreCo2: { id: 'lebih banyak per tahun', en: 'more per year' },
  fewerCancel: { id: 'lebih sedikit yang batal per tahun', en: 'fewer cancelled per year' },
  moreCancel: { id: 'lebih banyak yang batal per tahun', en: 'more cancelled per year' },
} as const;
const say = (lang: Lang, key: keyof typeof SAY) => SAY[key][lang];

interface Props {
  lang: Lang;
  plan: ParetoPoint;
  base: Kpis;
  /** e.g. "Seimbang, 2031 Pembangkit terapung" */
  caption: string;
}

function Figure({ value, unit, label, better }: { value: string; unit?: string; label: string; better: boolean }) {
  return (
    <Box sx={{ minWidth: 0, py: 1.25, borderTop: `1px solid ${UI.line}` }}>
      <Typography component="div" sx={{ fontSize: { xs: '2.5rem', xl: '3rem' }, fontWeight: 500, fontStretch: '72%', lineHeight: 0.95, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: better ? UI.ink : UI.worse, whiteSpace: 'nowrap' }}>
        {value}
        {unit ? (
          <Typography component="span" sx={{ fontSize: '0.42em', fontWeight: 400, ml: 0.75, color: UI.muted, letterSpacing: 0 }}>
            {unit}
          </Typography>
        ) : null}
      </Typography>
      <Typography sx={{ mt: 0.75, fontSize: '0.8rem', color: UI.muted, lineHeight: 1.35 }}>{label}</Typography>
    </Box>
  );
}

export function KpiBand({ lang, plan, base, caption }: Props) {
  const costDelta = plan.cost_rp - base.annual_cost_rp;
  const co2Delta = plan.co2_t - base.co2_t;
  const co2Pct = (100 * co2Delta) / base.co2_t;
  const tripsAvoided = ((plan.reliability_pct - base.reliability_pct) / 100) * base.scheduled_trips_per_year;

  const costShown = useCountUp(costDelta);
  const co2Shown = useCountUp(co2Delta);
  const tripsShown = useCountUp(tripsAvoided);

  const facts: [string, string][] = [
    [t(lang, 'totalCost'), rpBn(lang, plan.cost_rp)],
    [t(lang, 'kpiCapex'), rpBn(lang, plan.capex_rp, 0)],
    [t(lang, 'kpiReliability'), `${num(lang, plan.reliability_pct, 1)}%`],
    [t(lang, 'stationsShort'), plan.chargers.length ? plan.chargers.map((c) => c.port_name.split(' (')[0]).join(', ') : t(lang, 'none')],
  ];

  return (
    <Box sx={{ px: 0.25, pt: 1.25, pb: 1, borderTop: `3px solid ${UI.ink}`, flexShrink: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: '0.78rem', color: UI.muted }}>{t(lang, 'kpiVs')}</Typography>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, fontStretch: '88%', color: UI.ink }}>{caption}</Typography>
        </Box>
        <EstimateChip label={t(lang, 'estimate')} hint={t(lang, 'estimateHint')} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr' }}>
        <Figure value={rpBn(lang, Math.abs(costShown))} label={say(lang, costDelta <= 0 ? 'cheaper' : 'dearer')} better={costDelta <= 0} />
        <Figure value={num(lang, Math.abs(co2Shown))} unit="t CO₂" label={`${say(lang, co2Delta <= 0 ? 'lessCo2' : 'moreCo2')} (${num(lang, Math.abs(co2Pct))}%)`} better={co2Delta <= 0} />
        <Figure value={num(lang, Math.abs(tripsShown))} unit={lang === 'id' ? 'trip' : 'trips'} label={say(lang, tripsAvoided >= 0 ? 'fewerCancel' : 'moreCancel')} better={tripsAvoided >= 0} />
      </Box>

      <Box sx={{ pt: 1.5, borderTop: `1px solid ${UI.line}`, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 2, rowGap: 1.25 }}>
        {facts.map(([label, value]) => (
          <Typography key={label} sx={{ fontSize: '0.72rem', color: UI.muted, lineHeight: 1.35 }}>
            {label}
            <Box component="span" sx={{ display: 'block', mt: 0.25, fontSize: '0.88rem', color: UI.ink, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</Box>
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
