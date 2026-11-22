import "leaflet/dist/leaflet.css";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import {
  CHARGER_COLOR,
  NO_SERVICE_COLOR,
  VESSEL_COLOR,
  VESSEL_ORDER,
} from "../colors";
import { t } from "../i18n";
import type {
  ChargerRow,
  FleetRow,
  Lang,
  Port,
  Route,
  VesselType,
} from "../types";

interface Props {
  lang: Lang;
  routes: Route[];
  ports: Port[];
  vesselTypes: VesselType[];
  fleet: FleetRow[];
  chargers: ChargerRow[];
}

export function vesselLabel(
  vesselTypes: VesselType[],
  type: string,
  lang: Lang,
): string {
  const v = vesselTypes.find((x) => x.type === type);
  if (!v) return type;
  return lang === "id" ? v.label_id : v.label_en;
}

export function MapView({
  lang,
  routes,
  ports,
  vesselTypes,
  fleet,
  chargers,
}: Props) {
  const portById = new Map(ports.map((p) => [p.port_id, p]));
  const chargerIds = new Set(chargers.map((c) => c.port_id));
  const usedTypes = VESSEL_ORDER.filter((type) =>
    fleet.some((row) => row.vessel_type === type),
  );

  return (
    <div className="map-wrap">
      <MapContainer
        center={[1.25, 127.55]}
        zoom={8}
        scrollWheelZoom={false}
        className="map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {routes.map((route) => {
          const a = portById.get(route.port_a);
          const b = portById.get(route.port_b);
          if (!a || !b) return null;
          const rows = fleet
            .filter((row) => row.route_id === route.route_id)
            .sort((x, y) => y.daily_trips - x.daily_trips);
          const color = rows.length
            ? VESSEL_COLOR[rows[0].vessel_type]
            : NO_SERVICE_COLOR;
          const mix = rows
            .map(
              (row) =>
                `${row.count}x ${vesselLabel(vesselTypes, row.vessel_type, lang)}`,
            )
            .join(" + ");
          return (
            <Polyline
              key={`${route.route_id}-${mix}`}
              positions={[
                [a.lat, a.lon],
                [b.lat, b.lon],
              ]}
              pathOptions={{ color, weight: 5, opacity: 0.95 }}
            >
              <Tooltip permanent direction="center" className="route-label">
                {mix || t(lang, "none")}
              </Tooltip>
            </Polyline>
          );
        })}
        {ports.map((port) => {
          const hasCharger = chargerIds.has(port.port_id);
          return (
            <CircleMarker
              key={`${port.port_id}-${hasCharger}`}
              center={[port.lat, port.lon]}
              radius={hasCharger ? 10 : 5}
              pathOptions={{
                color: hasCharger ? CHARGER_COLOR : "#0b0b0b",
                weight: hasCharger ? 4 : 2,
                fillColor: "#fcfcfb",
                fillOpacity: 1,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <strong>{port.name}</strong>
                {hasCharger ? ` (${t(lang, "legendCharger")})` : ""}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="legend">
        {usedTypes.map((type) => (
          <span key={type} className="legend-item">
            <span
              className="swatch-line"
              style={{ background: VESSEL_COLOR[type] }}
            />
            {vesselLabel(vesselTypes, type, lang)}
          </span>
        ))}
        <span className="legend-item">
          <span className="swatch-ring" style={{ borderColor: CHARGER_COLOR }} />
          {t(lang, "legendCharger")}
        </span>
      </div>
    </div>
  );
}
