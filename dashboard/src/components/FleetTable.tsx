// Fleet strip: per route, today's hulls on the left and the plan's hulls on the
// right. Each hull carries a letter as well as a colour, so the vessel type
// never depends on colour alone.
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { ArrowRight } from 'lucide-react';

import { VESSEL_COLOR, VESSEL_ORDER } from '../colors';
import { num, t } from '../i18n';
import type { FleetRow, Lang, Route } from '../types';
import { vesselShort } from './MapView';

const LETTER: Record<string, string> = { diesel_old: 'D', diesel_new: 'D+', hybrid: 'H', electric: 'E', fastcraft: 'C' };

function Hull({ type, title }: { type: string; title: string }) {
  return (
    <Box component="svg" viewBox="0 0 48 26" role="img" aria-label={title} sx={{ width: 40, height: 22, flexShrink: 0 }}>
      <title>{title}</title>
      <path d="M15 2h16v7H15z" fill={VESSEL_COLOR[type]} opacity="0.55" />
      <path d="M2 9h44l-6 14H8z" fill={VESSEL_COLOR[type]} />
      <text x="24" y="20" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff" fontFamily="inherit">
        {LETTER[type] ?? '?'}
      </text>
    </Box>
  );
}

function Hulls({ rows, lang }: { rows: FleetRow[]; lang: Lang }) {
  const ordered = VESSEL_ORDER.flatMap((type) => rows.filter((r) => r.vessel_type === type));
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center', minHeight: 26 }}>
      {ordered.flatMap((row) =>
        Array.from({ length: row.count }, (_unused, k) => <Hull key={`${row.vessel_type}-${k}`} type={row.vessel_type} title={vesselShort(row.vessel_type, lang)} />),
      )}
    </Box>
  );
}

interface Props {
  lang: Lang;
  routes: Route[];
  today: FleetRow[];
  plan: FleetRow[];
  safetyToday: number;
  safetyPlan: number;
}

export function FleetStrip({ lang, routes, today, plan, safetyToday, safetyPlan }: Props) {
  const used = VESSEL_ORDER.filter((type) => [...today, ...plan].some((r) => r.vessel_type === type));
  const trips = (rows: FleetRow[]) => rows.reduce((s, r) => s + r.daily_trips, 0);
  const head = { fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary' } as const;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          {t(lang, 'fleetTitle')}
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(84px, 1.1fr) minmax(0, 1fr) 16px minmax(0, 1fr) auto', columnGap: 1, rowGap: 1.5, alignItems: 'center' }}>
          <Typography sx={head}>{t(lang, 'colRoute')}</Typography>
          <Typography sx={head}>{t(lang, 'todayShort')}</Typography>
          <span />
          <Typography sx={head}>{t(lang, 'planShort')}</Typography>
          <Typography sx={{ ...head, textAlign: 'right' }}>{t(lang, 'tripsPerDay')}</Typography>

          {routes.map((route) => {
            const a = today.filter((r) => r.route_id === route.route_id);
            const b = plan.filter((r) => r.route_id === route.route_id);
            return (
              <Box key={route.route_id} sx={{ display: 'contents' }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.25 }}>{route.name.replace(/ \([^)]*\)/g, '')}</Typography>
                <Hulls rows={a} lang={lang} />
                <Box sx={{ color: 'text.secondary', display: 'flex' }}><ArrowRight size={16} /></Box>
                <Hulls rows={b} lang={lang} />
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {trips(a)} <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>{'→'}</Box> {trips(b)}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexWrap: 'wrap', columnGap: 2.5, rowGap: 1, alignItems: 'center' }}>
          {used.map((type) => (
            <Box key={type} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              <Hull type={type} title={vesselShort(type, lang)} />
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{vesselShort(type, lang)}</Typography>
            </Box>
          ))}
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', ml: 'auto' }}>
            {t(lang, 'safetyAvg')}{' '}
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {num(lang, safetyToday, 1)} {'→'} {num(lang, safetyPlan, 1)}
            </Box>{' '}
            / 5
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
