// App shell: a quiet paper header (wordmark, four text links, language) and a short footer.
import * as React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { UI } from '../colors';
import { t } from '../i18n';
import type { Lang } from '../types';

export type Page = 'plan' | 'coop' | 'report' | 'data';

interface LayoutProps {
  children: React.ReactNode;
  lang: Lang;
  onLang: (lang: Lang) => void;
  page: Page;
  onPage: (page: Page) => void;
}

const focus = { '&.Mui-focusVisible': { outline: `2px solid ${UI.accent}`, outlineOffset: 2, borderRadius: '4px' } } as const;

/** Wordmark glyph: a hull on a waterline, drawn in two strokes. */
function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 13.5h18l-2.6 4.2a2 2 0 0 1-1.7.9H7.3a2 2 0 0 1-1.7-.9L3 13.5Z" fill={UI.ink} />
      <path d="M8 13.5V9.5h6.5l2 4" stroke={UI.ink} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M2 21.2c1.7 0 1.7-.9 3.3-.9s1.7.9 3.4.9 1.6-.9 3.3-.9 1.7.9 3.3.9 1.7-.9 3.4-.9 1.6.9 3.3.9" stroke={UI.accent} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Layout({ children, lang, onLang, page, onPage }: LayoutProps) {
  const tabs: { id: Page; text: string }[] = [
    { id: 'plan', text: t(lang, 'navPlan') },
    { id: 'coop', text: t(lang, 'navCoop') },
    { id: 'report', text: t(lang, 'navReport') },
    { id: 'data', text: t(lang, 'navData') },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Box component="header" className="no-print" sx={{ position: 'sticky', top: 0, zIndex: 1100, bgcolor: 'rgba(244,247,248,0.92)', backdropFilter: 'saturate(1.2) blur(8px)', borderBottom: `1px solid ${UI.line}` }}>
        <Box sx={{ maxWidth: 1760, mx: 'auto', px: { xs: 2, md: 3 }, minHeight: 56, display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'center', columnGap: { xs: 1.5, md: 3 } }}>
          <ButtonBase onClick={() => onPage('plan')} sx={{ display: 'flex', alignItems: 'center', gap: 1, ...focus }} aria-label="NusaFleet">
            <Mark />
            <Typography component="span" sx={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.02em', color: UI.ink }}>
              NusaFleet
            </Typography>
          </ButtonBase>
          <Typography component="span" sx={{ display: { xs: 'none', lg: 'block' }, fontSize: '0.82rem', color: UI.muted, pl: 2, borderLeft: `1px solid ${UI.line}` }}>
            {t(lang, 'tagline')}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Box component="nav" sx={{ order: { xs: 3, md: 0 }, width: { xs: '100%', md: 'auto' }, height: { xs: 40, md: 56 }, display: 'flex', alignSelf: 'stretch', gap: { xs: 2, md: 3 }, overflowX: 'auto', scrollbarWidth: 'none', borderTop: { xs: `1px solid ${UI.line}`, md: 'none' } }}>
            {tabs.map((tab) => {
              const active = page === tab.id;
              return (
                <ButtonBase
                  key={tab.id}
                  onClick={() => onPage(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className="draw-line"
                  sx={{ fontSize: '0.86rem', fontWeight: active ? 500 : 400, fontFamily: 'inherit', whiteSpace: 'nowrap', color: active ? UI.ink : UI.muted, transition: 'color 120ms', '&:hover': { color: UI.ink }, ...focus }}
                >
                  {tab.text}
                </ButtonBase>
              );
            })}
          </Box>

          <Box role="group" aria-label="Language" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.8rem', color: UI.faint, ml: { xs: 'auto', md: 0 }, height: 56 }}>
            {(['id', 'en'] as Lang[]).map((code, i) => (
              <React.Fragment key={code}>
                {i > 0 ? <span aria-hidden="true">/</span> : null}
                <ButtonBase
                  onClick={() => onLang(code)}
                  aria-pressed={lang === code}
                  sx={{ fontSize: '0.8rem', fontWeight: 500, fontFamily: 'inherit', color: lang === code ? UI.ink : UI.faint, '&:hover': { color: UI.ink }, ...focus }}
                >
                  {code.toUpperCase()}
                </ButtonBase>
              </React.Fragment>
            ))}
          </Box>
        </Box>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: '100%', maxWidth: 1760, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 2, md: 2.5 } }}>
        {children}
      </Box>

      <Box component="footer" className="no-print" sx={{ maxWidth: 1760, mx: 'auto', px: { xs: 2, md: 3 }, pb: 3, width: '100%' }}>
        <Box sx={{ borderTop: `1px solid ${UI.line}`, pt: 2, display: 'grid', gap: 0.5 }}>
          {(['neutral', 'attribution'] as const).map((key) => (
            <Typography key={key} sx={{ fontSize: '0.72rem', color: UI.muted, lineHeight: 1.55 }}>
              {t(lang, key)}
            </Typography>
          ))}
          <Typography sx={{ fontSize: '0.72rem', color: UI.muted, lineHeight: 1.55 }}>
            Relief: Copernicus DEM GLO-90 (© DLR e.V. 2010-2014, © Airbus Defence and Space GmbH 2014-2018, provided under COPERNICUS by the European Union and ESA).
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
