// Side panel opened by clicking a route on the map: today against the plan,
// for that one route.
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

import { VESSEL_COLOR } from '../colors';
import { num, rpBn, t } from '../i18n';
import type { ChargerRow, FleetRow, Lang, Port, Route, RouteKpi, VesselType } from '../types';
import { EstimateChip } from './KPICard';
import { vesselLabel } from './MapView';

interface Side {
  fleet: FleetRow[];
  routes: RouteKpi[];
}

interface Props {
  lang: Lang;
  route: Route | null;
  onClose: () => void;
  today: Side;
  plan: Side;
  chargers: ChargerRow[];
  ports: Port[];
  vesselTypes: VesselType[];
}

function Fleet({ lang, rows, vesselTypes }: { lang: Lang; rows: FleetRow[]; vesselTypes: VesselType[] }) {
  if (rows.length === 0) return <Typography variant="body2" color="text.secondary">{t(lang, 'none')}</Typography>;
  return (
    <Stack spacing={0.5}>
      {rows.map((row) => (
        <Stack key={row.vessel_type} direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: VESSEL_COLOR[row.vessel_type], flexShrink: 0 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.count}x {vesselLabel(vesselTypes, row.vessel_type, lang)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

/** One metric as two bars on a shared scale, so the change is visible at a glance. */
function Metric({ label, today, plan, format, lowerIsBetter, todayLabel, planLabel }: { label: string; today: number; plan: number; format: (v: number) => string; lowerIsBetter: boolean; todayLabel: string; planLabel: string }) {
  const max = Math.max(today, plan, 1e-9);
  const better = lowerIsBetter ? plan < today : plan > today;
  const same = Math.abs(plan - today) < 1e-9;
  const planColor = same ? '#52606a' : better ? '#0f1417' : '#9c4410';
  const bar = (name: string, value: number, color: string) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: '64px 1fr', alignItems: 'center', columnGap: 1 }}>
      <Typography variant="caption" color="text.secondary">{name}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ height: 12, width: `${(68 * value) / max}%`, minWidth: 4, bgcolor: color, borderRadius: '0 4px 4px 0', transition: 'width 0.4s ease' }} />
        <Typography variant="caption" sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{format(value)}</Typography>
      </Box>
    </Box>
  );
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>{label}</Typography>
      <Stack spacing={0.5}>
        {bar(todayLabel, today, '#8d9aa3')}
        {bar(planLabel, plan, planColor)}
      </Stack>
    </Box>
  );
}

export function RouteDrawer({ lang, route, onClose, today, plan, chargers, ports, vesselTypes }: Props) {
  const empty: RouteKpi = { route_id: '', route_name: '', reliability_pct: 0, scheduled_trips_per_year: 0, cancelled_trips_per_year: 0, unmet_demand_pct: 0, co2_t: 0, cost_rp: 0 };
  const id = route?.route_id;
  const kToday = today.routes.find((r) => r.route_id === id) ?? empty;
  const kPlan = plan.routes.find((r) => r.route_id === id) ?? empty;
  const fToday = today.fleet.filter((r) => r.route_id === id);
  const fPlan = plan.fleet.filter((r) => r.route_id === id);
  const trips = (rows: FleetRow[]) => rows.reduce((s, r) => s + r.daily_trips, 0);
  // Chargers matter here only if a plug-in vessel actually serves the route
  const usesShorePower = fPlan.some((r) => (vesselTypes.find((v) => v.type === r.vessel_type)?.kwh_per_nm ?? 0) > 0);
  const sameFleet = JSON.stringify(fToday.map((r) => [r.vessel_type, r.count, r.daily_trips])) === JSON.stringify(fPlan.map((r) => [r.vessel_type, r.count, r.daily_trips]));
  const endChargers = route && usesShorePower ? chargers.filter((c) => c.port_id === route.port_a || c.port_id === route.port_b) : [];
  const portName = (pid: string) => ports.find((p) => p.port_id === pid)?.name ?? pid;
  const labels = { todayLabel: t(lang, 'todayShort'), planLabel: t(lang, 'planShort') };

  return (
    <Drawer anchor="right" variant="persistent" open={route !== null} onClose={onClose} PaperProps={{ sx: { top: { sm: 56 }, height: { sm: 'calc(100% - 56px)' }, width: { xs: '100%', sm: 436 }, bgcolor: 'background.paper', borderRadius: { xs: 0, sm: '24px 0 0 24px' }, boxShadow: '-12px 0 40px rgba(15,20,23,0.25)', borderLeft: '1px solid #d6dee3' } }}>
      {route ? (
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box>
              <Typography variant="h5" component="h2" sx={{ fontSize: '2.1rem', lineHeight: 0.98 }}>{route.name}</Typography>
            </Box>
            <IconButton onClick={onClose} aria-label={t(lang, 'close')}><CloseIcon /></IconButton>
          </Stack>

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="baseline" sx={{ fontSize: '0.88rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
            <span>{num(lang, route.distance_nm, 1)} nm</span>
            <span>{num(lang, route.daily_pax)} {t(lang, 'paxPerDay')}</span>
            <EstimateChip label={t(lang, 'estimate')} hint={t(lang, 'estimateHint')} />
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '3px solid #0f1417' }}>
            <Box sx={{ pt: 1.5, pr: 2, borderRight: '1px solid #d6dee3' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{t(lang, 'today')}</Typography>
              <Box sx={{ mt: 1 }}><Fleet lang={lang} rows={fToday} vesselTypes={vesselTypes} /></Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>{trips(fToday)} {t(lang, 'colTrips').toLowerCase()}</Typography>
            </Box>
            <Box sx={{ pt: 1.5, pl: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#b5157a' }}>{t(lang, 'planShort')}</Typography>
              <Box sx={{ mt: 1 }}><Fleet lang={lang} rows={fPlan} vesselTypes={vesselTypes} /></Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>{trips(fPlan)} {t(lang, 'colTrips').toLowerCase()}</Typography>
            </Box>
          </Box>

          {sameFleet ? (
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.secondary' }}>{t(lang, 'unchanged')}</Typography>
          ) : null}

          <Stack spacing={2}>
            <Metric label={t(lang, 'cancelledPerYear')} today={kToday.cancelled_trips_per_year} plan={kPlan.cancelled_trips_per_year} format={(v) => num(lang, v)} lowerIsBetter {...labels} />
            <Metric label={t(lang, 'kpiReliability')} today={kToday.reliability_pct} plan={kPlan.reliability_pct} format={(v) => `${num(lang, v, 1)}%`} lowerIsBetter={false} {...labels} />
            <Metric label={t(lang, 'kpiCo2')} today={kToday.co2_t} plan={kPlan.co2_t} format={(v) => `${num(lang, v)} t`} lowerIsBetter {...labels} />
            <Metric label={t(lang, 'kpiCost')} today={kToday.cost_rp} plan={kPlan.cost_rp} format={(v) => rpBn(lang, v)} lowerIsBetter {...labels} />
          </Stack>

          <Divider />

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.75 }}>{t(lang, 'chargersHere')}</Typography>
            {endChargers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">{t(lang, 'notUsed')}</Typography>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {endChargers.map((c) => (
                  <Box key={c.port_id} component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
                    <Box component="span" aria-hidden="true" sx={{ width: 7, height: 12, borderRadius: '1px', bgcolor: '#b5157a' }} />
                    {c.port_name.split(' (')[0]} {num(lang, c.kw_used)} / {num(lang, c.kw_available)} kW
                  </Box>
                ))}
              </Stack>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {portName(route.port_a)} - {portName(route.port_b)}
            </Typography>
          </Box>

          {route.notes && lang === 'en' ? (
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              {t(lang, 'dataNote')}: {route.notes}
            </Typography>
          ) : null}
        </Box>
      ) : null}
    </Drawer>
  );
}
