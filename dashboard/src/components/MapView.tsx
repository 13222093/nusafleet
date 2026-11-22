import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Polyline, Rectangle, TileLayer, Tooltip } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';

import { CHARGER_COLOR, NO_SERVICE_COLOR, VESSEL_COLOR, VESSEL_COLOR_MAP, VESSEL_ORDER } from '../colors';
import { num, t } from '../i18n';
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
}

type LatLon = [number, number];

// The three ports around Ternate sit within a few miles of each other, so the
// main map cannot show them apart. They get their own zoomed inset.
const INSET_BOUNDS: [LatLon, LatLon] = [
  [0.66, 127.2],
  [0.85, 127.64],
];
// Extra sea to the south leaves room for the inset without covering a route
const MAIN_BOUNDS: LatLngBoundsExpression = [
  [-0.2, 126.15],
  [2.3, 128.6],
];
// Standard OpenStreetMap tiles, darkened with a CSS filter (see index.css)
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
// Where each port name sits, chosen so names do not collide with routes
type Side = 'left' | 'right' | 'top' | 'bottom';
const LABEL_SIDE: Record<string, Side> = { TTE: 'left', TID: 'bottom', SOF: 'right', BTD: 'top', JAI: 'right', TOB: 'left', DAR: 'right' };
const INSET_LABEL_SIDE: Record<string, Side> = { TTE: 'left', TID: 'left', SOF: 'bottom' };
// In the inset the two short routes are labelled away from each other
const INSET_ROUTE_SIDE: Record<string, Side> = { TTE_TID: 'bottom', TTE_SOF: 'top' };
const OFFSET: Record<Side, [number, number]> = { left: [-10, 0], right: [10, 0], top: [0, -10], bottom: [0, 10] };

export function vesselLabel(vesselTypes: VesselType[], type: string, lang: Lang): string {
  const v = vesselTypes.find((x) => x.type === type);
  if (!v) return type;
  return lang === 'id' ? v.label_id : v.label_en;
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

function Layers({ lang, routes, ports, vesselTypes, fleet, chargers, inset, selectedRouteId, onRouteClick }: Props & { inset: boolean }) {
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
        const mix = rows.map((row) => `${row.count}x ${vesselLabel(vesselTypes, row.vessel_type, lang)}`).join(' + ') || t(lang, 'none');
        const path = arc([a.lat, a.lon], [b.lat, b.lon], i % 2 === 0 ? 0.16 : -0.16);
        const weight = 3 + 7 * Math.sqrt(route.daily_pax / maxPax);
        const mid = path[Math.floor(path.length / 2)];
        // Short local routes are labelled in the inset only, long ones in the main map only
        const showLabel = inset ? local : !local;
        return (
          <span key={`${route.route_id}-${mix}-${inset}-${route.route_id === selectedRouteId}`}>
            <Polyline
              positions={path}
              pathOptions={{ color: route.route_id === selectedRouteId ? '#ffffff' : '#041418', weight: weight + (route.route_id === selectedRouteId ? 8 : 5), opacity: 0.9, lineCap: 'round' }}
              interactive={false}
            />
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
                <Tooltip permanent direction={inset ? (INSET_ROUTE_SIDE[route.route_id] ?? 'center') : 'center'} offset={inset ? OFFSET[INSET_ROUTE_SIDE[route.route_id] ?? 'top'] : [0, 0]} className="route-label">
                  <span className="route-dot" style={{ background: color }} />
                  {mix}
                </Tooltip>
              </CircleMarker>
            ) : null}
          </span>
        );
      })}
      {ports.map((port) => {
        const hasCharger = chargerIds.has(port.port_id);
        const local = inInset(port);
        // In the main map only Ternate is named inside the cluster; the inset names all three
        const showName = inset ? local : !local || port.port_id === 'TTE';
        if (inset && !local) return null;
        const side: Side = (inset ? INSET_LABEL_SIDE[port.port_id] : LABEL_SIDE[port.port_id]) ?? 'right';
        return (
          <CircleMarker
            key={`${port.port_id}-${hasCharger}-${inset}`}
            center={[port.lat, port.lon]}
            radius={hasCharger ? 9 : 5}
            pathOptions={{ color: hasCharger ? CHARGER_COLOR : '#ffffff', weight: hasCharger ? 4 : 2, fillColor: hasCharger ? '#ffffff' : '#0b2a30', fillOpacity: 1 }}
            className={hasCharger ? 'charger-port' : undefined}
          >
            {showName ? (
              <Tooltip permanent direction={side} offset={OFFSET[side]} className="port-label">
                {hasCharger ? '⚡ ' : ''}
                {inset ? port.name.split(' (')[0] : port.name}
              </Tooltip>
            ) : null}
          </CircleMarker>
        );
      })}
    </>
  );
}

export function MapView(props: Props) {
  const { lang, vesselTypes, fleet } = props;
  const usedTypes = VESSEL_ORDER.filter((type) => fleet.some((row) => row.vessel_type === type));

  return (
    <div className="map-wrap">
      <div className="map-stage">
        <MapContainer bounds={MAIN_BOUNDS} scrollWheelZoom={false} zoomSnap={0.25} className="map">
          <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
          <Rectangle bounds={INSET_BOUNDS} pathOptions={{ color: '#9fe0d6', weight: 1.5, dashArray: '4 4', fill: false }} interactive={false} />
          <Layers {...props} inset={false} />
        </MapContainer>

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
          </MapContainer>
        </div>
      </div>

      <div className="legend">
        {usedTypes.map((type) => (
          <span key={type} className="legend-item">
            <span className="swatch-line" style={{ background: VESSEL_COLOR[type] }} />
            {vesselLabel(vesselTypes, type, lang)}
          </span>
        ))}
        <span className="legend-item">
          <span className="swatch-ring" style={{ borderColor: CHARGER_COLOR }} />
          {t(lang, 'legendCharger')}
        </span>
        <span className="legend-item">
          <span className="swatch-thin" />
          <span className="swatch-thick" />
          {t(lang, 'legendWidth')}
        </span>
      </div>
    </div>
  );
}
