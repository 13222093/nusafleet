// The three numbers a viewer should remember, stated as one comparison with
// today's fleet. Everything else on the page is secondary to this panel.
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Banknote, CalendarCheck, Leaf } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { num, rpBn, t } from '../i18n';
import type { Kpis, Lang, ParetoPoint } from '../types';
import { EstimateChip } from './KPICard';

interface Props {
  lang: Lang;
  plan: ParetoPoint;
  base: Kpis;
  scenarioLabel: string;
}

function Stat({ icon: Icon, value, unit, label, good }: { icon: LucideIcon; value: string; unit?: string; label: string; good: boolean }) {
  const color = good ? '#00695C' : '#c62828';
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: good ? '#b2dfdb' : '#ffcdd2', color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={24} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="div" sx={{ fontSize: { xs: '2rem', xl: '2.4rem' }, lineHeight: 1.05, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
          {value}
          {unit ? (
            <Typography component="span" sx={{ fontSize: '1rem', fontWeight: 600, ml: 0.75, color }}>
              {unit}
            </Typography>
          ) : null}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {label}
        </Typography>
      </Box>
    </Stack>
  );
}

/** Two bars on one scale: today's fleet against the selected plan. */
function Compare({ title, today, plan, todayText, planText, todayLabel, planLabel }: { title: string; today: number; plan: number; todayText: string; planText: string; todayLabel: string; planLabel: string }) {
  const max = Math.max(today, plan);
  const row = (label: string, value: number, text: string, color: string) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: '72px 1fr', alignItems: 'center', columnGap: 1 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ height: 12, width: `${(70 * value) / max}%`, minWidth: 4, bgcolor: color, borderRadius: '0 4px 4px 0', transition: 'width 0.4s ease' }} />
        <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{text}</Typography>
      </Box>
    </Box>
  );
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>{title}</Typography>
      <Stack spacing={0.5}>
        {row(todayLabel, today, todayText, '#9fb8b4')}
        {row(planLabel, plan, planText, '#009688')}
      </Stack>
    </Box>
  );
}

export function HeroPanel({ lang, plan, base, scenarioLabel }: Props) {
  const costDelta = plan.cost_rp - base.annual_cost_rp;
  const co2Delta = plan.co2_t - base.co2_t;
  const co2Pct = Math.abs((100 * co2Delta) / base.co2_t);
  const tripsAvoided = ((plan.reliability_pct - base.reliability_pct) / 100) * base.scheduled_trips_per_year;
  const small = { fontVariantNumeric: 'tabular-nums', fontWeight: 600 } as const;

  return (
    <Card elevation={0} sx={{ height: '100%', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4, letterSpacing: 0.6 }}>
              {t(lang, plan.label ?? 'balanced')} · {scenarioLabel}
            </Typography>
            <EstimateChip label={t(lang, 'estimate')} hint={t(lang, 'estimateHint')} />
          </Stack>
          <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1.25 }}>
            {t(lang, 'heroLead')}
          </Typography>
        </Box>

        <Stack spacing={2.5}>
          <Stat
            icon={Banknote}
            value={rpBn(lang, Math.abs(costDelta))}
            label={t(lang, costDelta <= 0 ? 'heroCheaper' : 'heroCostlier')}
            good={costDelta <= 0}
          />
          <Stat
            icon={Leaf}
            value={num(lang, Math.abs(co2Delta))}
            unit="t CO2"
            label={`${t(lang, co2Delta <= 0 ? 'heroCo2Less' : 'heroCo2More')} (${num(lang, co2Pct)}%)`}
            good={co2Delta <= 0}
          />
          <Stat
            icon={CalendarCheck}
            value={num(lang, Math.abs(tripsAvoided))}
            unit={t(lang, 'trips')}
            label={t(lang, tripsAvoided >= 0 ? 'heroTripsAvoided' : 'heroTripsMore')}
            good={tripsAvoided >= 0}
          />
        </Stack>

        <Divider />

        <Stack spacing={2}>
          <Compare title={t(lang, 'kpiCost')} today={base.annual_cost_rp} plan={plan.cost_rp} todayText={rpBn(lang, base.annual_cost_rp)} planText={rpBn(lang, plan.cost_rp)} todayLabel={t(lang, 'todayShort')} planLabel={t(lang, 'planShort')} />
          <Compare title={t(lang, 'kpiCo2')} today={base.co2_t} plan={plan.co2_t} todayText={`${num(lang, base.co2_t)} t`} planText={`${num(lang, plan.co2_t)} t`} todayLabel={t(lang, 'todayShort')} planLabel={t(lang, 'planShort')} />
        </Stack>

        <Divider />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 0.75, columnGap: 2, mt: 'auto' }}>
          <Typography variant="body2" color="text.secondary">{t(lang, 'kpiCapex')}</Typography>
          <Typography variant="body2" sx={small}>{rpBn(lang, plan.capex_rp, 0)}</Typography>
          <Typography variant="body2" color="text.secondary">{t(lang, 'kpiReliability')}</Typography>
          <Typography variant="body2" sx={small}>{num(lang, plan.reliability_pct, 1)}%</Typography>
          <Typography variant="body2" color="text.secondary">{t(lang, 'kpiChargers')}</Typography>
          <Typography variant="body2" sx={{ ...small, textAlign: 'right' }}>
            {plan.chargers.length ? plan.chargers.map((c) => c.port_name).join(', ') : t(lang, 'none')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
