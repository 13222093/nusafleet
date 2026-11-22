// "Indonesia x Rusia": who brings what, the dated cooperation facts, the vessel
// requirement sheet for the selected plan, and three concrete proposals.
// Neutral by design: the same sheet can be met by any shipyard, and the new
// power supply is one scenario among three.
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Anchor, ArrowRight, Compass, Ship } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { COOP_EVENTS, COOP_SOURCE, vesselSpecs } from '../cooperation';
import type { SpecRow } from '../cooperation';
import { num } from '../i18n';
import type { Lang, ParetoPoint, Summary } from '../types';
import { vesselShort } from './MapView';

const COPY = {
  id: {
    title: 'Indonesia × Rusia',
    lead: 'Indonesia membawa ratusan rute antarpulau yang butuh kapal lebih aman dan bersih. Rusia membawa pengalaman kapal hibrida dan listrik serta pasokan listrik baru untuk Halmahera Utara. NusaFleet menghubungkan keduanya: rute diterjemahkan menjadi kebutuhan kapal dan daya, sebelum kapal dan listriknya tiba.',
    indonesia: 'Indonesia membawa',
    indonesiaItems: ['Rute antarpulau dan permintaan penumpang', 'Pelabuhan dan jaringan listrik setempat', 'Operator feri dan galangan dalam negeri'],
    tool: 'NusaFleet menghubungkan',
    toolItems: ['Rute menjadi kebutuhan kapal dan daya pengisian', 'Tiga skenario pasokan diuji dengan angka yang sama', 'Model terbuka yang bisa diperiksa kedua pihak'],
    russia: 'Rusia membawa',
    russiaItems: ['Desain kapal hibrida dan listrik lewat kelompok kerja perkapalan', 'Unit pembangkit terapung untuk Halmahera Utara (skenario 2031)', 'Mitra riset dan pelatihan lewat kelompok kerja riset'],
    timeline: 'Jejak kerja sama',
    spec: 'Spesifikasi kebutuhan kapal baru',
    specFor: 'Diturunkan dari rencana yang sedang dipilih',
    specNote: 'Dokumen sisi permintaan untuk kelompok kerja perkapalan: apa yang harus bisa dilakukan tiap kapal baru di rutenya. Nilai berasal dari arketipe kapal di model (estimasi), bukan dari desain.',
    specEmpty: 'Rencana ini tidak membangun kapal baru, jadi belum ada yang perlu dispesifikasikan. Pilih prioritas Seimbang atau Terbersih di halaman Rencana.',
    proposals: 'Tiga usulan konkret',
    p1: 'Serahkan spesifikasi kebutuhan kapal per rute ke kelompok kerja perkapalan, sebagai dasar menyesuaikan desain dengan rute Indonesia.',
    p2pilot: (route: string, vessel: string) => `Jadikan ${route} rute percontohan untuk feri ${vessel}, setelah data permintaan dan gelombangnya diverifikasi.`,
    p2none: 'Pilih satu rute percontohan setelah data permintaan dan gelombang diverifikasi. Pada rencana ini belum ada rute yang memakai kapal hibrida atau listrik.',
    p3: 'Validasi data bersama: mahasiswa Indonesia dan Rusia memperbarui data gelombang, permintaan, dan parameter kapal. Kodenya terbuka dengan lisensi MIT.',
    neutral: 'NusaFleet tidak memilih pemasok. Galangan mana pun dapat memenuhi spesifikasi yang sama, dan skenario 2026 serta 2027 berdiri sendiri tanpa pasokan listrik baru. Proyek ini murni sipil.',
    cols: ['Rute', 'Kapal', 'Jumlah', 'Kapasitas (pnp)', 'Kecepatan (kn)', 'Trip/hari', 'Jarak (nm)', 'Jangkauan baterai min. (nm)', 'Batas gelombang (m)', 'Daya pengisian (kW)'],
  },
  en: {
    title: 'Indonesia × Russia',
    lead: 'Indonesia brings hundreds of inter-island routes that need safer, cleaner ships. Russia brings experience with hybrid and electric vessels and a new power supply for Halmahera Utara. NusaFleet connects the two: routes are turned into vessel and power requirements, before the ships and the power arrive.',
    indonesia: 'Indonesia brings',
    indonesiaItems: ['Inter-island routes and passenger demand', 'Ports and the local power grid', 'Ferry operators and domestic shipyards'],
    tool: 'NusaFleet connects',
    toolItems: ['Routes into vessel and charging requirements', 'Three supply scenarios tested with the same numbers', 'An open model both sides can inspect'],
    russia: 'Russia brings',
    russiaItems: ['Hybrid and electric vessel designs through the shipbuilding working group', 'Floating power units for Halmahera Utara (the 2031 scenario)', 'Research and training partners through the research working group'],
    timeline: 'Cooperation so far',
    spec: 'Requirement sheet for new vessels',
    specFor: 'Derived from the plan currently selected',
    specNote: 'A demand-side document for the shipbuilding working group: what each new vessel has to do on its route. Values come from the vessel archetypes in the model (estimates), not from a design.',
    specEmpty: 'This plan builds no new vessels, so there is nothing to specify yet. Choose the Balanced or Cleanest priority on the Plan page.',
    proposals: 'Three concrete proposals',
    p1: 'Hand the per-route vessel requirement sheet to the shipbuilding working group, as the basis for adapting designs to Indonesian routes.',
    p2pilot: (route: string, vessel: string) => `Make ${route} a pilot route for a ${vessel} ferry, once its demand and wave data are verified.`,
    p2none: 'Choose one pilot route once demand and wave data are verified. In this plan no route uses a hybrid or electric vessel yet.',
    p3: 'Joint data validation: Indonesian and Russian students update the wave, demand and vessel data. The code is open under the MIT license.',
    neutral: 'NusaFleet does not choose a supplier. Any shipyard can meet the same sheet, and the 2026 and 2027 scenarios stand on their own without the new power supply. The project is purely civilian.',
    cols: ['Route', 'Vessel', 'Count', 'Capacity (pax)', 'Speed (kn)', 'Trips/day', 'Distance (nm)', 'Min. battery range (nm)', 'Wave limit (m)', 'Charging power (kW)'],
  },
} as const;

const th = { textAlign: 'right', fontSize: '0.72rem', fontWeight: 700, color: '#51676a', padding: '6px 8px', borderBottom: '1.5px solid #0c2a2e', verticalAlign: 'bottom', lineHeight: 1.25 } as const;
const td = { textAlign: 'right', fontSize: '0.85rem', padding: '7px 8px', borderBottom: '1px solid #dde6e4', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const;

/** The requirement sheet as a table. Used on this page and in the report. */
export function SpecTable({ lang, rows }: { lang: Lang; rows: SpecRow[] }) {
  const c = COPY[lang];
  if (rows.length === 0) return <Typography sx={{ fontSize: '0.9rem', color: '#51676a', lineHeight: 1.5 }}>{c.specEmpty}</Typography>;
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

function Column({ icon: Icon, title, items, dark }: { icon: LucideIcon; title: string; items: readonly string[]; dark?: boolean }) {
  return (
    <Box sx={{ p: 3, borderRadius: '20px', bgcolor: dark ? '#06252b' : '#ffffff', color: dark ? '#ffffff' : 'inherit', border: '1px solid', borderColor: dark ? '#06252b' : '#dde6e4' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: dark ? '#7fe3d2' : '#00695c' }}>
        <Icon size={20} />
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</Typography>
      </Box>
      <Box component="ul" sx={{ m: 0, mt: 1.5, pl: 2.25, display: 'grid', gap: 0.75 }}>
        {items.map((item) => (
          <Box component="li" key={item} sx={{ fontSize: '0.9rem', lineHeight: 1.45, color: dark ? 'rgba(255,255,255,0.85)' : 'inherit' }}>
            {item}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function Block({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ mt: 4 }}>
      <Typography component="h2" sx={{ fontSize: '1.2rem', fontWeight: 700 }}>
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
  const arrow = (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', color: '#51676a' }}>
      <ArrowRight size={22} />
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Typography component="h1" sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
        {c.title}
      </Typography>
      <Typography sx={{ mt: 1.5, fontSize: '1.05rem', lineHeight: 1.6, maxWidth: 820, color: 'text.secondary' }}>{c.lead}</Typography>

      <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr auto 1fr' }, gap: 2, alignItems: 'stretch' }}>
        <Column icon={Anchor} title={c.indonesia} items={c.indonesiaItems} />
        {arrow}
        <Column icon={Compass} title={c.tool} items={c.toolItems} dark />
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', color: '#51676a', transform: 'scaleX(-1)' }}>
          <ArrowRight size={22} />
        </Box>
        <Column icon={Ship} title={c.russia} items={c.russiaItems} />
      </Box>

      <Block title={c.timeline}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${COOP_EVENTS.length}, 1fr)` }, gap: 2, position: 'relative' }}>
          {COOP_EVENTS.map((e) => (
            <Box key={e.when.en} sx={{ pt: 2, borderTop: '3px solid #009688' }}>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{e.when[lang]}</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#00695c', mt: 0.25 }}>{e.short[lang]}</Typography>
              <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.5, mt: 0.75 }}>{e.text[lang]}</Typography>
            </Box>
          ))}
        </Box>
        <Typography sx={{ mt: 2, fontSize: '0.78rem', color: '#8a5a00', fontWeight: 600 }}>{COOP_SOURCE[lang]}</Typography>
      </Block>

      <Block title={c.spec} sub={`${c.specFor}: ${planName}`}>
        <Box sx={{ p: { xs: 2, md: 3 }, borderRadius: '20px', bgcolor: '#ffffff', border: '1px solid #dde6e4' }}>
          <SpecTable lang={lang} rows={rows} />
          <Typography sx={{ mt: 2, fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.5 }}>{c.specNote}</Typography>
        </Box>
      </Block>

      <Block title={c.proposals}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {coopProposals(lang, rows).map((text, i) => (
            <Box key={text} sx={{ p: 2.5, borderRadius: '20px', bgcolor: '#ffffff', border: '1px solid #dde6e4' }}>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, color: '#009688', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</Typography>
              <Typography sx={{ mt: 1, fontSize: '0.92rem', lineHeight: 1.5 }}>{text}</Typography>
            </Box>
          ))}
        </Box>
      </Block>

      <Typography sx={{ mt: 4, p: 2, borderRadius: '16px', bgcolor: '#e3f5f1', fontSize: '0.88rem', lineHeight: 1.5 }}>{c.neutral}</Typography>
    </Box>
  );
}
