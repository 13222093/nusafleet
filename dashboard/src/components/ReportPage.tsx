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
import { COOP_EVENTS, COOP_SOURCE, vesselSpecs } from '../cooperation';
import { scenarioShort } from './Controls';
import { SpecTable, coopProposals } from './CoopPage';
import { vesselShort } from './MapView';

interface Props {
  lang: Lang;
  summary: Summary;
  results: Record<string, ScenarioResult>;
  alts: Alternative[];
  /** The plan selected on the Plan page; the requirement sheet is derived from it. */
  current: { name: string; plan: ParetoPoint };
  onBack: () => void;
}

const COPY = {
  id: {
    title: 'Laporan rencana armada feri Maluku Utara',
    sub: "Dibuat dengan NusaFleet. Angka adalah estimasi skenario; asumsinya ada di bagian 5.",
    print: 'Cetak / simpan PDF',
    back: 'Kembali ke rencana',
    s1: '1. Ringkasan',
    s1a: (routes: number, pax: string, fleet: number, cost: string, co2: string, rel: string) =>
      `Kajian ini mencakup ${routes} rute dengan sekitar ${pax} penumpang per hari. Armada saat ini berjumlah ${fleet} feri diesel, dengan biaya ${cost} per tahun, emisi ${co2} ton CO2 per tahun, dan keandalan layanan ${rel}%.`,
    s1b: "Untuk tiap skenario pasokan listrik, model memilih jumlah dan jenis kapal per rute serta lokasi stasiun pengisian dengan biaya tahunan terendah. Ia memperhitungkan jumlah penumpang, jangkauan baterai, batas gelombang, daya pelabuhan, anggaran, dan skor keselamatan armada.",
    s2: '2. Rekomendasi per skenario pasokan listrik',
    s2note: "Satu aturan untuk ketiga skenario: rencana terbersih dengan biaya tahunan tidak melebihi armada saat ini.",
    ruleNoRegret: "Rencana terbersih dengan biaya tidak melebihi armada saat ini.",
    ruleCheapest: "Rencana dengan biaya tahunan terendah.",
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
    s3empty: "Simpan alternatif dari halaman Rencana untuk membandingkannya di sini.",
    alt: 'Alternatif',
    s4: '4. Temuan',
    f1: (name: string, pct: string, cost: string) => `${name}: rencana terbersih memangkas CO2 ${pct}% dengan biaya ${cost} per tahun.`,
    f2: (name: string) => `${name}: feri diesel baru adalah pilihan terbersih yang ditemukan model.`,
    f3: (ports: string) => `Stasiun pengisian dalam rekomendasi: ${ports}.`,
    f3none: "Stasiun pengisian masuk ke rencana begitu prioritas digeser ke Terbersih, mulai skenario 2027.",
    f4: "Mengganti feri diesel lama dengan yang baru menurunkan biaya bahan bakar dan emisi di ketiga skenario.",
    s5: '5. Asumsi utama',
    param: 'Parameter',
    value: 'Nilai',
    basis: 'Sumber atau alasan',
    conf: 'Keyakinan',
    wave: 'Iklim gelombang masih data sementara (pola musiman perkiraan), belum dari reanalisis.',
    s6: "6. Langkah berikutnya",
    limits: [
      "Masukkan data penumpang dan armada dari BPS, BPTD, dan ASDP, serta tarif dari PLN.",
      "Muat data gelombang dari Copernicus Marine atau ERA5.",
      "Tambahkan kendaraan di samping penumpang.",
      "Jadwalkan investasi dari tahun ke tahun.",
    ],
    s7: '7. Peluang kerja sama Indonesia dan Rusia',
    s7intro: "Dua jalur kerja sama bertemu di Maluku Utara: perkapalan hijau dan pasokan listrik baru. NusaFleet mengubah rute menjadi kebutuhan kapal dan daya yang bisa langsung dikerjakan kedua pihak.",
    s7spec: "Kapal baru yang dibutuhkan",
    s7prop: 'Usulan',
    footer: "Tiga skenario pasokan listrik, satu set angka. Mesin optimasi diadaptasi dari tim Kopibara (NUS Maritime Hackathon 2026), lisensi MIT.",
  },
  en: {
    title: 'North Maluku ferry fleet plan: report',
    sub: "Produced with NusaFleet. Figures are scenario estimates; assumptions are in section 5.",
    print: 'Print / save as PDF',
    back: 'Back to the plan',
    s1: '1. Summary',
    s1a: (routes: number, pax: string, fleet: number, cost: string, co2: string, rel: string) =>
      `This study covers ${routes} routes carrying about ${pax} passengers per day. Today's fleet is ${fleet} diesel ferries, costing ${cost} per year, emitting ${co2} tonnes of CO2 per year, with ${rel}% service reliability.`,
    s1b: "For each power-supply scenario the model picks the number and type of vessels per route and the charging sites at the lowest annual cost. It accounts for passenger numbers, battery range, wave limits, port power, budget and a fleet safety score.",
    s2: '2. Recommendation per power-supply scenario',
    s2note: "One rule for all three scenarios: the cleanest plan whose annual cost does not exceed the fleet today.",
    ruleNoRegret: "The cleanest plan that costs no more than the fleet does today.",
    ruleCheapest: "The plan with the lowest annual cost.",
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
    s3empty: "Save alternatives on the Plan page to compare them here.",
    alt: 'Alternative',
    s4: '4. Findings',
    f1: (name: string, pct: string, cost: string) => `${name}: the cleanest plan cuts CO2 by ${pct}% at ${cost} per year.`,
    f2: (name: string) => `${name}: new diesel ferries are the cleanest option the model finds.`,
    f3: (ports: string) => `Charging stations in the recommendations: ${ports}.`,
    f3none: "Charging stations enter the plan once the priority moves to Cleanest, from the 2027 scenario on.",
    f4: "Replacing old diesel ferries with new ones lowers fuel cost and emissions in all three scenarios.",
    s5: '5. Key assumptions',
    param: 'Parameter',
    value: 'Value',
    basis: 'Source or rationale',
    conf: 'Confidence',
    wave: 'The wave climate is still placeholder data (an assumed seasonal pattern), not reanalysis.',
    s6: "6. Next steps",
    limits: [
      "Bring in passenger and fleet data from BPS, BPTD and ASDP, and tariffs from PLN.",
      "Load wave data from Copernicus Marine or ERA5.",
      "Add vehicles alongside passengers.",
      "Schedule the investment year by year.",
    ],
    s7: '7. Opportunities for Indonesia and Russia cooperation',
    s7intro: "Two cooperation tracks meet in North Maluku: green shipbuilding and a new power supply. NusaFleet turns routes into vessel and power requirements both sides can act on.",
    s7spec: "The new vessels needed",
    s7prop: 'Proposals',
    footer: "Three power-supply scenarios, one set of numbers. Optimization engine adapted from team Kopibara (NUS Maritime Hackathon 2026), MIT license.",
  },
} as const;

const KEY_ASSUMPTIONS = ['diesel_price_rp_per_l', 'carbon_price_rp_per_tco2', 'discount_rate', 'budget_rp', 'min_avg_safety', 'service_level', 'load_factor', 'operating_hours_per_day'];

const th = { textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#52606a', padding: '6px 10px 6px 0', borderBottom: '1.5px solid #0f1417', verticalAlign: 'bottom' } as const;
const td = { fontSize: '0.85rem', padding: '7px 10px 7px 0', borderBottom: '1px solid #d6dee3', verticalAlign: 'top', lineHeight: 1.4 } as const;
const tdNum = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const;
const thNum = { ...th, textAlign: 'right' } as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ mt: 4, breakInside: 'avoid-page' }}>
      <Typography component="h2" sx={{ fontSize: '1.15rem', fontWeight: 500, mb: 1.25 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

const P = ({ children }: { children: ReactNode }) => <Typography sx={{ fontSize: '0.92rem', lineHeight: 1.6, mb: 1 }}>{children}</Typography>;

export function ReportPage({ lang, summary, results, alts, current, onBack }: Props) {
  const specRows = vesselSpecs(summary.routes, current.plan, summary.vessel_types);
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

  const button = { height: 36, px: 2, gap: 0.75, borderRadius: '3px', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 500 } as const;

  return (
    <Box>
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 2, maxWidth: 860, mx: 'auto' }}>
        <ButtonBase onClick={onBack} sx={{ ...button, border: '1px solid #d6dee3', bgcolor: '#ffffff' }}>
          <ArrowLeft size={16} />
          {c.back}
        </ButtonBase>
        <ButtonBase onClick={() => window.print()} sx={{ ...button, bgcolor: '#0f1417', color: '#ffffff' }}>
          <Printer size={16} />
          {c.print}
        </ButtonBase>
      </Box>

      <Box className="report" sx={{ maxWidth: 860, mx: 'auto', bgcolor: '#ffffff', border: '1px solid #d6dee3', borderRadius: '3px', p: { xs: 3, md: 6 }, color: '#0f1417' }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#0f1417' }}>NusaFleet</Typography>
        <Typography component="h1" sx={{ fontSize: '1.8rem', fontWeight: 500, lineHeight: 1.2, mt: 0.5 }}>
          {c.title}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#52606a', mt: 1 }}>
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
                <Typography component="h3" sx={{ fontSize: '1rem', fontWeight: 500 }}>
                  {scenarioName(id)}
                  <Box component="span" sx={{ fontWeight: 400, color: '#52606a', fontSize: '0.85rem', ml: 1 }}>
                    {lang === 'id' ? r.scenario.label_id : r.scenario.label_en}, {c.from} {r.scenario.available_from_year}
                  </Box>
                </Typography>
                <Typography sx={{ fontSize: '0.88rem', mt: 0.5, mb: 1 }}>{rec.rule === 'noRegret' ? c.ruleNoRegret : c.ruleCheapest}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'max-content 1fr' }, columnGap: 3, rowGap: 0.4, mb: 1.5 }}>
                  {facts(rec.point, r.baseline.kpis).map(([label, value]) => (
                    <Box key={label} sx={{ display: 'contents' }}>
                      <Typography sx={{ fontSize: '0.85rem', color: '#52606a' }}>{label}</Typography>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
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
                        <Box component="td" sx={{ ...td, fontWeight: ch.changed ? 700 : 400, color: ch.changed ? '#0f1417' : '#52606a' }}>{ch.changed ? mix(ch.to) : c.same}</Box>
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

        <Section title={c.s7}>
          <P>{c.s7intro}</P>
          <Box component="ul" sx={{ m: 0, mb: 1.5, pl: 2.5 }}>
            {COOP_EVENTS.map((e) => (
              <Box component="li" key={e.when.en} sx={{ fontSize: '0.88rem', lineHeight: 1.55, mb: 0.4 }}>
                <strong>{e.when[lang]}.</strong> {e.text[lang]}
              </Box>
            ))}
          </Box>
          <Typography sx={{ fontSize: '0.78rem', color: '#52606a', fontWeight: 600, mb: 2 }}>{COOP_SOURCE[lang]}</Typography>
          <Typography component="h3" sx={{ fontSize: '1rem', fontWeight: 500, mb: 0.5 }}>
            {c.s7spec}: {current.name}
          </Typography>
          <SpecTable lang={lang} rows={specRows} />
          <Typography component="h3" sx={{ fontSize: '1rem', fontWeight: 500, mt: 2.5, mb: 0.5 }}>
            {c.s7prop}
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
            {coopProposals(lang, specRows).map((text) => (
              <Box component="li" key={text} sx={{ fontSize: '0.92rem', lineHeight: 1.6, mb: 0.5 }}>
                {text}
              </Box>
            ))}
          </Box>
        </Section>

        <Typography sx={{ fontSize: '0.75rem', color: '#52606a', mt: 4, pt: 2, borderTop: '1px solid #d6dee3', lineHeight: 1.5 }}>{c.footer}</Typography>
      </Box>
      {/* t is used so the estimate wording stays shared with the rest of the app */}
      <Typography className="no-print" sx={{ maxWidth: 860, mx: 'auto', mt: 1.5, fontSize: '0.75rem', color: 'text.secondary' }}>
        {t(lang, 'estimateHint')}
      </Typography>
    </Box>
  );
}
