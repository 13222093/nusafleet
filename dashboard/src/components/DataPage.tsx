import type { ReactNode } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { num, t } from '../i18n';
import type { Lang, Summary } from '../types';

function Section({ title, head, children }: { title: string; head: { label: string; right?: boolean }[]; children: ReactNode }) {
  return (
    <Card elevation={2} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <CardHeader title={title} titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }} />
      <CardContent sx={{ pt: 0 }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {head.map((h) => (
                  <TableCell key={h.label} align={h.right ? 'right' : 'left'} sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    {h.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>{children}</TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

function Confidence({ value }: { value: string }) {
  const color = value === 'high' ? 'success' : value === 'med' ? 'primary' : 'warning';
  return <Chip label={value} size="small" color={color} variant="outlined" />;
}

const numeric = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const;
const top = { verticalAlign: 'top' } as const;

export function DataPage({ lang, summary }: { lang: Lang; summary: Summary }) {
  const basis = (x: { source: string | null; rationale: string | null }) => [x.source, x.rationale].filter(Boolean).join(' ');

  return (
    <Stack spacing={3}>
      <Typography color="text.secondary">{t(lang, 'dataIntro')}</Typography>

      <Section
        title={t(lang, 'assumptions')}
        head={[{ label: t(lang, 'colParam') }, { label: t(lang, 'colValue'), right: true }, { label: t(lang, 'colUnit') }, { label: t(lang, 'colBasis') }, { label: t(lang, 'colConfidence') }]}
      >
        {Object.entries(summary.assumptions).map(([key, a]) => (
          <TableRow key={key} sx={top}>
            <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{key}</TableCell>
            <TableCell align="right" sx={numeric}>{num(lang, a.value, a.value < 10 ? 2 : 0)}</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{a.unit}</TableCell>
            <TableCell>{basis(a)}</TableCell>
            <TableCell><Confidence value={a.confidence} /></TableCell>
          </TableRow>
        ))}
        {summary.scenarios.map((s) => (
          <TableRow key={s.id} sx={top}>
            <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{s.id}</TableCell>
            <TableCell align="right" sx={numeric}>{num(lang, s.elec_price_rp_per_kwh)} / {num(lang, s.grid_ef_kgco2_per_kwh, 2)}</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>Rp/kWh / kgCO2/kWh</TableCell>
            <TableCell>{[s.rationale, s.note].filter(Boolean).join(' ')}</TableCell>
            <TableCell><Confidence value="low" /></TableCell>
          </TableRow>
        ))}
      </Section>

      <Section title={t(lang, 'datasets')} head={[{ label: t(lang, 'colFile') }, { label: t(lang, 'colBasis') }, { label: t(lang, 'colConfidence') }]}>
        {Object.values(summary.tables).map((tb) => (
          <TableRow key={tb.file} sx={top}>
            <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{tb.file}</TableCell>
            <TableCell>{basis(tb)}</TableCell>
            <TableCell><Confidence value={tb.confidence} /></TableCell>
          </TableRow>
        ))}
      </Section>

      <Section
        title={t(lang, 'vessels')}
        head={[{ label: t(lang, 'colVessel') }, { label: t(lang, 'colCap'), right: true }, { label: t(lang, 'colSpeed'), right: true }, { label: t(lang, 'colHs'), right: true }, { label: t(lang, 'colCapex'), right: true }, { label: t(lang, 'colSafety'), right: true }, { label: t(lang, 'colNotes') }]}
      >
        {summary.vessel_types.map((v) => (
          <TableRow key={v.type} sx={top}>
            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{lang === 'id' ? v.label_id : v.label_en}</TableCell>
            <TableCell align="right" sx={numeric}>{num(lang, v.cap_pax)}</TableCell>
            <TableCell align="right" sx={numeric}>{num(lang, v.speed_kn)}</TableCell>
            <TableCell align="right" sx={numeric}>{num(lang, v.hs_max_m, 1)}</TableCell>
            <TableCell align="right" sx={numeric}>{num(lang, v.capex_rp / 1e9)}</TableCell>
            <TableCell align="right" sx={numeric}>{num(lang, v.safety_score)}</TableCell>
            <TableCell>{v.notes}</TableCell>
          </TableRow>
        ))}
      </Section>

      <Section
        title={t(lang, 'routes')}
        head={[{ label: t(lang, 'colRoute') }, { label: t(lang, 'colDistance'), right: true }, { label: t(lang, 'colDemand'), right: true }, { label: t(lang, 'colConfidence') }, { label: t(lang, 'colNotes') }]}
      >
        {summary.routes.map((r) => (
          <TableRow key={r.route_id} sx={top}>
            <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
            <TableCell align="right" sx={numeric}>{num(lang, r.distance_nm, 1)}</TableCell>
            <TableCell align="right" sx={numeric}>{num(lang, r.daily_pax)}</TableCell>
            <TableCell><Confidence value={r.confidence} /></TableCell>
            <TableCell>{r.notes}</TableCell>
          </TableRow>
        ))}
      </Section>
    </Stack>
  );
}
