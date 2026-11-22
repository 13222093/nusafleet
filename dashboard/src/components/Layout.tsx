// App shell: a quiet paper header (wordmark, the line that says what this is,
// four real links, language) and a short footer.
import * as React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { UI } from '../colors';
import { t } from '../i18n';
import { PATHS } from '../routes';
import type { Page } from '../routes';
import type { Lang } from '../types';

export type { Page };

interface LayoutProps {
  children: React.ReactNode;
  lang: Lang;
  onLang: (lang: Lang) => void;
  page: Page;
  onPage: (page: Exclude<Page, 'notfound'>) => void;
}

// Drawn inside the target, so the header's edge never clips it
const focus = { '&.Mui-focusVisible': { outline: `2px solid ${UI.accent}`, outlineOffset: -3, borderRadius: '2px' } } as const;

/** Wordmark glyph: a hull on a waterline, drawn in two strokes. The hull bobs when the wordmark is pointed at. */
function Mark() {
  return (
    <svg className="mark" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g className="mark-hull">
        <path d="M3 13.5h18l-2.6 4.2a2 2 0 0 1-1.7.9H7.3a2 2 0 0 1-1.7-.9L3 13.5Z" fill={UI.ink} />
        <path d="M8 13.5V9.5h6.5l2 4" stroke={UI.ink} strokeWidth="1.6" strokeLinejoin="round" />
      </g>
      <path d="M2 21.2c1.7 0 1.7-.9 3.3-.9s1.7.9 3.4.9 1.6-.9 3.3-.9 1.7.9 3.3.9 1.7-.9 3.4-.9 1.6.9 3.3.9" stroke={UI.accent} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** A real link that the app handles itself, so a plain click does not reload the page. */
function onNav(e: React.MouseEvent, go: () => void) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  go();
}

const CREDIT: Record<Lang, string> = {
  id: 'Relief: Copernicus DEM GLO-90 (© DLR e.V. 2010-2014, © Airbus Defence and Space GmbH 2014-2018, disediakan dalam program COPERNICUS oleh Uni Eropa dan ESA).',
  en: 'Relief: Copernicus DEM GLO-90 (© DLR e.V. 2010-2014, © Airbus Defence and Space GmbH 2014-2018, provided under COPERNICUS by the European Union and ESA).',
};

export function Layout({ children, lang, onLang, page, onPage }: LayoutProps) {
  const tabs: { id: Exclude<Page, 'notfound'>; text: string }[] = [
    { id: 'plan', text: t(lang, 'navPlan') },
    { id: 'coop', text: t(lang, 'navCoop') },
    { id: 'report', text: t(lang, 'navReport') },
    { id: 'data', text: t(lang, 'navData') },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <a className="skip-link" href="#main">{lang === 'id' ? 'Lewati ke isi' : 'Skip to content'}</a>
      <Box component="header" className="no-print" sx={{ position: 'sticky', top: 0, zIndex: 1100, bgcolor: 'rgba(244,247,248,0.94)', backdropFilter: 'saturate(1.2) blur(8px)', borderBottom: `1px solid ${UI.line}` }}>
        <Box sx={{ maxWidth: 1760, mx: 'auto', px: { xs: 2, md: 3 }, minHeight: 56, display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'center', columnGap: { xs: 1.5, md: 3 } }}>
          <ButtonBase component="a" href={PATHS.plan} onClick={(e: React.MouseEvent) => onNav(e, () => onPage('plan'))} className="wordmark" sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 56, ...focus }} aria-label="NusaFleet">
            <Mark />
            <Typography component="span" sx={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.02em', color: UI.ink }}>
              NusaFleet
            </Typography>
          </ButtonBase>
          {/* What this is, in one line: the page title on the plan view */}
          <Typography
            component={page === 'plan' ? 'h1' : 'p'}
            sx={{ order: { xs: 4, md: 0 }, width: { xs: '100%', md: 'auto' }, m: 0, pb: { xs: 1, md: 0 }, pl: { md: 2 }, borderLeft: { md: `1px solid ${UI.line}` }, fontSize: { xs: '0.78rem', md: '0.82rem' }, fontWeight: 400, lineHeight: 1.35, color: UI.muted, display: { xs: page === 'plan' ? 'block' : 'none', md: 'none', lg: 'block' } }}
          >
            {t(lang, 'tagline')}
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />

          <Box component="nav" aria-label={lang === 'id' ? 'Menu utama' : 'Main menu'} sx={{ order: { xs: 3, md: 0 }, width: { xs: '100%', md: 'auto' }, height: { xs: 40, md: 56 }, display: 'flex', alignSelf: 'stretch', gap: { xs: 2, md: 3 }, overflowX: 'auto', scrollbarWidth: 'none', borderTop: { xs: `1px solid ${UI.line}`, md: 'none' } }}>
            {tabs.map((tab) => {
              const active = page === tab.id;
              return (
                <ButtonBase
                  key={tab.id}
                  component="a"
                  href={PATHS[tab.id]}
                  onClick={(e: React.MouseEvent) => onNav(e, () => onPage(tab.id))}
                  aria-current={active ? 'page' : undefined}
                  className="draw-line"
                  sx={{ fontSize: '0.86rem', fontWeight: active ? 500 : 400, fontFamily: 'inherit', whiteSpace: 'nowrap', color: active ? UI.ink : UI.muted, transition: 'color 120ms', '&:hover': { color: UI.ink }, ...focus }}
                >
                  {tab.text}
                </ButtonBase>
              );
            })}
          </Box>

          <Box role="group" aria-label={lang === 'id' ? 'Bahasa' : 'Language'} sx={{ display: 'flex', alignItems: 'center', gap: 0.25, fontSize: '0.8rem', color: UI.faint, ml: { xs: 'auto', md: 0 }, height: 56 }}>
            {(['id', 'en'] as Lang[]).map((code, i) => (
              <React.Fragment key={code}>
                {i > 0 ? <span aria-hidden="true">/</span> : null}
                <ButtonBase
                  onClick={() => onLang(code)}
                  aria-pressed={lang === code}
                  className="draw-line"
                  sx={{ minWidth: 32, minHeight: 32, px: 0.5, fontSize: '0.8rem', fontWeight: 500, fontFamily: 'inherit', color: lang === code ? UI.ink : UI.muted, '&:hover': { color: UI.ink }, ...focus }}
                >
                  {code.toUpperCase()}
                </ButtonBase>
              </React.Fragment>
            ))}
          </Box>
        </Box>
      </Box>

      <Box component="main" id="main" tabIndex={-1} sx={{ flexGrow: 1, width: '100%', maxWidth: 1760, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 2, md: 2.5 }, minHeight: '100svh', outline: 'none' }}>
        {children}
      </Box>

      <Box component="footer" className="no-print" sx={{ maxWidth: 1760, mx: 'auto', px: { xs: 2, md: 3 }, pb: 3, width: '100%' }}>
        <Box sx={{ borderTop: `1px solid ${UI.line}`, pt: 2, display: 'grid', gap: 0.5 }}>
          {(['neutral', 'attribution'] as const).map((key) => (
            <Typography key={key} sx={{ fontSize: '0.72rem', color: UI.muted, lineHeight: 1.55 }}>
              {t(lang, key)}
            </Typography>
          ))}
          <Typography sx={{ fontSize: '0.72rem', color: UI.muted, lineHeight: 1.55 }}>{CREDIT[lang]}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

/** The 404, in the site's own voice: same header, a way back to the chart. */
export function NotFound({ lang, onHome }: { lang: Lang; onHome: () => void }) {
  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', pt: { xs: 6, md: 12 } }}>
      <Typography sx={{ fontSize: '0.85rem', fontStyle: 'italic', color: UI.muted }}>404</Typography>
      <Typography component="h1" sx={{ mt: 1, fontSize: { xs: '2.6rem', md: '4.2rem' }, fontWeight: 600, fontStretch: '72%', lineHeight: 0.95 }}>
        {lang === 'id' ? 'Rute ini tidak ada di peta' : 'This route is not on the chart'}
      </Typography>
      <Typography sx={{ mt: 2, maxWidth: 560, fontSize: '1.02rem', lineHeight: 1.55, color: UI.muted }}>
        {lang === 'id'
          ? 'Alamat ini tidak menuju halaman mana pun. Lima rute yang kami hitung ada di halaman rencana.'
          : 'This address leads nowhere. The five routes we plan are on the plan page.'}
      </Typography>
      <ButtonBase component="a" href={PATHS.plan} onClick={(e: React.MouseEvent) => onNav(e, onHome)} className="flood" sx={{ mt: 3, height: 44, px: 2.5, borderRadius: '3px', border: `1px solid ${UI.ink}`, fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 500, color: UI.ink, ...focus }}>
        {lang === 'id' ? 'Kembali ke rencana' : 'Back to the plan'}
      </ButtonBase>
    </Box>
  );
}
