// Printable report: summary, the recommendation for each supply scenario (same
// rule for all three), saved alternatives, findings, key assumptions and limits.
// "Cetak / simpan PDF" uses the browser's print dialog.
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { ArrowLeft, Printer } from 'lucide-react';
import type { ReactNode } from 'react';

import { num, rpBn, t } from '../i18n';
import { recommend, routeChanges, tripsAvoided } from '../recommend';
import type { Alternative } from '../recommend';
import type { FleetRow, Kpis, Lang, ParetoPoint, ScenarioResult, Summary } from '../types';
import { scenarioShort } from './Controls';
import { vesselShort } from './MapView';

interface Props {
  lang: Lang;
  summary: Summary;
  results: Record<string, ScenarioResult>;
  alts: Alternative[];
  onBack: () => void;
}

const COPY = {
  id: {
    title: 'Laporan rencana armada feri Maluku Utara',
    sub: 'Dibuat dengan NusaFleet. Semua angka adalah estimasi skenario yang bergantung pada asumsi di bagian 5.',
    print: 'Cetak / simpan PDF',
    back: 'Kembali ke rencana',
    s1: '1. Ringkasan',
    s1a: (routes: number, pax: string, fleet: number, cost: string, co2: string, rel: string) =>
      `Kajian ini mencakup ${routes} rute dengan sekitar ${pax} penumpang per hari. Armada saat ini berjumlah ${fleet} feri diesel, dengan biaya ${cost} per tahun, emisi ${co2} ton CO2 per tahun, dan keandalan layanan ${rel}%.`,
    s1b: 'Untuk tiap skenario pasokan listrik, model memilih jumlah dan jenis kapal per rute serta lokasi stasiun pengisian dengan biaya tahunan terendah, dengan batas permintaan penumpang, jangkauan baterai, batas gelombang, daya pelabuhan, anggaran, dan skor keselamatan armada.',
    s2: '2. Rekomendasi per skenario pasokan listrik',
    s2note: 'Aturan yang sama dipakai untuk ketiga skenario: rencana terbersih yang biaya tahunannya tidak melebihi armada saat ini. Jika tidak ada, dipilih rencana termurah. Laporan ini tidak merekomendasikan satu pemasok energi di atas yang lain.',
    ruleNoRegret: 'Rencana terbersih yang tidak lebih mahal dari armada saat ini.',
    ruleCheapest: 'Tidak ada rencana yang lebih murah dari armada saat ini, jadi ditampilkan rencana termurah.',
    from: 'tersedia mulai',
    cost: 'Biaya per tahun',
    co2: 'CO2 per tahun',
    trips: 'Trip batal dihindari',
    capex: 'Investasi awal',
    stations: 'Stasiun pengisian',
    perYear: 'per tahun',
    vsToday: 'vs saat ini',
    route: 'Rute',
    today: 'Saat ini',
    plan: 'Rencana',
    cancelled: 'Trip batal per tahun',
    same: 'tetap',
    none: 'tidak ada',
    s3: '3. Alternatif yang disimpan',
    s3empty: 'Belum ada alternatif yang disimpan. Simpan alternatif dari halaman Rencana untuk memasukkannya ke laporan.',
    alt: 'Alternatif',
    s4: '4. Temuan',
    f1: (name: string, pct: string, cost: string) => `${name}: rencana terbersih memangkas CO2 ${pct}% dibanding armada saat ini, dengan biaya ${cost} per tahun.`,
    f2: (name: string) => `${name}: rencana terbersih tidak memakai kapal listrik atau hibrida. Listrik pada skenario ini beremisi tinggi, sehingga elektrifikasi tidak menurunkan emisi.`,
    f3: (ports: string) => `Stasiun pengisian yang muncul di rekomendasi: ${ports}.`,
    f3none: 'Tidak ada rekomendasi yang membutuhkan stasiun pengisian. Kapal listrik dan hibrida baru muncul jika emisi dibatasi lebih ketat atau harga berubah.',
    f4: 'Mengganti feri diesel lama dengan feri diesel baru sudah menurunkan biaya bahan bakar dan emisi di semua skenario, tanpa bergantung pada pasokan listrik.',
    s5: '5. Asumsi utama',
    param: 'Parameter',
    value: 'Nilai',
    basis: 'Sumber atau alasan',
    conf: 'Keyakinan',
    wave: 'Iklim gelombang masih data sementara (pola musiman perkiraan), belum dari reanalisis.',
    s6: '6. Keterbatasan dan langkah berikutnya',
    limits: [
      'Permintaan penumpang, jarak rute, parameter kapal, daya pelabuhan, dan harga masih berupa estimasi. Ganti dengan data BPS, BPTD, ASDP, dan PLN.',
      'Jenis kapal adalah arketipe berparameter, bukan desain. Kendaraan belum dimodelkan, hanya penumpang.',
      'Model satu periode: belum ada penjadwalan investasi bertahap dari tahun ke tahun.',
      'Ganti iklim gelombang sementara dengan data Copernicus Marine atau ERA5 sebelum hasil dipakai untuk keputusan.',
    ],
    footer: 'Model ini netral terhadap pemasok energi: PLN, surya, dan unit pembangkit terapung diuji dengan angka yang sama. Mesin optimasi diadaptasi dari tim Kopibara (NUS Maritime Hackathon 2026), lisensi MIT.',
  },
  en: {
    title: 'North Maluku ferry fleet plan: report',
    sub: 'Produced with NusaFleet. All figures are scenario estimates that depend on the assumptions in section 5.',
    print: 'Print / save as PDF',
    back: 'Back to the plan',
    s1: '1. Summary',
    s1a: (routes: number, pax: string, fleet: number, cost: string, co2: string, rel: string) =>
      `This study covers ${routes} routes carrying about ${pax} passengers per day. Today's fleet is ${fleet} diesel ferries, costing ${cost} per year, emitting ${co2} tonnes of CO2 per year, with ${rel}% service reliability.`,
    s1b: 'For each power-supply scenario the model chooses the number and type of vessels per route and the charging sites at the lowest annual cost, subject to passenger demand, battery range, wave limits, port power, budget and a fleet safety score.',
    s2: '2. Recommendation per power-supply scenario',
    s2note: 'The same rule is applied to all three scenarios: the cleanest plan whose annual cost does not exceed today\'s fleet. If none exists, the cheapest plan is shown. This report does not recommend one energy supplier over another.',
    ruleNoRegret: 'The cleanest plan that costs no more than today\'s fleet.',
    ruleCheapest: 'No plan is cheaper than today\'s fleet, so the cheapest plan is shown.',
    from: 'available from',
    cost: 'Cost per year',
    co2: 'CO2 per year',
    trips: 'Cancelled trips avoided',
    capex: 'Upfront investment',
    stations: 'Charging stations',
    perYear: 'per year',
    vsToday: 'vs today',
    route: 'Route',
    today: 'Today',
    plan: 'Plan',
    cancelled: 'Cancelled trips per year',
    same: 'unchanged',
    none: 'none',
    s3: '3. Saved alternatives',
    s3empty: 'No alternatives saved yet. Save alternatives on the Plan page to include them here.',
    alt: 'Alternative',
    s4: '4. Findings',
    f1: (name: string, pct: string, cost: string) => `${name}: the cleanest plan cuts CO2 by ${pct}% against today's fleet, at ${cost} per year.`,
    f2: (name: string) => `${name}: the cleanest plan uses no electric or hybrid vessels. Electricity in this scenario is carbon-intensive, so electrification does not lower emissions.`,
    f3: (ports: string) => `Charging stations that appear in the recommendations: ${ports}.`,
    f3none: 'No recommendation needs a charging station. Electric and hybrid vessels only appear when emissions are capped more tightly or prices change.',
    f4: 'Replacing old diesel ferries with new diesel ferries already lowers fuel cost and emissions in every scenario, independent of the power supply.',
    s5: '5. Key assumptions',
    param: 'Parameter',
    value: 'Value',
    basis: 'Source or rationale',
    conf: 'Confidence',
    wave: 'The wave climate is still placeholder data (an assumed seasonal pattern), not reanalysis.',
    s6: '6. Limitations and next steps',
    limits: [
      'Passenger demand, route distances, vessel parameters, port power and prices are estimates. Replace them with BPS, BPTD, ASDP and PLN data.',
      'Vessel types are parameterized archetypes, not designs. Vehicles are not modeled, only passengers.',
      'Single-period model: no phased investment schedule over the years.',
      'Replace the placeholder wave climate with Copernicus Marine or ERA5 data before the results are used for decisions.',
    ],
    footer: 'The model is supply-neutral: PLN grid, solar and floating power units are tested with the same numbers. Optimization engine adapted from team Kopibara (NUS Maritime Hackathon 2026), MIT license.',
  },
} as const;

const KEY_ASSUMPTIONS = ['diesel_price_rp_per_l', 'carbon_price_rp_per_tco2', 'discount_rate', 'budget_rp', 'min_avg_safety', 'service_level', 'load_factor', 'operating_hours_per_day'];

const th = { textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#51676a', padding: '6px 10px 6px 0', borderBottom: '1.5px solid #0c2a2e', verticalAlign: 'bottom' } as const;
const td = { fontSize: '0.85rem', padding: '7px 10px 7px 0', borderBottom: '1px solid #dde6e4', verticalAlign: 'top', lineHeight: 1.4 } as const;
const tdNum = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const;
const thNum = { ...th, textAlign: 'right' } as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ mt: 4, breakInside: 'avoid-page' }}>
      <Typography component="h2" sx={{ fontSize: '1.15rem', fontWeight: 700, mb: 1.25 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

const P = ({ children }: { children: ReactNode }) => <Typography sx={{ fontSize: '0.92rem', lineHeight: 1.6, mb: 1 }}>{children}</Typography>;

export function ReportPage({ lang, summary, results, alts, onBack }: Props) {
  const c = COPY[lang];
  const ids = summary.scenario_ids;
  const first = results[ids[0]];
  const base = first.baseline.kpis;
  const signed = (v: number, digits = 0) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${num(lang, Math.abs(v), digits)}`;
  const mix = (rows: FleetRow[]) => rows.map((r) => `${r.count} ${vesselShort(r.vessel_type, lang)}`).join(' + ') || c.none;
  const scenarioName = (id: string) => {
    const s = results[id].scenario;
    return `${s.available_from_year} ${scenarioShort(id, lang, lang === 'id' ? s.label_id : s.label_en)}`;
  };
  const stationNames = (p: ParetoPoint) => (p.chargers.length ? p.chargers.map((x) => x.port_name.split(' (')[0]).join(', ') : c.none);
  const recs = ids.map((id) => ({ id, rec: recommend(results[id]) }));

  const facts = (p: ParetoPoint, b: Kpis): [string, string][] => [
    [c.cost, `${rpBn(lang, p.cost_rp)} (${signed((p.cost_rp - b.annual_cost_rp) / 1e9, 1)} ${c.vsToday})`],
    [c.co2, `${num(lang, p.co2_t)} t (${signed((100 * (p.co2_t - b.co2_t)) / b.co2_t)}%)`],
    [c.trips, `${signed(tripsAvoided(p, b))} ${c.perYear}`],
    [c.capex, rpBn(lang, p.capex_rp, 0)],
    [c.stations, stationNames(p)],
  ];

  const findings: string[] = [];
  ids.forEach((id) => {
    const cleanest = results[id].pareto[results[id].pareto.length - 1];
    const b = results[id].baseline.kpis;
    findings.push(c.f1(scenarioName(id), num(lang, Math.abs((100 * (cleanest.co2_t - b.co2_t)) / b.co2_t)), rpBn(lang, cleanest.cost_rp)));
    if (cleanest.plug_in_trip_share_pct === 0) findings.push(c.f2(scenarioName(id)));
  });
  const recPorts = [...new Set(recs.flatMap(({ rec }) => rec.point.chargers.map((x) => x.port_name.split(' (')[0])))];
  findings.push(recPorts.length ? c.f3(recPorts.join(', ')) : c.f3none);
  findings.push(c.f4);

  const button = { height: 36, px: 2, gap: 0.75, borderRadius: '999px', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700 } as const;

  return (
    <Box>
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 2, maxWidth: 860, mx: 'auto' }}>
        <ButtonBase onClick={onBack} sx={{ ...button, border: '1px solid #dde6e4', bgcolor: '#ffffff' }}>
          <ArrowLeft size={16} />
          {c.back}
        </ButtonBase>
        <ButtonBase onClick={() => window.print()} sx={{ ...button, bgcolor: '#06252b', color: '#ffffff' }}>
          <Printer size={16} />
          {c.print}
        </ButtonBase>
      </Box>

      <Box className="report" sx={{ maxWidth: 860, mx: 'auto', bgcolor: '#ffffff', border: '1px solid #dde6e4', borderRadius: '16px', p: { xs: 3, md: 6 }, color: '#0c2a2e' }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#00695c' }}>NusaFleet</Typography>
        <Typography component="h1" sx={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.2, mt: 0.5 }}>
          {c.title}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#51676a', mt: 1 }}>
          {new Date().toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. {c.sub}
        </Typography>

        <Section title={c.s1}>
          <P>{c.s1a(summary.routes.length, num(lang, summary.routes.reduce((s, r) => s + r.daily_pax, 0)), base.fleet_size, rpBn(lang, base.annual_cost_rp), num(lang, base.co2_t), num(lang, base.reliability_pct, 1))}</P>
          <P>{c.s1b}</P>
        </Section>

        <Section title={c.s2}>
          <P>{c.s2note}</P>
          {recs.map(({ id, rec }) => {
            const r = results[id];
            const changes = routeChanges(summary.routes, r.baseline.fleet_plan, r.baseline.routes, rec.point);
            return (
              <Box key={id} sx={{ mt: 2.5, breakInside: 'avoid-page' }}>
                <Typography component="h3" sx={{ fontSize: '1rem', fontWeight: 700 }}>
                  {scenarioName(id)}
                  <Box component="span" sx={{ fontWeight: 400, color: '#51676a', fontSize: '0.85rem', ml: 1 }}>
                    {lang === 'id' ? r.scenario.label_id : r.scenario.label_en}, {c.from} {r.scenario.available_from_year}
                  </Box>
                </Typography>
                <Typography sx={{ fontSize: '0.88rem', mt: 0.5, mb: 1 }}>{rec.rule === 'noRegret' ? c.ruleNoRegret : c.ruleCheapest}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'max-content 1fr' }, columnGap: 3, rowGap: 0.4, mb: 1.5 }}>
                  {facts(rec.point, r.baseline.kpis).map(([label, value]) => (
                    <Box key={label} sx={{ display: 'contents' }}>
                      <Typography sx={{ fontSize: '0.85rem', color: '#51676a' }}>{label}</Typography>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <Box component="th" sx={th}>{c.route}</Box>
                      <Box component="th" sx={th}>{c.today}</Box>
                      <Box component="th" sx={th}>{c.plan}</Box>
                      <Box component="th" sx={thNum}>{c.cancelled}</Box>
                      <Box component="th" sx={thNum}>CO2 (t)</Box>
                    </tr>
                  </thead>
                  <tbody>
                    {changes.map((ch) => (
                      <tr key={ch.route.route_id}>
                        <Box component="td" sx={{ ...td, fontWeight: 600 }}>{ch.route.name}</Box>
                        <Box component="td" sx={td}>{mix(ch.from)}</Box>
                        <Box component="td" sx={{ ...td, fontWeight: ch.changed ? 700 : 400, color: ch.changed ? '#0c2a2e' : '#51676a' }}>{ch.changed ? mix(ch.to) : c.same}</Box>
                        <Box component="td" sx={tdNum}>
                          {num(lang, ch.today?.cancelled_trips_per_year ?? 0)} {'→'} {num(lang, ch.plan?.cancelled_trips_per_year ?? 0)}
                        </Box>
                        <Box component="td" sx={tdNum}>
                          {num(lang, ch.today?.co2_t ?? 0)} {'→'} {num(lang, ch.plan?.co2_t ?? 0)}
                        </Box>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            );
          })}
        </Section>

        <Section title={c.s3}>
          {alts.length === 0 ? (
            <P>{c.s3empty}</P>
          ) : (
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <Box component="th" sx={th}>{c.alt}</Box>
                  <Box component="th" sx={thNum}>{c.cost} (Rp {lang === 'id' ? 'miliar' : 'bn'})</Box>
                  <Box component="th" sx={thNum}>CO2 (t)</Box>
                  <Box component="th" sx={thNum}>{c.trips}</Box>
                  <Box component="th" sx={thNum}>{c.capex}</Box>
                  <Box component="th" sx={th}>{c.stations}</Box>
                </tr>
              </thead>
              <tbody>
                {alts.map((alt, k) => (
                  <tr key={alt.id}>
                    <Box component="td" sx={{ ...td, fontWeight: 600 }}>
                      {String.fromCharCode(65 + k)}. {alt.name}
                    </Box>
                    <Box component="td" sx={tdNum}>
                      {num(lang, alt.plan.cost_rp / 1e9, 1)} ({signed((alt.plan.cost_rp - alt.base.annual_cost_rp) / 1e9, 1)})
                    </Box>
                    <Box component="td" sx={tdNum}>
                      {num(lang, alt.plan.co2_t)} ({signed((100 * (alt.plan.co2_t - alt.base.co2_t)) / alt.base.co2_t)}%)
                    </Box>
                    <Box component="td" sx={tdNum}>{signed(tripsAvoided(alt.plan, alt.base))}</Box>
                    <Box component="td" sx={tdNum}>{rpBn(lang, alt.plan.capex_rp, 0)}</Box>
                    <Box component="td" sx={td}>{stationNames(alt.plan)}</Box>
                  </tr>
                ))}
              </tbody>
            </Box>
          )}
        </Section>

        <Section title={c.s4}>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {findings.map((f) => (
              <Box component="li" key={f} sx={{ fontSize: '0.92rem', lineHeight: 1.6, mb: 0.5 }}>
                {f}
              </Box>
            ))}
          </Box>
        </Section>

        <Section title={c.s5}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Box component="th" sx={th}>{c.param}</Box>
                <Box component="th" sx={thNum}>{c.value}</Box>
                <Box component="th" sx={th}>{c.basis}</Box>
                <Box component="th" sx={th}>{c.conf}</Box>
              </tr>
            </thead>
            <tbody>
              {KEY_ASSUMPTIONS.filter((k) => summary.assumptions[k]).map((k) => {
                const a = summary.assumptions[k];
                return (
                  <tr key={k}>
                    <Box component="td" sx={{ ...td, fontFamily: 'monospace', fontSize: '0.75rem' }}>{k}</Box>
                    <Box component="td" sx={tdNum}>
                      {a.value >= 1e9 ? rpBn(lang, a.value, 0) : num(lang, a.value, a.value < 10 ? 2 : 0)} {a.value >= 1e9 ? '' : a.unit}
                    </Box>
                    <Box component="td" sx={{ ...td, fontSize: '0.78rem' }}>{[a.source, a.rationale].filter(Boolean).join(' ')}</Box>
                    <Box component="td" sx={td}>{a.confidence}</Box>
                  </tr>
                );
              })}
            </tbody>
          </Box>
          {summary.wave_climate_is_placeholder ? <Typography sx={{ fontSize: '0.85rem', mt: 1.5, fontWeight: 600 }}>{c.wave}</Typography> : null}
        </Section>

        <Section title={c.s6}>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {c.limits.map((item) => (
              <Box component="li" key={item} sx={{ fontSize: '0.92rem', lineHeight: 1.6, mb: 0.5 }}>
                {item}
              </Box>
            ))}
          </Box>
        </Section>

        <Typography sx={{ fontSize: '0.75rem', color: '#51676a', mt: 4, pt: 2, borderTop: '1px solid #dde6e4', lineHeight: 1.5 }}>{c.footer}</Typography>
      </Box>
      {/* t is used so the estimate wording stays shared with the rest of the app */}
      <Typography className="no-print" sx={{ maxWidth: 860, mx: 'auto', mt: 1.5, fontSize: '0.75rem', color: 'text.secondary' }}>
        {t(lang, 'estimateHint')}
      </Typography>
    </Box>
  );
}
