// Real URLs for the four views, so each can be linked, shared and indexed.
// Vercel rewrites unknown paths to index.html (dashboard/vercel.json); a path
// that matches no view renders the in-app 404.
import { useCallback, useEffect, useState } from 'react';

import type { Lang } from './types';

export type Page = 'plan' | 'coop' | 'report' | 'data' | 'notfound';

export const PATHS: Record<Exclude<Page, 'notfound'>, string> = {
  plan: '/',
  coop: '/kerja-sama',
  report: '/laporan',
  data: '/data',
};

export function pageFromPath(path: string): Page {
  const clean = path.replace(/\/+$/, '') || '/';
  const hit = (Object.entries(PATHS) as [Exclude<Page, 'notfound'>, string][]).find(([, p]) => p === clean);
  return hit ? hit[0] : 'notfound';
}

const META: Record<Page, { title: Record<Lang, string>; description: Record<Lang, string> }> = {
  plan: {
    title: { id: 'NusaFleet: rencana feri dan stasiun pengisian Maluku Utara', en: 'NusaFleet: ferry and charging plan for North Maluku' },
    description: {
      id: 'Model relief 3D Maluku Utara yang menghitung kapal mana untuk lima rute feri dan di pelabuhan mana stasiun pengisian dibangun, untuk pasokan listrik 2026, 2027 dan 2031.',
      en: 'A 3D relief model of North Maluku that works out which ship serves each of five ferry routes and which ports get charging stations, for the 2026, 2027 and 2031 power supply.',
    },
  },
  coop: {
    title: { id: 'Indonesia × Rusia: siapa membawa apa | NusaFleet', en: 'Indonesia × Russia: who brings what | NusaFleet' },
    description: {
      id: 'Indonesia membawa rute, Rusia membawa kapal hibrida dan listrik serta pasokan baru untuk Halmahera Utara. Kerja sama sejak MoU November 2025 dalam satu sumbu waktu.',
      en: 'Indonesia brings the routes, Russia brings hybrid and electric ships and new power for Halmahera Utara. The cooperation since the November 2025 MoU on one time axis.',
    },
  },
  report: {
    title: { id: 'Laporan rencana armada | NusaFleet', en: 'Fleet plan report | NusaFleet' },
    description: {
      id: 'Laporan tujuh bagian yang siap dicetak: ringkasan, rekomendasi per skenario pasokan, kebutuhan kapal baru dan asumsi.',
      en: 'A seven-section report ready to print: summary, recommendation per supply scenario, new vessel requirements and assumptions.',
    },
  },
  data: {
    title: { id: 'Data dan asumsi | NusaFleet', en: 'Data and assumptions | NusaFleet' },
    description: {
      id: 'Semua masukan model NusaFleet dengan sumber, dasar perhitungan dan tingkat keyakinannya.',
      en: 'Every NusaFleet model input with its source, basis and confidence level.',
    },
  },
  notfound: {
    title: { id: 'Rute ini tidak ada | NusaFleet', en: 'No such route | NusaFleet' },
    description: { id: 'Halaman tidak ditemukan.', en: 'Page not found.' },
  },
};

function setMeta(page: Page, lang: Lang) {
  const m = META[page];
  document.title = m.title[lang];
  document.querySelector('meta[name="description"]')?.setAttribute('content', m.description[lang]);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical && page !== 'notfound') canonical.setAttribute('href', `https://nusafleet.vercel.app${PATHS[page]}`);
}

/** The current view, kept in step with the address bar and the back button. */
export function usePageRoute(lang: Lang): [Page, (page: Exclude<Page, 'notfound'>) => void] {
  const [page, setPageState] = useState<Page>(() => pageFromPath(window.location.pathname));

  useEffect(() => {
    const onPop = () => setPageState(pageFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => setMeta(page, lang), [page, lang]);

  const go = useCallback((next: Exclude<Page, 'notfound'>) => {
    if (window.location.pathname !== PATHS[next]) window.history.pushState(null, '', PATHS[next]);
    setPageState(next);
    window.scrollTo(0, 0);
  }, []);

  return [page, go];
}
