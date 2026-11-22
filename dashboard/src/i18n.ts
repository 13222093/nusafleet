import type { Lang } from "./types";

const STRINGS = {
  tagline: {
    id: "Perencana armada feri dan lokasi pengisian daya untuk Maluku Utara",
    en: "Ferry fleet and charging-site planner for North Maluku",
  },
  navPlan: { id: "Rencana", en: "Plan" },
  navData: { id: "Data & Asumsi", en: "Data & Assumptions" },
  scenario: { id: "Skenario pasokan listrik", en: "Power-supply scenario" },
  plan: { id: "Pilihan rencana", en: "Plan choice" },
  least_cost: { id: "Biaya terendah", en: "Least cost" },
  balanced: { id: "Seimbang", en: "Balanced" },
  lowest_co2: { id: "CO2 terendah", en: "Lowest CO2" },
  today: { id: "Armada saat ini", en: "Today's fleet" },
  estimate: { id: "estimasi", en: "estimate" },
  estimateHint: {
    id: "Angka ini bergantung pada asumsi. Lihat halaman Data & Asumsi.",
    en: "This number depends on assumptions. See the Data & Assumptions page.",
  },
  kpiCost: { id: "Biaya tahunan", en: "Annual cost" },
  kpiCo2: { id: "Emisi CO2 per tahun", en: "CO2 per year" },
  kpiReliability: { id: "Keandalan layanan", en: "Service reliability" },
  kpiCancelled: {
    id: "Pembatalan trip yang dihindari",
    en: "Cancelled trips avoided",
  },
  kpiCapex: { id: "Investasi awal", en: "Upfront investment" },
  kpiChargers: { id: "Pelabuhan pengisian daya", en: "Charging ports" },
  vsToday: { id: "dibanding armada saat ini", en: "vs today's fleet" },
  perYear: { id: "per tahun", en: "per year" },
  none: { id: "tidak ada", en: "none" },
  mapTitle: {
    id: "Peta rute dan jenis kapal yang direkomendasikan",
    en: "Route map and recommended vessel types",
  },
  mapNote: {
    id: "Warna garis: jenis kapal dengan trip terbanyak di rute itu. Arahkan kursor ke rute untuk rinciannya.",
    en: "Line colour: the vessel type with the most trips on that route. Hover a route for details.",
  },
  legendCharger: { id: "Stasiun pengisian daya", en: "Charging station" },
  fleetTable: { id: "Rencana armada per rute", en: "Fleet plan by route" },
  colRoute: { id: "Rute", en: "Route" },
  colVessel: { id: "Jenis kapal", en: "Vessel type" },
  colCount: { id: "Kapal", en: "Vessels" },
  colTrips: { id: "Trip per hari", en: "Trips per day" },
  colOpDays: { id: "Hari layak layar", en: "Operable days" },
  paretoTitle: {
    id: "Biaya vs emisi: berapa harga untuk armada yang lebih bersih",
    en: "Cost vs emissions: what a cleaner fleet costs",
  },
  paretoNote: {
    id: "Setiap titik adalah rencana berbiaya terendah untuk batas CO2 tertentu. Klik titik pada skenario aktif untuk menampilkannya di peta.",
    en: "Each point is the cheapest plan under a given CO2 cap. Click a point on the active scenario to show it on the map.",
  },
  axisCo2: { id: "CO2 (ribu ton per tahun)", en: "CO2 (thousand tonnes per year)" },
  axisCost: { id: "Biaya tahunan (Rp miliar)", en: "Annual cost (Rp bn)" },
  heatTitle: {
    id: "Sensitivitas: harga solar x tarif listrik",
    en: "Sensitivity: diesel price x electricity tariff",
  },
  heatNote: {
    id: "Angka di sel: biaya tahunan rencana termurah (Rp miliar). Tanda petir: porsi trip kapal hibrida atau listrik.",
    en: "Cell value: annual cost of the cheapest plan (Rp bn). Bolt tag: share of trips by hybrid or electric vessels.",
  },
  heatDiesel: { id: "Harga solar (Rp/L)", en: "Diesel price (Rp/L)" },
  heatElec: { id: "Tarif listrik (Rp/kWh)", en: "Electricity tariff (Rp/kWh)" },
  heatLow: { id: "biaya lebih rendah", en: "lower cost" },
  heatHigh: { id: "biaya lebih tinggi", en: "higher cost" },
  tableTitle: { id: "Perbandingan skenario", en: "Scenario comparison" },
  colScenario: { id: "Skenario", en: "Scenario" },
  colFrom: { id: "Tersedia mulai", en: "Available from" },
  colPlug: { id: "Trip hibrida/listrik", en: "Hybrid/electric trips" },
  placeholderWarn: {
    id: "Prototipe: sebagian besar masukan masih berupa asumsi yang terdokumentasi, dan iklim gelombang masih data sementara. Semua hasil adalah estimasi skenario.",
    en: "Prototype: most inputs are still documented assumptions, and the wave climate is placeholder data. All results are scenario estimates.",
  },
  neutral: {
    id: "Model ini netral terhadap pemasok energi: PLN, surya, dan unit pembangkit terapung diuji dengan angka yang sama.",
    en: "The model is supply-neutral: PLN grid, solar and floating power units are tested with the same numbers.",
  },
  dataIntro: {
    id: "Setiap angka di aplikasi ini berasal dari sumber yang tercantum atau dari asumsi di bawah ini.",
    en: "Every number in this app comes from a listed source or from an assumption below.",
  },
  assumptions: { id: "Asumsi model", en: "Model assumptions" },
  datasets: { id: "Tabel data", en: "Data tables" },
  vessels: { id: "Arketipe kapal", en: "Vessel archetypes" },
  routes: { id: "Rute", en: "Routes" },
  colParam: { id: "Parameter", en: "Parameter" },
  colValue: { id: "Nilai", en: "Value" },
  colUnit: { id: "Satuan", en: "Unit" },
  colBasis: { id: "Sumber atau alasan", en: "Source or rationale" },
  colConfidence: { id: "Keyakinan", en: "Confidence" },
  colFile: { id: "Berkas", en: "File" },
  colCap: { id: "Kapasitas (pnp)", en: "Capacity (pax)" },
  colSpeed: { id: "Kecepatan (knot)", en: "Speed (kn)" },
  colHs: { id: "Batas gelombang (m)", en: "Wave limit (m)" },
  colCapex: { id: "Harga (Rp miliar)", en: "Capex (Rp bn)" },
  colSafety: { id: "Skor keselamatan", en: "Safety score" },
  colDistance: { id: "Jarak (nm)", en: "Distance (nm)" },
  colDemand: { id: "Penumpang per hari", en: "Passengers per day" },
  colNotes: { id: "Catatan", en: "Notes" },
  attribution: {
    id: "Mesin optimasi diadaptasi dari tim Kopibara (NUS Maritime Hackathon 2026), lisensi MIT.",
    en: "Optimization engine adapted from team Kopibara (NUS Maritime Hackathon 2026), MIT license.",
  },
  mixTitle: { id: "Armada menurut jenis kapal", en: "Fleet by vessel type" },
  fleetSub: {
    id: "Jumlah kapal dan trip harian per rute untuk rencana yang dipilih.",
    en: "Vessels and daily trips per route for the selected plan.",
  },
  heatCorner: { id: "Solar \\ Listrik", en: "Diesel \\ Electricity" },
  heatAxes: {
    id: "Sumbu X: tarif listrik (Rp/kWh) | Sumbu Y: harga solar (Rp/L)",
    en: "X-axis: electricity tariff (Rp/kWh) | Y-axis: diesel price (Rp/L)",
  },
  carbonTitle: { id: "Sensitivitas harga karbon", en: "Carbon price sensitivity" },
  carbonNote: {
    id: "Biaya tahunan rencana termurah pada tiap harga karbon.",
    en: "Annual cost of the cheapest plan at each carbon price.",
  },
  axisCarbon: {
    id: "Harga karbon (Rp juta per ton CO2)",
    en: "Carbon price (Rp million per tonne CO2)",
  },
  perTonne: { id: "juta per ton CO2", en: "million per tonne CO2" },
  colCo2Delta: { id: "CO2 vs saat ini", en: "CO2 vs today" },
  headline: {
    id: "Kapal mana di rute mana, dan di mana mengisi dayanya",
    en: "Which vessel on which route, and where to charge it",
  },
  heroLead: {
    id: "Dibanding armada saat ini, rencana ini berarti:",
    en: "Compared with today's fleet, this plan means:",
  },
  heroCheaper: { id: "lebih hemat per tahun", en: "saved per year" },
  heroCostlier: { id: "lebih mahal per tahun", en: "more per year" },
  heroCo2Less: { id: "lebih sedikit per tahun", en: "less per year" },
  heroCo2More: { id: "lebih banyak per tahun", en: "more per year" },
  heroTripsAvoided: {
    id: "tidak batal karena gelombang, per tahun",
    en: "not cancelled by waves, per year",
  },
  heroTripsMore: {
    id: "tambahan batal karena gelombang, per tahun",
    en: "more cancelled by waves, per year",
  },
  trips: { id: "trip", en: "trips" },
  todayShort: { id: "Saat ini", en: "Today" },
  planShort: { id: "Rencana", en: "Plan" },
  insetTitle: { id: "Ternate, Tidore, Sofifi", en: "Ternate, Tidore, Sofifi" },
  legendWidth: {
    id: "Tebal garis: penumpang per hari",
    en: "Line width: passengers per day",
  },
  paxPerDay: { id: "penumpang per hari", en: "passengers per day" },
  exploreTitle: { id: "Jelajahi analisisnya", en: "Explore the analysis" },
  loading: { id: "Memuat data...", en: "Loading data..." },
  loadError: {
    id: "Data tidak ditemukan. Jalankan `uv run python main.py` terlebih dahulu.",
    en: "Data not found. Run `uv run python main.py` first.",
  },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(lang: Lang, key: StringKey): string {
  return STRINGS[key][lang];
}

const LOCALE: Record<Lang, string> = { id: "id-ID", en: "en-GB" };

export function num(lang: Lang, value: number, digits = 0): string {
  return value.toLocaleString(LOCALE[lang], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Rupiah in billions: "Rp 70,2 miliar" / "Rp 70.2 bn". */
export function rpBn(lang: Lang, rp: number, digits = 1): string {
  const unit = lang === "id" ? "miliar" : "bn";
  return `Rp ${num(lang, rp / 1e9, digits)} ${unit}`;
}

export function signed(lang: Lang, value: number, digits = 0): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${num(lang, Math.abs(value), digits)}`;
}
