// Fleet table in the style of the Kopibara dashboard, showing the NusaFleet
// plan per route instead of individual tankers.
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import CircleIcon from '@mui/icons-material/Circle';
import BoltIcon from '@mui/icons-material/Bolt';

import { VESSEL_COLOR } from '../colors';
import { num, t } from '../i18n';
import type { ChargerRow, FleetRow, Lang, VesselType } from '../types';
import { vesselLabel } from './MapView';

interface Props {
  lang: Lang;
  fleet: FleetRow[];
  chargers: ChargerRow[];
  vesselTypes: VesselType[];
}

export function FleetTable({ lang, fleet, chargers, vesselTypes }: Props) {
  const safety = (type: string) => vesselTypes.find((v) => v.type === type)?.safety_score ?? 0;

  return (
    <Card elevation={2} sx={{ bgcolor: '#e0f2f1' }}>
      <CardHeader
        title={t(lang, 'fleetTable')}
        subheader={t(lang, 'fleetSub')}
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold', color: '#00695c' }}
        subheaderTypographyProps={{ color: '#004d40', variant: 'body2' }}
      />
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <TableContainer component={Paper} elevation={0} sx={{ borderTopLeftRadius: 16, borderTopRightRadius: 16, overflowX: 'auto' }}>
          <Table size="medium" aria-label={t(lang, 'fleetTable')}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>{t(lang, 'colRoute')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t(lang, 'colVessel')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t(lang, 'colCount')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t(lang, 'colTrips')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t(lang, 'colOpDays')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t(lang, 'colSafety')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fleet.map((row) => {
                const score = safety(row.vessel_type);
                return (
                  <TableRow key={`${row.route_id}-${row.vessel_type}`} hover>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>{row.route_name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircleIcon sx={{ width: 10, height: 10, color: VESSEL_COLOR[row.vessel_type] }} />
                        <Typography variant="body2" color="text.secondary">{vesselLabel(vesselTypes, row.vessel_type, lang)}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{row.count}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{row.daily_trips}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{num(lang, row.operable_days)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={score}
                        size="small"
                        sx={{ fontWeight: 'bold', minWidth: 30, height: 24, color: 'white', bgcolor: score >= 4 ? '#2e7d32' : score === 3 ? '#b85c00' : '#d32f2f' }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <BoltIcon sx={{ fontSize: 18, color: '#2e7d32' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{t(lang, 'kpiChargers')}:</Typography>
          {chargers.length === 0 ? (
            <Typography variant="body2" color="text.secondary">{t(lang, 'none')}</Typography>
          ) : (
            chargers.map((c) => (
              <Chip key={c.port_id} size="small" variant="outlined" color="success" label={`${c.port_name} (${num(lang, c.kw_used)} / ${num(lang, c.kw_available)} kW)`} />
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
