// Chart cards in the style of the Kopibara dashboard (MUI Card + Recharts),
// re-targeted to the NusaFleet outputs.
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, LabelList, Cell } from 'recharts';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { VESSEL_COLOR, VESSEL_ORDER } from '../colors';
import { num, rpBn, t } from '../i18n';
import type { FleetRow, Lang, ScenarioResult, VesselType } from '../types';
import { vesselLabel } from './MapView';

const TEAL = '#009688';
const MUTED = '#9fb8b4';
const tooltipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0px 2px 8px rgba(0,0,0,0.18)' };
const titleProps = { variant: 'h6' as const, fontWeight: 'bold' };

function Header({ title, subheader }: { lang: Lang; title: string; subheader?: string }) {
  return (
    <CardHeader
      title={title}
      subheader={subheader}
      titleTypographyProps={titleProps}
      subheaderTypographyProps={{ variant: 'body2' }}
    />
  );
}

interface ParetoProps {
  lang: Lang;
  results: Record<string, ScenarioResult>;
  activeId: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function ParetoChart({ lang, results, activeId, selectedIndex, onSelect }: ParetoProps) {
  const label = (id: string) => (lang === 'id' ? results[id].scenario.label_id : results[id].scenario.label_en);
  const series = (id: string) =>
    results[id].pareto.map((p, index) => ({
      co2: p.co2_t / 1000,
      cost: p.cost_rp / 1e9,
      index,
      plug: p.plug_in_trip_share_pct,
      scenario: label(id),
    }));
  const others = Object.keys(results).filter((id) => id !== activeId);

  return (
    <Card>
      <Header lang={lang} title={t(lang, 'paretoTitle')} subheader={t(lang, 'paretoNote')} />
      <CardContent>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 8, right: 24, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="co2"
                type="number"
                domain={['dataMin - 0.3', 'dataMax + 0.3']}
                tickFormatter={(v: number) => num(lang, v, 1)}
                allowDuplicatedCategory={false}
                label={{ value: t(lang, 'axisCo2'), position: 'insideBottom', offset: -14, fontSize: 12 }}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                dataKey="cost"
                type="number"
                domain={['dataMin - 2', 'dataMax + 2']}
                tickFormatter={(v: number) => num(lang, v, 0)}
                label={{ value: t(lang, 'axisCost'), angle: -90, position: 'insideLeft', fontSize: 12, style: { textAnchor: 'middle' } }}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as ReturnType<typeof series>[number];
                  return (
                    <Box sx={{ ...tooltipStyle, bgcolor: 'background.paper', p: 1.5, fontSize: 13 }}>
                      <strong>{d.scenario}</strong>
                      <div>{rpBn(lang, d.cost * 1e9)}</div>
                      <div>CO2: {num(lang, d.co2 * 1000)} t</div>
                      <div>{t(lang, 'colPlug')}: {num(lang, d.plug)}%</div>
                    </Box>
                  );
                }}
              />
              {others.map((id) => (
                <Line key={id} data={series(id)} type="linear" dataKey="cost" name={label(id)} stroke={MUTED} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
              ))}
              <Line
                data={series(activeId)}
                type="linear"
                dataKey="cost"
                name={label(activeId)}
                stroke={TEAL}
                strokeWidth={3}
                isAnimationActive={false}
                activeDot={false}
                dot={(props: { cx?: number; cy?: number; index?: number }) => {
                  const selected = props.index === selectedIndex;
                  return (
                    <g key={props.index} style={{ cursor: 'pointer' }} onClick={() => onSelect(props.index ?? 0)}>
                      <circle cx={props.cx} cy={props.cy} r={14} fill="transparent" />
                      <circle cx={props.cx} cy={props.cy} r={selected ? 8 : 5} fill={selected ? '#ffffff' : TEAL} stroke={TEAL} strokeWidth={selected ? 4 : 2} />
                    </g>
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          {[activeId, ...others].map((id) => (
            <Stack key={id} direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 18, height: 4, borderRadius: 2, bgcolor: id === activeId ? TEAL : MUTED }} />
              <Typography variant="caption" color="text.secondary">{label(id)}</Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function VesselMixChart({ lang, fleet, vesselTypes }: { lang: Lang; fleet: FleetRow[]; vesselTypes: VesselType[] }) {
  const data = VESSEL_ORDER.map((type) => ({
    type,
    name: vesselLabel(vesselTypes, type, lang),
    vessels: fleet.filter((r) => r.vessel_type === type).reduce((s, r) => s + r.count, 0),
  })).filter((d) => d.vessels > 0);

  return (
    <Card>
      <Header lang={lang} title={t(lang, 'mixTitle')} />
      <CardContent>
        <div style={{ height: 220, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} margin={{ left: 40, right: 32 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} formatter={(value) => [String(value), t(lang, 'colCount')]} />
              <Bar dataKey="vessels" radius={[0, 4, 4, 0]} barSize={22} isAnimationActive={false}>
                {data.map((entry) => (
                  <Cell key={entry.type} fill={VESSEL_COLOR[entry.type]} />
                ))}
                <LabelList dataKey="vessels" position="right" style={{ fontSize: '12px', fill: '#0c2a2e', fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function HeatmapChart({ lang, result }: { lang: Lang; result: ScenarioResult }) {
  const { cells, diesel_prices, elec_prices } = result.sensitivity;
  const diesel = [...diesel_prices].sort((a, b) => b - a);
  const costAt = (d: number, e: number) => cells.find((c) => c.diesel_price_rp_per_l === d && c.elec_price_rp_per_kwh === e)?.cost_rp;
  // If every row is the same across tariffs, the tariff axis carries no information
  const flat = diesel.every((d) => new Set(elec_prices.map((e) => costAt(d, e))).size === 1);
  const cols = flat ? elec_prices.slice(0, 1) : elec_prices;

  const costs = cells.filter((c) => c.feasible).map((c) => c.cost_rp);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);

  // One hue (teal), light to dark, so darker always means higher cost
  const getColor = (cost: number) => {
    const ratio = maxCost === minCost ? 0 : (cost - minCost) / (maxCost - minCost);
    return `hsl(174, 55%, ${92 - ratio * 44}%)`;
  };
  const getInk = (cost: number) => {
    const ratio = maxCost === minCost ? 0 : (cost - minCost) / (maxCost - minCost);
    return ratio > 0.72 ? '#ffffff' : '#004D40';
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header lang={lang} title={t(lang, 'heatTitle')} subheader={t(lang, 'heatNote')} />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 300, overflowX: 'auto' }}>
          <div style={{ flexGrow: 1, display: 'grid', gap: '8px', gridTemplateColumns: `auto repeat(${cols.length}, 1fr)`, gridTemplateRows: `auto repeat(${diesel.length}, 1fr)`, minWidth: flat ? 0 : 520, maxWidth: flat ? 360 : 'none', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#51676a', textAlign: 'right', paddingRight: '8px', alignSelf: 'center' }}>
              {flat ? t(lang, 'heatDiesel') : t(lang, 'heatCorner')}
            </div>
            {cols.map((price) => (
              <div key={price} style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', color: '#51676a', alignSelf: 'center' }}>
                {flat ? t(lang, 'kpiCost') : num(lang, price)}
              </div>
            ))}
            {diesel.map((d) => (
              <React.Fragment key={`row-${d}`}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#51676a', textAlign: 'right', paddingRight: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {num(lang, d)}
                </div>
                {cols.map((e) => {
                  const point = cells.find((c) => c.diesel_price_rp_per_l === d && c.elec_price_rp_per_kwh === e);
                  if (!point || !point.feasible) return <div key={`${d}-${e}`} />;
                  return (
                    <div
                      key={`${d}-${e}`}
                      title={`${rpBn(lang, point.cost_rp)} | CO2 ${num(lang, point.co2_t)} t | ${t(lang, 'colPlug')} ${num(lang, point.plug_in_trip_share_pct)}%`}
                      style={{ minHeight: 48, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, cursor: 'default', fontVariantNumeric: 'tabular-nums', backgroundColor: getColor(point.cost_rp), color: getInk(point.cost_rp) }}
                    >
                      {num(lang, point.cost_rp / 1e9, 1)}
                      {point.plug_in_trip_share_pct > 0 ? <span style={{ fontSize: '11px' }}>{num(lang, point.plug_in_trip_share_pct)}% {t(lang, 'vElectric')}</span> : null}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div style={{ margin: '4px 16px 16px', fontSize: '12px', textAlign: 'center', color: '#51676a' }}>
          {flat ? t(lang, 'heatFlat') : t(lang, 'heatAxes')}
        </div>
      </CardContent>
    </Card>
  );
}

export function CarbonSensitivityChart({ lang, result }: { lang: Lang; result: ScenarioResult }) {
  const data = result.carbon_sweep
    .filter((p) => p.feasible)
    .map((p) => ({ price: p.carbon_price_rp_per_tco2 / 1e6, cost: p.cost_rp / 1e9, co2: p.co2_t }));

  return (
    <Card>
      <Header lang={lang} title={t(lang, 'carbonTitle')} subheader={t(lang, 'carbonNote')} />
      <CardContent>
        <div style={{ height: 260, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 24, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="price"
                type="number"
                domain={[0, 'dataMax']}
                tickFormatter={(v: number) => num(lang, v, 1)}
                label={{ value: t(lang, 'axisCarbon'), position: 'insideBottom', offset: -14, fontSize: 12 }}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                domain={['dataMin - 2', 'dataMax + 2']}
                tickFormatter={(v: number) => num(lang, v, 0)}
                label={{ value: t(lang, 'axisCost'), angle: -90, position: 'insideLeft', fontSize: 12, style: { textAnchor: 'middle' } }}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, _name, item) => [`${rpBn(lang, Number(value) * 1e9)} | CO2 ${num(lang, (item.payload as { co2: number }).co2)} t`, t(lang, 'kpiCost')]}
                labelFormatter={(label) => `Rp ${num(lang, Number(label), 2)} ${t(lang, 'perTonne')}`}
              />
              <Line type="monotone" dataKey="cost" stroke={TEAL} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
