// Indonesia-Russia cooperation context, and the vessel requirement sheet that
// turns a fleet plan into something a shipyard partner can work from.
//
// The dated facts below come from the team's research notes (PITCH_CONTEXT.md,
// collected from news and official statements in November 2026). They are shown
// with a "to be verified" note until someone re-checks each against its source.
import type { Lang, ParetoPoint, Route, VesselType } from './types';

type Text = Record<Lang, string>;

export interface CoopEvent {
  /** Used to light the event up once the selected scenario year has reached it. */
  year: number;
  when: Text;
  short: Text;
  text: Text;
}

export const COOP_EVENTS: CoopEvent[] = [
  {
    year: 2025,
    when: { id: 'Nov 2025', en: 'Nov 2025' },
    short: { id: 'MoU maritim sipil', en: 'Civil maritime MoU' },
    text: {
      id: 'Indonesia dan Rusia menandatangani nota kesepahaman maritim sipil di Jakarta, mencakup antara lain kapasitas angkutan laut, pelabuhan hijau, perkapalan, dan pendidikan maritim.',
      en: 'Indonesia and Russia sign a civil maritime memorandum of understanding in Jakarta, covering among others sea transport capacity, green ports, shipbuilding and maritime education.',
    },
  },
  {
    year: 2026,
    when: { id: 'Jun 2026', en: 'Jun 2026' },
    short: { id: 'Kelompok kerja', en: 'Working groups' },
    text: {
      id: 'Tiga kelompok kerja dibentuk. Kelompok perkapalan, pelabuhan, dan logistik menawarkan perkapalan hijau dan efisiensi energi. Kelompok riset menangani penelitian bersama dan pelatihan SDM.',
      en: 'Three working groups are formed. The shipbuilding, ports and logistics group offers green shipbuilding and energy efficiency. The research group covers joint research and training.',
    },
  },
  {
    year: 2026,
    when: { id: 'Okt 2026', en: 'Oct 2026' },
    short: { id: 'Kesepakatan listrik', en: 'Power agreement' },
    text: {
      id: 'Kesepakatan pasokan listrik dari dua unit pembangkit terapung (2 x 100 MW) untuk Halmahera Utara, dengan listrik diperkirakan sampai ke pelanggan dalam sekitar lima tahun.',
      en: 'Agreement to supply electricity from two floating power units (2 x 100 MW) for Halmahera Utara, with power expected to reach consumers in about five years.',
    },
  },
  {
    year: 2031,
    when: { id: '2031', en: '2031' },
    short: { id: 'Pasokan baru', en: 'New supply' },
    text: {
      id: 'Perkiraan tahun pasokan baru tersedia di Halmahera Utara. Di NusaFleet ini adalah satu dari tiga skenario pasokan, diuji dengan angka yang sama dengan dua lainnya.',
      en: 'The year the new supply is expected in Halmahera Utara. In NusaFleet this is one of three supply scenarios, tested with the same numbers as the other two.',
    },
  },
];

export const COOP_SOURCE: Text = {
  id: 'Sumber: catatan riset tim dari pemberitaan dan pernyataan resmi (November 2026). Perlu diverifikasi ulang sebelum dipublikasikan.',
  en: 'Source: the team\'s research notes from news and official statements (November 2026). To be re-verified before publication.',
};

/** One line of the requirement sheet: what a new vessel on this route has to do. */
export interface SpecRow {
  routeId: string;
  routeName: string;
  vesselType: string;
  count: number;
  capacityPax: number;
  speedKn: number;
  dailyTrips: number;
  distanceNm: number;
  /** Minimum battery range for a battery-only vessel, given where it can charge. */
  minRangeNm: number | null;
  waveLimitM: number;
  chargeKw: number | null;
  plugsIn: boolean;
}

/**
 * Requirement sheet for the new vessels in a plan. Existing ferries are left
 * out: nothing needs to be built for them.
 */
export function vesselSpecs(routes: Route[], plan: ParetoPoint, vesselTypes: VesselType[]): SpecRow[] {
  const chargerPorts = new Set(plan.chargers.map((c) => c.port_id));
  const rows: SpecRow[] = [];
  routes.forEach((route) => {
    plan.fleet_plan
      .filter((r) => r.route_id === route.route_id && r.vessel_type !== 'diesel_old')
      .forEach((r) => {
        const v = vesselTypes.find((x) => x.type === r.vessel_type);
        if (!v) return;
        const plugsIn = v.kwh_per_nm > 0;
        const batteryOnly = plugsIn && v.fuel_lph === 0;
        const bothEnds = chargerPorts.has(route.port_a) && chargerPorts.has(route.port_b);
        rows.push({
          routeId: route.route_id,
          routeName: route.name.replace(/ \([^)]*\)/g, ''),
          vesselType: r.vessel_type,
          count: r.count,
          capacityPax: v.cap_pax,
          speedKn: v.speed_kn,
          dailyTrips: r.daily_trips,
          distanceNm: route.distance_nm,
          // Charging at both ends needs one crossing of range, at one end a round trip
          minRangeNm: batteryOnly ? (bothEnds ? route.distance_nm : 2 * route.distance_nm) : null,
          waveLimitM: v.hs_max_m,
          chargeKw: plugsIn ? v.charge_kw : null,
          plugsIn,
        });
      });
  });
  return rows;
}
