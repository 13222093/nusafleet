// The route map, drawn like a nautical chart: dark sea, graticule, routes as
// arcs, vessels sailing along them, and an inset for the three ports around Ternate.
import 'leaflet/dist/leaflet.css';
import { Fragment, useEffect, useState } from 'react';
import { divIcon } from 'leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import { AttributionControl, CircleMarker, MapContainer, Marker, Polyline, Rectangle, TileLayer, Tooltip } from 'react-leaflet';

import { NO_SERVICE_COLOR, VESSEL_COLOR_MAP, VESSEL_ORDER } from '../colors';
import { num, t } from '../i18n';
import type { StringKey } from '../i18n';
import type { ChargerRow, FleetRow, Lang, Port, Route, VesselType } from '../types';

interface Props {
  lang: Lang;
  routes: Route[];
  ports: Port[];
  vesselTypes: VesselType[];
  fleet: FleetRow[];
  chargers: ChargerRow[];
  selectedRouteId: string | null;
  onRouteClick: (routeId: string) => void;
  view: 'plan' | 'today';
  onView: (view: 'plan' | 'today') => void;
}

type LatLon = [number, number];
type Side = 'left' | 'right' | 'top' | 'bottom';

// The three ports around Ternate sit within a few miles of each other, so the
// main map cannot show them apart. They get their own zoomed inset.
const INSET_BOUNDS: [LatLon, LatLon] = [
  [0.66, 127.2],
  [0.85, 127.64],
];
const MAIN_BOUNDS: LatLngBoundsExpression = [
  [0.35, 126.2],
  [2.3, 128.6],
];
// Label-free dark basemap, tinted towards deep teal in index.css
const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const TILE_ATTRIBUTION = 'Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors';

const LABEL_SIDE: Record<string, Side> = { TTE: 'left', TID: 'bottom', SOF: 'right', BTD: 'top', JAI: 'right', TOB: 'left', DAR: 'right' };
const INSET_LABEL_SIDE: Record<string, Side> = { TTE: 'left', TID: 'left', SOF: 'bottom' };
const INSET_ROUTE_SIDE: Record<string, Side> = { TTE_TID: 'bottom', TTE_SOF: 'top' };
const OFFSET: Record<Side, [number, number]> = { left: [-14, 0], right: [14, 0], top: [0, -14], bottom: [0, 14] };

const SHORT_NAME: Record<string, StringKey> = { diesel_old: 'vOld', diesel_new: 'vNew', hybrid: 'vHybrid', electric: 'vElectric', fastcraft: 'vFast' };
const BOLT = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="#06252b"/></svg>';
const CHARGER_ICON = divIcon({ className: 'charger-icon', html: BOLT, iconSize: [24, 24], iconAnchor: [12, 12] });

export function vesselLabel(vesselTypes: VesselType[], type: string, lang: Lang): string {
  const v = vesselTypes.find((x) => x.type === type);
  if (!v) return type;
  return lang === 'id' ? v.label_id : v.label_en;
}

/** "diesel lama", "listrik": the vessel type without the repeated word "ferry". */
export function vesselShort(type: string, lang: Lang): string {
  const key = SHORT_NAME[type];
  return key ? t(lang, key) : type;
}

function inInset(p: Port): boolean {
  return p.lat >= INSET_BOUNDS[0][0] && p.lat <= INSET_BOUNDS[1][0] && p.lon >= INSET_BOUNDS[0][1] && p.lon <= INSET_BOUNDS[1][1];
}

/** Quadratic curve between two ports, so routes read as sea lanes and do not overlap. */
function arc(a: LatLon, b: LatLon, bend: number, steps = 36): LatLon[] {
  const cLat = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend;
  const cLon = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  const points: LatLon[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const s = i / steps;
    points.push([
      (1 - s) * (1 - s) * a[0] + 2 * (1 - s) * s * cLat + s * s * b[0],
      (1 - s) * (1 - s) * a[1] + 2 * (1 - s) * s * cLon + s * s * b[1],
    ]);
  }
  return points;
}

/** Faint half-degree grid, as on a sea chart. */
function Graticule() {
  const lines: LatLon[][] = [];
  for (let lat = -1; lat <= 3.5; lat += 0.5) lines.push([[lat, 124], [lat, 131]]);
  for (let lon = 124; lon <= 131; lon += 0.5) lines.push([[-1, lon], [3.5, lon]]);
  return (
    <>
      {lines.map((line, i) => (
        <Polyline key={i} positions={line} pathOptions={{ color: '#ffffff', weight: 1, opacity: 0.07 }} interactive={false} />
      ))}
    </>
  );
}

type LayerProps = Pick<Props, 'lang' | 'routes' | 'ports' | 'vesselTypes' | 'fleet' | 'chargers' | 'selectedRouteId' | 'onRouteClick'> & { inset: boolean };

function Layers({ lang, routes, ports, fleet, chargers, inset, selectedRouteId, onRouteClick }: LayerProps) {
  const portById = new Map(ports.map((p) => [p.port_id, p]));
  const chargerIds = new Set(chargers.map((c) => c.port_id));
  const maxPax = Math.max(...routes.map((r) => r.daily_pax));

  return (
    <>
      {routes.map((route, i) => {
        const a = portById.get(route.port_a);
        const b = portById.get(route.port_b);
        if (!a || !b) return null;
        const local = inInset(a) && inInset(b);
        const rows = fleet.filter((row) => row.route_id === route.route_id).sort((x, y) => y.daily_trips - x.daily_trips);
        const color = rows.length ? VESSEL_COLOR_MAP[rows[0].vessel_type] : NO_SERVICE_COLOR;
        const mix = rows.map((row) => `${row.count} ${vesselShort(row.vessel_type, lang)}`).join(' + ') || t(lang, 'none');
        const path = arc([a.lat, a.lon], [b.lat, b.lon], i % 2 === 0 ? 0.16 : -0.16);
        const weight = 3 + 7 * Math.sqrt(route.daily_pax / maxPax);
        const mid = path[Math.floor(path.length / 2)];
        const selected = route.route_id === selectedRouteId;
        // Short local routes are labelled in the inset only, long ones in the main map only
        const showLabel = inset ? local : !local;
        const side = inset ? INSET_ROUTE_SIDE[route.route_id] : undefined;
        return (
          <Fragment key={`${route.route_id}-${mix}-${inset}-${selected}`}>
            <Polyline positions={path} pathOptions={{ color: selected ? '#ffffff' : '#041418', weight: weight + (selected ? 8 : 5), opacity: 0.9, lineCap: 'round' }} interactive={false} />
            {/* Wide invisible line so thin routes are still easy to click */}
            <Polyline positions={path} pathOptions={{ color: '#ffffff', weight: 22, opacity: 0 }} eventHandlers={{ click: () => onRouteClick(route.route_id) }} />
            <Polyline positions={path} pathOptions={{ color, weight, opacity: 1, lineCap: 'round', className: 'route-line' }} eventHandlers={{ click: () => onRouteClick(route.route_id) }}>
              <Tooltip sticky className="map-tip">
                <strong>{route.name}</strong>
                <br />
                {mix}
                <br />
                {num(lang, route.daily_pax)} {t(lang, 'paxPerDay')}, {num(lang, route.distance_nm, 1)} nm
              </Tooltip>
            </Polyline>
            {showLabel ? (
              <CircleMarker center={mid} radius={0} pathOptions={{ opacity: 0, fillOpacity: 0 }} interactive={false}>
                <Tooltip permanent direction={side ?? 'center'} offset={side ? OFFSET[side] : [0, 0]} className="route-label">
                  <span className="route-dot" style={{ background: color }} />
                  {mix}
                </Tooltip>
              </CircleMarker>
            ) : null}
          </Fragment>
        );
      })}
      {ports.map((port) => {
        const hasCharger = chargerIds.has(port.port_id);
        const local = inInset(port);
        if (inset && !local) return null;
        // In the main map only Ternate is named inside the cluster; the inset names all three
        const showName = inset ? local : !local || port.port_id === 'TTE';
        const side: Side = (inset ? INSET_LABEL_SIDE[port.port_id] : LABEL_SIDE[port.port_id]) ?? 'right';
        const name = showName ? (
          <Tooltip permanent direction={side} offset={OFFSET[side]} className="port-label">
            {port.name.split(' (')[0]}
          </Tooltip>
        ) : null;
        return (
          <Fragment key={`${port.port_id}-${hasCharger}-${inset}`}>
            {hasCharger ? (
              <>
                <CircleMarker center={[port.lat, port.lon]} radius={17} pathOptions={{ color: '#7fe3d2', weight: 3, fill: false, className: 'charger-pulse' }} interactive={false} />
                <Marker position={[port.lat, port.lon]} icon={CHARGER_ICON} interactive={false} keyboard={false}>
                  {name}
                </Marker>
              </>
            ) : (
              <CircleMarker center={[port.lat, port.lon]} radius={5} pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#06252b', fillOpacity: 1 }} interactive={false}>
                {name}
              </CircleMarker>
            )}
          </Fragment>
        );
      })}
    </>
  );
}

/** Seconds since mount, updated about 25 times a second. Stays 0 when the viewer prefers reduced motion. */
function useClock(): number {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let frame = 0;
    let last = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (now - last > 40) {
        last = now;
        // A frame timestamp can be slightly earlier than `start`, so clamp at zero
        setSeconds(Math.max(0, (now - start) / 1000));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return seconds;
}

/** Vessels sailing back and forth on each route, in the colour of their type; faster types cross sooner. */
function Boats({ routes, ports, vesselTypes, fleet, inset }: LayerProps) {
  const seconds = useClock();
  const portById = new Map(ports.map((p) => [p.port_id, p]));

  return (
    <>
      {routes.flatMap((route, i) => {
        const a = portById.get(route.port_a);
        const b = portById.get(route.port_b);
        if (!a || !b) return [];
        const path = arc([a.lat, a.lon], [b.lat, b.lon], i % 2 === 0 ? 0.16 : -0.16);
        const rows = fleet.filter((row) => row.route_id === route.route_id);
        return rows.flatMap((row, r) => {
          const speed = vesselTypes.find((v) => v.type === row.vessel_type)?.speed_kn ?? 10;
          // One-way crossing time on screen: a few seconds, longer for long or slow crossings
          const period = 3 + 2.2 * (route.distance_nm / speed);
          return Array.from({ length: Math.min(row.count, 2) }, (_unused, k) => {
            const phase = (seconds / period + k * 0.5 + r * 0.31 + i * 0.13) % 2;
            const along = (phase <= 1 ? phase : 2 - phase) * (path.length - 1);
            const lo = Math.max(0, Math.min(Math.floor(along), path.length - 2));
            const f = along - lo;
            return (
              <CircleMarker
                key={`${route.route_id}-${row.vessel_type}-${k}`}
                center={[path[lo][0] + (path[lo + 1][0] - path[lo][0]) * f, path[lo][1] + (path[lo + 1][1] - path[lo][1]) * f]}
                radius={inset ? 6 : 5}
                pathOptions={{ color: '#ffffff', weight: 2, fillColor: VESSEL_COLOR_MAP[row.vessel_type], fillOpacity: 1 }}
                interactive={false}
              />
            );
          });
        });
      })}
    </>
  );
}

export function MapView(props: Props) {
  const { lang, fleet, view, onView } = props;
  const usedTypes = VESSEL_ORDER.filter((type) => fleet.some((row) => row.vessel_type === type));

  return (
    <div className="map-stage">
      <MapContainer bounds={MAIN_BOUNDS} scrollWheelZoom={false} zoomSnap={0.25} zoomControl={false} attributionControl={false} className="map">
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <AttributionControl prefix={false} position="bottomleft" />
        <Graticule />
        <Rectangle bounds={INSET_BOUNDS} pathOptions={{ color: '#7fe3d2', weight: 1.5, dashArray: '4 4', fill: false }} interactive={false} />
        <Layers {...props} inset={false} />
        <Boats {...props} inset={false} />
      </MapContainer>

      <div className="map-top">
        <span className="map-hint">{t(lang, 'hintClick')}</span>
        <div className="seg" role="group" aria-label={t(lang, 'showOnMap')}>
          <button type="button" aria-pressed={view === 'today'} onClick={() => onView('today')}>
            {t(lang, 'todayShort')}
          </button>
          <button type="button" aria-pressed={view === 'plan'} onClick={() => onView('plan')}>
            {t(lang, 'planShort')}
          </button>
        </div>
      </div>

      <div className="map-legend">
        {usedTypes.map((type) => (
          <span key={type} className="legend-item">
            <span className="swatch-line" style={{ background: VESSEL_COLOR_MAP[type] }} />
            {vesselShort(type, lang)}
          </span>
        ))}
        <span className="legend-item">
          <span className="charger-icon legend-charger" dangerouslySetInnerHTML={{ __html: BOLT }} />
          {t(lang, 'legendCharger')}
        </span>
        <span className="legend-item legend-note">{t(lang, 'legendWide')}</span>
      </div>

      <div className="map-inset">
        <div className="map-inset-title">{t(lang, 'insetTitle')}</div>
        <MapContainer
          bounds={INSET_BOUNDS}
          zoomSnap={0.25}
          zoomControl={false}
          attributionControl={false}
          dragging={false}
          doubleClickZoom={false}
          scrollWheelZoom={false}
          touchZoom={false}
          keyboard={false}
          boxZoom={false}
          className="map-inset-canvas"
        >
          <TileLayer url={TILE_URL} />
          <Layers {...props} inset={true} />
          <Boats {...props} inset={true} />
        </MapContainer>
      </div>
    </div>
  );
}
