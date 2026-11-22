// Scenario comparison, transposed: one column per moment (today, 2026, 2027,
// 2031) and one row per result, so the three supply scenarios read side by side.
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { num, rpBn, t } from '../i18n';
import type { Lang, ParetoPoint, ScenarioResult } from '../types';
import { scenarioShort } from './Controls';
import { EstimateChip } from './KPICard';

interface Props {
  lang: Lang;
  results: Record<string, ScenarioResult>;
  activeId: string;
  planLabel: ParetoPoint['label'];
}

export function ComparisonTable({ lang, results, activeId, planLabel }: Props) {
  const ids = Object.keys(results);
  const base = results[activeId].baseline.kpis;
  const pick = (id: string) => results[id].pareto.find((p) => p.label === planLabel) ?? results[id].pareto[0];
  const signed = (v: number, digits = 0) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${num(lang, Math.abs(v), digits)}`;
  const tripsAvoided = (p: ParetoPoint) => ((p.reliability_pct - base.reliability_pct) / 100) * base.scheduled_trips_per_year;

  const rows: { label: string; today: string; cell: (p: ParetoPoint) => string }[] = [
    { label: t(lang, 'kpiCost'), today: rpBn(lang, base.annual_cost_rp), cell: (p) => rpBn(lang, p.cost_rp) },
    { label: t(lang, 'kpiCo2'), today: `${num(lang, base.co2_t)} t`, cell: (p) => `${num(lang, p.co2_t)} t` },
    { label: t(lang, 'colCo2Delta'), today: '0%', cell: (p) => `${signed((100 * (p.co2_t - base.co2_t)) / base.co2_t)}%` },
    { label: t(lang, 'rowTrips'), today: '0', cell: (p) => signed(tripsAvoided(p)) },
    { label: t(lang, 'stationsShort'), today: '0', cell: (p) => String(p.chargers.length) },
  ];

  const cellSx = { px: 1.5, py: 1.25, fontSize: '0.9rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', borderTop: '1px solid', borderColor: 'divider' } as const;
  const planName = t(lang, planLabel === 'least_cost' ? 'cheapest' : planLabel === 'lowest_co2' ? 'cleanest' : 'balanced');

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t(lang, 'tableTitle')}
            <Box component="span" sx={{ ml: 1, fontSize: '0.85rem', fontWeight: 500, color: 'text.secondary' }}>{planName}</Box>
          </Typography>
          <EstimateChip label={t(lang, 'estimate')} hint={t(lang, 'estimateHint')} />
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <Box component="th" sx={{ textAlign: 'left' }} />
                <Box component="th" scope="col" sx={{ px: 1.5, py: 1, textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: 'text.secondary' }}>
                  {t(lang, 'todayShort')}
                </Box>
                {ids.map((id) => {
                  const active = id === activeId;
                  const s = results[id].scenario;
                  return (
                    <Box component="th" scope="col" key={id} sx={{ px: 1.5, py: 1, textAlign: 'right', bgcolor: active ? '#e3f5f1' : 'transparent', borderRadius: active ? '12px 12px 0 0' : 0 }}>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{s.available_from_year}</Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.2 }}>{scenarioShort(id, lang, lang === 'id' ? s.label_id : s.label_en)}</Typography>
                    </Box>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={row.label}>
                  <Box component="th" scope="row" sx={{ ...cellSx, pl: 0, textAlign: 'left', fontWeight: 600, whiteSpace: 'normal' }}>{row.label}</Box>
                  <Box component="td" sx={{ ...cellSx, color: 'text.secondary' }}>{row.today}</Box>
                  {ids.map((id) => {
                    const active = id === activeId;
                    return (
                      <Box component="td" key={id} sx={{ ...cellSx, fontWeight: active ? 700 : 500, bgcolor: active ? '#e3f5f1' : 'transparent', borderRadius: active && r === rows.length - 1 ? '0 0 12px 12px' : 0 }}>
                        {row.cell(pick(id))}
                      </Box>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
