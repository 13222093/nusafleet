// "Indonesia x Rusia": who brings what, the dated cooperation facts, the vessel
// requirement sheet for the selected plan, and three concrete proposals.
// Neutral by design: the same sheet can be met by any shipyard, and the new
// power supply is one scenario among three.
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { COOP_EVENTS, COOP_SOURCE, vesselSpecs } from '../cooperation';
import type { SpecRow } from '../cooperation';
import { num } from '../i18n';
import type { Lang, ParetoPoint, Summary } from '../types';
import { vesselShort } from './MapView';

const COPY = {
  id: {
    title: 'Indonesia × Rusia',
    lead: "Indonesia punya ratusan penyeberangan antarpulau yang butuh feri lebih aman dan bersih. Rusia membangun kapal hibrida dan listrik, dan sedang membawa pasokan listrik baru ke Halmahera Utara. NusaFleet menghitung kapal mana yang cocok di rute mana, dan di mana ia mengisi daya, sebelum keduanya tiba.",
    indonesia: 'Indonesia membawa',
    indonesiaItems: ["Rute antarpulau dan jumlah penumpangnya", "Pelabuhan dan jaringan listrik setempat", "Operator feri dan galangan dalam negeri"],
    tool: "NusaFleet menghitung",
    toolItems: ["Kapal dan daya pengisian yang dibutuhkan tiap rute", "Biaya, emisi, dan trip yang terselamatkan di tiga skenario pasokan", "Model terbuka yang bisa dijalankan kedua pihak"],
    russia: 'Rusia membawa',
    russiaItems: ["Kapal hibrida dan listrik lewat kelompok kerja perkapalan", "Unit pembangkit terapung untuk Halmahera Utara", "Mitra riset dan pelatihan lewat kelompok kerja riset"],
    timeline: "Kerja sama sejauh ini",
    spec: "Kapal baru yang dibutuhkan",
    specFor: "Untuk rencana",
    specNote: "Satu baris per kapal baru: apa yang harus sanggup dilakukannya di rutenya. Siap diserahkan ke kelompok kerja perkapalan. Angka adalah estimasi model per kelas kapal.",
    specEmpty: "Pilih prioritas Seimbang atau Terbersih di halaman Rencana untuk melihat kapal baru yang dibutuhkan.",
    proposals: "Yang kami usulkan",
    p1: "Serahkan lembar kebutuhan kapal per rute ke kelompok kerja perkapalan, supaya desain kapal disesuaikan dengan rute Indonesia.",
    p2pilot: (route: string, vessel: string) => `Jalankan ${route} sebagai rute percontohan feri ${vessel}.`,
    p2none: "Pilih satu rute percontohan dari rencana Terbersih.",
    p3: "Mahasiswa Indonesia dan Rusia merawat data gelombang, penumpang, dan kapal bersama-sama. Kodenya terbuka, berlisensi MIT.",
    neutral: "Lembar yang sama berlaku untuk galangan mana pun, dan ketiga skenario pasokan dihitung dengan angka yang sama. Untuk keperluan sipil.",
    cols: ['Rute', 'Kapal', 'Jumlah', 'Kapasitas (pnp)', 'Kecepatan (kn)', 'Trip/hari', 'Jarak (nm)', 'Jangkauan baterai min. (nm)', 'Batas gelombang (m)', 'Daya pengisian (kW)'],
  },
  en: {
    title: 'Indonesia × Russia',
    lead: "Indonesia has hundreds of island crossings that need safer, cleaner ferries. Russia builds hybrid and electric vessels and is bringing new power to Halmahera Utara. NusaFleet works out which ship fits which route, and where it charges, before either arrives.",
    indonesia: 'Indonesia brings',
    indonesiaItems: ["Island routes and their passengers", "Ports and the local grid", "Ferry operators and domestic shipyards"],
    tool: "NusaFleet works out",
    toolItems: ["The vessel and charging power each route needs", "Cost, emissions and trips saved across three supply scenarios", "An open model both sides can run"],
    russia: 'Russia brings',
    russiaItems: ["Hybrid and electric vessels through the shipbuilding working group", "Floating power units for Halmahera Utara", "Research and training partners through the research working group"],
    timeline: "The cooperation so far",
    spec: "The new vessels needed",
    specFor: "For the plan",
    specNote: "One line per new vessel: what it must be able to do on its route. Ready to hand to the shipbuilding working group. Figures are model estimates per vessel class.",
    specEmpty: "Choose the Balanced or Cleanest priority on the Plan page to see the new vessels needed.",
    proposals: "What we propose",
    p1: "Hand the per-route vessel sheet to the shipbuilding working group, so designs are fitted to Indonesian routes.",
    p2pilot: (route: string, vessel: string) => `Run ${route} as the pilot route for a ${vessel} ferry.`,
    p2none: "Pick one pilot route from the Cleanest plan.",
    p3: "Indonesian and Russian students maintain the wave, passenger and vessel data together. The code is open, under the MIT license.",
    neutral: "The same sheet works for any shipyard, and all three supply scenarios run on the same numbers. For civilian use.",
    cols: ['Route', 'Vessel', 'Count', 'Capacity (pax)', 'Speed (kn)', 'Trips/day', 'Distance (nm)', 'Min. battery range (nm)', 'Wave limit (m)', 'Charging power (kW)'],
  },
} as const;

const th = { textAlign: 'right', fontSize: '0.72rem', fontWeight: 500, color: '#52606a', padding: '6px 8px', borderBottom: '1.5px solid #0f1417', verticalAlign: 'bottom', lineHeight: 1.25 } as const;
const td = { textAlign: 'right', fontSize: '0.85rem', padding: '7px 8px', borderBottom: '1px solid #d6dee3', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const;

/** The requirement sheet as a table. Used on this page and in the report. */
export function SpecTable({ lang, rows }: { lang: Lang; rows: SpecRow[] }) {
  const c = COPY[lang];
  if (rows.length === 0) return <Typography sx={{ fontSize: '0.9rem', color: '#52606a', lineHeight: 1.5 }}>{c.specEmpty}</Typography>;
  const dash = '–';
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {c.cols.map((col, i) => (
              <Box component="th" key={col} sx={{ ...th, textAlign: i < 2 ? 'left' : 'right', paddingLeft: i === 0 ? 0 : '8px' }}>
                {col}
              </Box>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.routeId}-${r.vesselType}`}>
              <Box component="td" sx={{ ...td, textAlign: 'left', paddingLeft: 0, fontWeight: 600, whiteSpace: 'normal' }}>{r.routeName}</Box>
              <Box component="td" sx={{ ...td, textAlign: 'left' }}>{vesselShort(r.vesselType, lang)}</Box>
              <Box component="td" sx={td}>{r.count}</Box>
              <Box component="td" sx={td}>{num(lang, r.capacityPax)}</Box>
              <Box component="td" sx={td}>{num(lang, r.speedKn)}</Box>
              <Box component="td" sx={td}>{r.dailyTrips}</Box>
              <Box component="td" sx={td}>{num(lang, r.distanceNm, 1)}</Box>
              <Box component="td" sx={td}>{r.minRangeNm === null ? dash : num(lang, r.minRangeNm, 1)}</Box>
              <Box component="td" sx={td}>{num(lang, r.waveLimitM, 1)}</Box>
              <Box component="td" sx={td}>{r.chargeKw === null ? dash : num(lang, r.chargeKw)}</Box>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

/** The three proposals, the second one tied to the selected plan. */
export function coopProposals(lang: Lang, rows: SpecRow[]): string[] {
  const c = COPY[lang];
  const pilot = rows.find((r) => r.plugsIn);
  return [c.p1, pilot ? c.p2pilot(pilot.routeName, vesselShort(pilot.vesselType, lang)) : c.p2none, c.p3];
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const AXIS_FROM = 2025;
const AXIS_TO = 2032;
const TODAY = 2026 + 10.7 / 12; // 22 Nov 2026

/** "Nov 2025" -> 2025.83; a bare year sits at its start. */
function decimalDate(when: string, year: number): number {
  const m = MONTHS.indexOf(when.slice(0, 3).toLowerCase());
  return m >= 0 ? year + m / 12 : year;
}

/** Cooperation on a true time scale: the gap between the agreement and the supply is the story. */
function CoopTimeline({ lang }: { lang: Lang }) {
  const pos = (v: number) => `${((v - AXIS_FROM) / (AXIS_TO - AXIS_FROM)) * 100}%`;
  const years = Array.from({ length: AXIS_TO - AXIS_FROM + 1 }, (_u, i) => AXIS_FROM + i);
  const events = COOP_EVENTS.map((e) => ({ ...e, at: decimalDate(e.when.en, e.year) }));
  return (
    <Box>
      <Box role="img" aria-label={events.map((e) => `${e.when[lang]}: ${e.short[lang]}`).join('; ')} sx={{ position: 'relative', height: 108, mx: { xs: 1, md: 2 } }}>
        {/* Past solid, future dashed: what has happened and what is planned */}
        <Box sx={{ position: 'absolute', left: 0, width: pos(TODAY), top: 56, borderTop: '2px solid #0f1417' }} />
        <Box sx={{ position: 'absolute', left: pos(TODAY), right: 0, top: 56, borderTop: '2px dashed #0f1417' }} />
        {years.map((y) => (
          <Box key={y} sx={{ position: 'absolute', left: pos(y), top: 56, transform: 'translateX(-50%)' }}>
            <Box sx={{ width: '1px', height: 8, bgcolor: '#0f1417', mx: 'auto' }} />
            <Typography sx={{ mt: 0.5, fontSize: '0.72rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{y}</Typography>
          </Box>
        ))}
        <Box sx={{ position: 'absolute', left: pos(TODAY), top: 46, height: 46, borderLeft: '1px solid #52606a' }}>
          <Typography sx={{ position: 'absolute', bottom: -4, left: 5, fontSize: '0.7rem', fontStyle: 'italic', color: 'text.secondary', whiteSpace: 'nowrap' }}>{lang === 'id' ? 'hari ini' : 'today'}</Typography>
        </Box>
        {events.map((e, i) => (
          <Box key={e.when.en} title={e.short[lang]} sx={{ position: 'absolute', left: pos(e.at), top: 51, transform: 'translateX(-50%)' }}>
            <Box sx={{ width: 11, height: 11, transform: 'rotate(45deg)', bgcolor: e.at > TODAY ? '#ffffff' : '#b5157a', border: '2px solid #b5157a' }} />
            <Typography sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', fontSize: '0.78rem', fontWeight: 600, fontStretch: '85%', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', mb: i % 2 ? 2.25 : 0 }}>{e.when[lang]}</Typography>
          </Box>
        ))}
      </Box>

      <Box component="ol" sx={{ m: 0, mt: 2, p: 0, listStyle: 'none', borderTop: '3px solid #0f1417' }}>
        {events.map((e) => {
          const planned = e.at > TODAY;
          return (
            <Box component="li" key={e.when.en} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '160px 220px 1fr' }, columnGap: 3, rowGap: 0.5, py: 2, borderBottom: '1px solid #d6dee3', alignItems: 'baseline' }}>
              <Typography sx={{ fontSize: { xs: '1.6rem', md: '2rem' }, fontWeight: 500, fontStretch: '72%', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: planned ? 'text.secondary' : 'text.primary' }}>{e.when[lang]}</Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, fontStyle: planned ? 'italic' : 'normal' }}>{e.short[lang]}</Typography>
              <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.55, maxWidth: 680, color: planned ? 'text.secondary' : 'text.primary' }}>{e.text[lang]}</Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function Shore({ title, items, align = 'left' }: { title: string; items: readonly string[]; align?: 'left' | 'right' }) {
  return (
    <Box sx={{ textAlign: { xs: 'left', md: align } }}>
      <Typography component="h2" sx={{ fontSize: { xs: '1.6rem', md: '2rem' }, fontWeight: 600, fontStretch: '75%', lineHeight: 1, letterSpacing: '-0.01em' }}>{title}</Typography>
      <Box component="ul" sx={{ m: 0, mt: 2, p: 0, listStyle: 'none', display: 'grid', gap: 1 }}>
        {items.map((item) => (
          <Box component="li" key={item} sx={{ fontSize: '0.95rem', lineHeight: 1.45, color: 'text.secondary' }}>
            {item}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function Block({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ mt: 6 }}>
      <Typography component="h2" sx={{ fontSize: '1.5rem', fontWeight: 600, fontStretch: '80%' }}>
        {title}
      </Typography>
      {sub ? <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 1.5 }}>{sub}</Typography> : <Box sx={{ mb: 1.5 }} />}
      {children}
    </Box>
  );
}

interface Props {
  lang: Lang;
  summary: Summary;
  plan: ParetoPoint;
  planName: string;
}

export function CoopPage({ lang, summary, plan, planName }: Props) {
  const c = COPY[lang];
  const rows = vesselSpecs(summary.routes, plan, summary.vessel_types);

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Typography component="h1" sx={{ fontSize: { xs: '2.6rem', md: '4.2rem' }, fontWeight: 600, fontStretch: '72%', lineHeight: 0.95, letterSpacing: '-0.015em' }}>
        {c.title}
      </Typography>
      <Typography sx={{ mt: 1.5, fontSize: '1.05rem', lineHeight: 1.6, maxWidth: 820, color: 'text.secondary' }}>{c.lead}</Typography>

      <Box component="section" aria-label={c.tool} sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.25fr 1fr' }, columnGap: 3, rowGap: 3, alignItems: 'start' }}>
        <Shore title={c.indonesia} items={c.indonesiaItems} />
        <Box sx={{ position: 'relative', pt: { xs: 0, md: 1.5 } }}>
          {/* The ferry line between the two shores: NusaFleet is the crossing */}
          <Box aria-hidden="true" sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', top: 22, left: -24, right: -24, borderTop: '2px dashed #0f1417' }} />
          <Box aria-hidden="true" sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', top: 16, left: -30, width: 14, height: 14, borderRadius: '50%', border: '2px solid #0f1417', bgcolor: '#ffffff' }} />
          <Box aria-hidden="true" sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', top: 16, right: -30, width: 14, height: 14, borderRadius: '50%', border: '2px solid #0f1417', bgcolor: '#ffffff' }} />
          <Typography component="h2" sx={{ position: 'relative', display: 'inline-block', px: 1, ml: -1, bgcolor: 'background.default', fontSize: '1.05rem', fontWeight: 600, fontStretch: '88%', color: '#b5157a' }}>{c.tool}</Typography>
          <Box component="ol" sx={{ m: 0, mt: 2.5, p: 0, listStyle: 'none', display: 'grid', gap: 1.25 }}>
            {c.toolItems.map((item) => (
              <Box component="li" key={item} sx={{ display: 'grid', gridTemplateColumns: '14px 1fr', gap: 1.25, fontSize: '0.95rem', lineHeight: 1.45 }}>
                <Box aria-hidden="true" sx={{ mt: '10px', width: 14, height: 0, borderTop: '2px dashed #b5157a' }} />
                {item}
              </Box>
            ))}
          </Box>
        </Box>
        <Shore title={c.russia} items={c.russiaItems} align="right" />
      </Box>

      <Block title={c.timeline}>
        <CoopTimeline lang={lang} />
        <Typography sx={{ mt: 1.5, fontSize: '0.78rem', color: '#52606a', fontStyle: 'italic' }}>{COOP_SOURCE[lang]}</Typography>
      </Block>

      <Block title={c.spec} sub={`${c.specFor}: ${planName}`}>
        <Box sx={{ pt: 1.5, borderTop: '3px solid #0f1417' }}>
          <SpecTable lang={lang} rows={rows} />
          <Typography sx={{ mt: 2, fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.5 }}>{c.specNote}</Typography>
        </Box>
      </Block>

      <Block title={c.proposals}>
        <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none', borderTop: '3px solid #0f1417' }}>
          {coopProposals(lang, rows).map((text, i) => (
            <Box component="li" key={text} sx={{ display: 'grid', gridTemplateColumns: { xs: '40px 1fr', md: '72px 1fr' }, alignItems: 'baseline', py: 2, borderBottom: '1px solid #d6dee3' }}>
              <Typography component="span" sx={{ fontSize: { xs: '1.1rem', md: '1.3rem' }, fontWeight: 500, fontStretch: '80%', color: '#52606a', lineHeight: 1.4, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</Typography>
              <Typography sx={{ fontSize: '1.02rem', lineHeight: 1.5, maxWidth: 760 }}>{text}</Typography>
            </Box>
          ))}
        </Box>
      </Block>

      <Typography sx={{ mt: 4, fontSize: '0.85rem', fontStyle: 'italic', color: 'text.secondary', lineHeight: 1.5, maxWidth: 820 }}>{c.neutral}</Typography>
    </Box>
  );
}
