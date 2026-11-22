// Scenario comparison in the style of the Kopibara dashboard: today's fleet
// against the selected kind of plan in each power-supply scenario.
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';

import { num, rpBn, signed, t } from '../i18n';
import type { Lang, ParetoPoint, ScenarioResult } from '../types';
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
  const numeric = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const;

  return (
    <Card elevation={2}>
      <CardHeader
        title={t(lang, 'tableTitle')}
        subheader={`${t(lang, 'plan')}: ${t(lang, planLabel ?? 'balanced')}`}
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        subheaderTypographyProps={{ variant: 'body2' }}
        action={<Box sx={{ pt: 1, pr: 1 }}><EstimateChip label={t(lang, 'estimate')} hint={t(lang, 'estimateHint')} /></Box>}
      />
      <CardContent>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label={t(lang, 'tableTitle')}>
            <TableHead>
              <TableRow>
                <TableCell>{t(lang, 'colScenario')}</TableCell>
                <TableCell align="right">{t(lang, 'colFrom')}</TableCell>
                <TableCell align="right">{t(lang, 'kpiCost')}</TableCell>
                <TableCell align="right">{t(lang, 'kpiCapex')}</TableCell>
                <TableCell align="right">CO2</TableCell>
                <TableCell align="right">{t(lang, 'colCo2Delta')}</TableCell>
                <TableCell align="right">{t(lang, 'kpiReliability')}</TableCell>
                <TableCell align="right">{t(lang, 'colPlug')}</TableCell>
                <TableCell align="right">{t(lang, 'kpiChargers')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>{t(lang, 'today')}</TableCell>
                <TableCell align="right" sx={numeric}>2026</TableCell>
                <TableCell align="right" sx={numeric}>{rpBn(lang, base.annual_cost_rp)}</TableCell>
                <TableCell align="right" sx={numeric}>{rpBn(lang, 0, 0)}</TableCell>
                <TableCell align="right" sx={numeric}>{num(lang, base.co2_t)} t</TableCell>
                <TableCell align="right"><Chip label="0%" size="small" variant="outlined" /></TableCell>
                <TableCell align="right" sx={numeric}>{num(lang, base.reliability_pct, 1)}%</TableCell>
                <TableCell align="right" sx={numeric}>0%</TableCell>
                <TableCell align="right" sx={numeric}>0</TableCell>
              </TableRow>
              {ids.map((id) => {
                const points = results[id].pareto;
                const p = points.find((x) => x.label === planLabel) ?? points[0];
                const delta = (100 * (p.co2_t - base.co2_t)) / base.co2_t;
                const active = id === activeId;
                return (
                  <TableRow key={id} selected={active} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      {lang === 'id' ? results[id].scenario.label_id : results[id].scenario.label_en}
                    </TableCell>
                    <TableCell align="right" sx={numeric}>{results[id].scenario.available_from_year}</TableCell>
                    <TableCell align="right" sx={numeric}>{rpBn(lang, p.cost_rp)}</TableCell>
                    <TableCell align="right" sx={numeric}>{rpBn(lang, p.capex_rp, 0)}</TableCell>
                    <TableCell align="right" sx={numeric}>{num(lang, p.co2_t)} t</TableCell>
                    <TableCell align="right">
                      <Chip label={`${signed(lang, delta)}%`} size="small" color={delta < 0 ? 'success' : delta > 0 ? 'error' : 'default'} variant={delta === 0 ? 'outlined' : 'filled'} />
                    </TableCell>
                    <TableCell align="right" sx={numeric}>{num(lang, p.reliability_pct, 1)}%</TableCell>
                    <TableCell align="right" sx={numeric}>{num(lang, p.plug_in_trip_share_pct)}%</TableCell>
                    <TableCell align="right" sx={numeric}>{p.chargers.length}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
