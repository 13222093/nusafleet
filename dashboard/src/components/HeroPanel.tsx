// The three numbers a viewer should remember, as one dark band: the change
// against today's fleet in rupiah, tonnes of CO2 and trips not cancelled.
import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { num, rpBn, t } from '../i18n';
import type { Kpis, Lang, ParetoPoint } from '../types';
import { EstimateChip } from './KPICard';

const INK = '#06252b';
const MINT = '#7fe3d2';
const AMBER = '#ffc46b';
const SOFT = 'rgba(255,255,255,0.72)';
const MONO = '"JetBrains Mono", "Cascadia Mono", Consolas, ui-monospace, monospace';

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

/** A true minus sign for a drop, "+" for a rise. */
function sign(value: number): string {
  if (Math.abs(value) < 1e-9) return '';
  return value < 0 ? '−' : '+';
}

interface Props {
  lang: Lang;
  plan: ParetoPoint;
  base: Kpis;
  /** e.g. "Seimbang, 2031 Pembangkit terapung" */
  caption: string;
}

function Tile({ value, unit, label, better }: { value: string; unit?: string; label: string; better: boolean }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography component="div" sx={{ fontFamily: MONO, fontSize: { xs: '2rem', md: '2.6rem', lg: '3rem' }, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em', color: better ? MINT : AMBER, whiteSpace: 'nowrap' }}>
        {value}
        {unit ? (
          <Typography component="span" sx={{ fontFamily: MONO, fontSize: '0.4em', fontWeight: 600, ml: 1, color: 'inherit', letterSpacing: 0 }}>
            {unit}
          </Typography>
        ) : null}
      </Typography>
      <Typography sx={{ mt: 1, fontSize: '0.9rem', color: SOFT, lineHeight: 1.3 }}>{label}</Typography>
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
    <Box sx={{ mb: 2, p: { xs: 2.5, md: 3.5 }, borderRadius: '24px', bgcolor: INK, color: '#ffffff' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: { xs: 2, md: 2.5 } }}>
        <Typography sx={{ fontSize: '0.9rem', color: SOFT }}>
          <Box component="span" sx={{ color: '#ffffff', fontWeight: 700, mr: 1 }}>{t(lang, 'kpiVs')}</Box>
          {caption}
        </Typography>
        <EstimateChip label={t(lang, 'estimate')} hint={t(lang, 'estimateHint')} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: { xs: 2.5, md: 4 } }}>
        <Tile value={`${sign(costDelta)}${rpBn(lang, Math.abs(costShown))}`} label={t(lang, 'kpiCostLabel')} better={costDelta <= 0} />
        <Tile value={`${sign(co2Delta)}${num(lang, Math.abs(co2Shown))}`} unit="t" label={`${t(lang, 'kpiCo2Label')} (${sign(co2Pct)}${num(lang, Math.abs(co2Pct))}%)`} better={co2Delta <= 0} />
        <Tile value={`${tripsAvoided >= 0 ? '+' : '−'}${num(lang, Math.abs(tripsShown))}`} label={t(lang, tripsAvoided >= 0 ? 'kpiTripsLabel' : 'heroTripsMore')} better={tripsAvoided >= 0} />
      </Box>

      <Box sx={{ mt: { xs: 2.5, md: 3 }, pt: 2, borderTop: '1px solid rgba(255,255,255,0.14)', display: 'flex', flexWrap: 'wrap', columnGap: 4, rowGap: 1 }}>
        {facts.map(([label, value]) => (
          <Typography key={label} sx={{ fontSize: '0.85rem', color: SOFT }}>
            {label}{' '}
            <Box component="span" sx={{ color: '#ffffff', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</Box>
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
