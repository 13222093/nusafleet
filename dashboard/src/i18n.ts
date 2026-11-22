import type { Lang } from "./types";

const STRINGS = {
  tagline: {
    id: "Perencana armada feri dan lokasi pengisian daya untuk Maluku Utara",
    en: "Ferry fleet and charging-site planner for North Maluku",
  },
  navPlan: { id: "Rencana", en: "Plan" },
  navData: {
    id: "Data & asumsi",
    en: "Data & assumptions",
  },
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
    id: "Warna garis: jenis kapal dengan trip terbanyak di rute itu. Klik rute untuk melihat rinciannya.",
    en: "Line colour: the vessel type with the most trips on that route. Click a route to see its details.",
  },
  legendCharger: {
    id: "Stasiun pengisian",
    en: "Charging station",
  },
  fleetTable: { id: "Rencana armada per rute", en: "Fleet plan by route" },
  colRoute: { id: "Rute", en: "Route" },
  colVessel: { id: "Jenis kapal", en: "Vessel type" },
  colCount: { id: "Kapal", en: "Vessels" },
  colTrips: { id: "Trip per hari", en: "Trips per day" },
  colOpDays: { id: "Hari layak layar", en: "Operable days" },
  paretoTitle: {
    id: "Biaya vs emisi",
    en: "Cost vs emissions",
  },
  paretoNote: {
    id: "Tiap titik: rencana termurah untuk satu batas CO2. Klik titik untuk menampilkannya di peta.",
    en: "Each point: the cheapest plan under one CO2 cap. Click a point to show it on the map.",
  },
  axisCo2: { id: "CO2 (ribu ton per tahun)", en: "CO2 (thousand tonnes per year)" },
  axisCost: { id: "Biaya tahunan (Rp miliar)", en: "Annual cost (Rp bn)" },
  heatTitle: {
    id: "Kapan kapal listrik layak?",
    en: "When do electric vessels pay off?",
  },
  heatNote: {
    id: "Biaya tahunan rencana termurah (Rp miliar) pada tiap harga solar dan tarif listrik.",
    en: "Annual cost of the cheapest plan (Rp bn) at each diesel price and electricity tariff.",
  },
  heatDiesel: { id: "Harga solar (Rp/L)", en: "Diesel price (Rp/L)" },
  heatElec: { id: "Tarif listrik (Rp/kWh)", en: "Electricity tariff (Rp/kWh)" },
  heatLow: { id: "biaya lebih rendah", en: "lower cost" },
  heatHigh: { id: "biaya lebih tinggi", en: "higher cost" },
  tableTitle: {
    id: "Perbandingan skenario",
    en: "Scenario comparison",
  },
  colScenario: { id: "Skenario", en: "Scenario" },
  colFrom: { id: "Tersedia mulai", en: "Available from" },
  colPlug: {
    id: "Trip hibrida atau listrik",
    en: "Hybrid or electric trips",
  },
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
    id: "Kolom: tarif listrik (Rp/kWh). Baris: harga solar (Rp/L).",
    en: "Columns: electricity tariff (Rp/kWh). Rows: diesel price (Rp/L).",
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
  colCo2Delta: {
    id: "CO2 vs saat ini",
    en: "CO2 vs today",
  },
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
    id: "trip tambahan batal per tahun",
    en: "more trips cancelled per year",
  },
  trips: { id: "trip", en: "trips" },
  navReport: { id: "Laporan", en: "Report" },
  tabAnalysis: { id: "Analisis", en: "Analysis" },
  tabAlts: { id: "Alternatif", en: "Alternatives" },
  saveAlt: { id: "Simpan alternatif", en: "Save alternative" },
  savedAlt: { id: "Tersimpan", en: "Saved" },
  makeReport: { id: "Buat laporan", en: "Create report" },
  altTitle: { id: "Alternatif tersimpan", en: "Saved alternatives" },
  altEmpty: {
    id: "Belum ada. Atur skenario, prioritas, atau simulasi harga, lalu tekan Simpan alternatif untuk membandingkannya di sini dan di laporan.",
    en: "None yet. Set a scenario, a priority or a price simulation, then press Save alternative to compare it here and in the report.",
  },
  altCost: { id: "Rp miliar/thn", en: "Rp bn/yr" },
  altTrips: { id: "trip tidak batal", en: "trips kept" },
  recTitle: { id: "Rekomendasi", en: "Recommendation" },
  recRuleNoRegret: {
    id: "Rencana terbersih yang tidak lebih mahal dari armada saat ini.",
    en: "The cleanest plan that costs no more than the fleet today.",
  },
  recRuleCheapest: {
    id: "Tidak ada rencana yang lebih murah dari armada saat ini, jadi ini rencana termurah.",
    en: "No plan is cheaper than the fleet today, so this is the cheapest plan.",
  },
  remove: { id: "Hapus", en: "Remove" },
  resetView: { id: "Kembali ke tampilan awal", en: "Reset the view" },
  zoomHint: { id: "Scroll untuk zoom, klik rute untuk rincian", en: "Scroll to zoom, click a route for details" },
  rowCost: { id: "Biaya per tahun (Rp miliar)", en: "Cost per year (Rp bn)" },
  rowCo2: { id: "CO2 per tahun (ton)", en: "CO2 per year (tonnes)" },
  tabFleet: { id: "Armada", en: "Fleet" },
  tabPareto: { id: "Biaya vs emisi", en: "Cost vs emissions" },
  tabHeat: { id: "Sensitivitas", en: "Sensitivity" },
  tabCompare: { id: "Skenario", en: "Scenarios" },
  tabWhatIf: { id: "Simulasi", en: "What if" },
  detailTabs: { id: "Rincian", en: "Details" },
  kpiVs: { id: "Dibanding armada saat ini", en: "Compared with today's fleet" },
  kpiCostLabel: { id: "biaya per tahun", en: "cost per year" },
  kpiCo2Label: { id: "CO2 per tahun", en: "CO2 per year" },
  kpiTripsLabel: { id: "trip tidak batal per tahun", en: "trips not cancelled per year" },
  totalCost: { id: "Biaya total", en: "Total cost" },
  stationsShort: { id: "Stasiun pengisian", en: "Charging stations" },
  stations: { id: "stasiun", en: "stations" },
  play: { id: "Putar 2026 ke 2031", en: "Play 2026 to 2031" },
  pause: { id: "Jeda", en: "Pause" },
  hintClick: { id: "Klik rute untuk rincian", en: "Click a route for details" },
  legendWide: { id: "Garis lebih tebal = penumpang lebih banyak", en: "Thicker line = more passengers" },
  fleetTitle: { id: "Armada: saat ini ke rencana", en: "Fleet: today to plan" },
  tripsPerDay: { id: "trip/hari", en: "trips/day" },
  safetyAvg: { id: "Skor keselamatan rata-rata", en: "Average safety score" },
  unchanged: { id: "Tidak berubah dari armada saat ini.", en: "No change from today's fleet." },
  notUsed: { id: "Tidak dipakai rute ini", en: "Not used by this route" },
  heatFlat: {
    id: "Pada skenario ini tarif listrik tidak mengubah rencana termurah, jadi hanya harga solar yang ditampilkan.",
    en: "In this scenario the electricity tariff does not change the cheapest plan, so only the diesel price is shown.",
  },
  whatIfShort: { id: "Geser harga, rencana dan peta ikut berubah.", en: "Move a price, the plan and map follow." },
  rowTrips: { id: "Trip batal dihindari per tahun", en: "Cancelled trips avoided per year" },
  vOld: { id: "diesel lama", en: "old diesel" },
  vNew: { id: "diesel baru", en: "new diesel" },
  vHybrid: { id: "hibrida", en: "hybrid" },
  vElectric: { id: "listrik", en: "electric" },
  vFast: { id: "kapal cepat", en: "fast craft" },
  ctlSupply: { id: "Pasokan listrik", en: "Power supply" },
  ctlPriority: { id: "Prioritas armada", en: "Fleet priority" },
  cheapest: { id: "Termurah", en: "Cheapest" },
  cleanest: { id: "Terbersih", en: "Cleanest" },
  shortGrid: { id: "PLN saat ini", en: "PLN grid" },
  shortSolar: { id: "PLN + surya", en: "Grid + solar" },
  shortFloating: { id: "Pembangkit terapung", en: "Floating power unit" },
  statRoutes: { id: "rute", en: "routes" },
  statPax: { id: "penumpang per hari", en: "passengers per day" },
  statFleet: { id: "kapal saat ini", en: "vessels today" },
  whatIfTitle: { id: "Bagaimana jika harga berubah?", en: "What if prices change?" },
  whatIfSub: {
    id: "Geser harga, model menghitung ulang rencana termurah. Peta dan angka di atas ikut berubah.",
    en: "Move a price and the model re-solves the cheapest plan. The map and numbers above follow.",
  },
  wiDiesel: { id: "Harga solar", en: "Diesel price" },
  wiElec: { id: "Tarif listrik", en: "Electricity tariff" },
  wiCarbon: { id: "Harga karbon", en: "Carbon price" },
  wiReset: { id: "Kembalikan", en: "Reset" },
  wiLive: { id: "Simulasi langsung", en: "Live simulation" },
  wiLoading: { id: "Menghitung...", en: "Solving..." },
  wiDefault: { id: "asumsi dasar", en: "base assumption" },
  wiOffline: {
    id: "API perhitungan tidak aktif, jadi slider ini dimatikan. Jalankan:",
    en: "The solver API is not running, so these sliders are disabled. Start it with:",
  },
  liveTitle: { id: "Simulasi langsung, biaya terendah", en: "Live simulation, least cost" },
  customPlan: { id: "Rencana antara", en: "In-between plan" },
  ambition: { id: "Seberapa bersih armadanya? Geser untuk mencoba", en: "How clean should the fleet be? Drag to explore" },
  showOnMap: { id: "Tampilkan di peta", en: "Show on map" },
  cancelledPerYear: { id: "Trip batal karena gelombang, per tahun", en: "Trips cancelled by waves, per year" },
  chargersHere: {
    id: "Stasiun pengisian di rute ini",
    en: "Charging stations on this route",
  },
  dataNote: { id: "Catatan data", en: "Data note" },
  close: { id: "Tutup", en: "Close" },
  todayShort: { id: "Saat ini", en: "Today" },
  planShort: { id: "Rencana", en: "Plan" },
  insetTitle: { id: "Ternate, Tidore, Sofifi", en: "Ternate, Tidore, Sofifi" },
  legendWidth: {
    id: "Tebal garis: penumpang per hari",
    en: "Line width: passengers per day",
  },
  paxPerDay: { id: "penumpang per hari", en: "passengers per day" },
  exploreTitle: {
    id: "Jelajahi analisisnya",
    en: "Explore the analysis",
  },
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
