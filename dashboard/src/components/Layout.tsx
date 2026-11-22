// App shell: one slim dark bar (wordmark, two tabs, language) and a short footer.
import * as React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { Ship } from 'lucide-react';

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

const INK = '#06252b';
const MINT = '#7fe3d2';

export function Layout({ children, lang, onLang, page, onPage }: LayoutProps) {
  const tabs: { id: Page; text: string }[] = [
    { id: 'plan', text: t(lang, 'navPlan') },
    { id: 'coop', text: t(lang, 'navCoop') },
    { id: 'report', text: t(lang, 'navReport') },
    { id: 'data', text: t(lang, 'navData') },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Box component="header" className="no-print" sx={{ position: 'sticky', top: 0, zIndex: 1100, bgcolor: INK, color: '#ffffff' }}>
        <Box sx={{ maxWidth: 1760, mx: 'auto', px: { xs: 2, md: 3 }, height: 56, display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: MINT }}>
            <Ship size={22} />
            <Typography component="span" sx={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#ffffff' }}>
              NusaFleet
            </Typography>
          </Box>
          <Typography component="span" sx={{ display: { xs: 'none', lg: 'block' }, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
            {t(lang, 'tagline')}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Box component="nav" sx={{ display: 'flex', alignSelf: 'stretch', gap: { xs: 0.5, md: 1 } }}>
            {tabs.map((tab) => {
              const active = page === tab.id;
              return (
                <ButtonBase
                  key={tab.id}
                  onClick={() => onPage(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  sx={{ px: { xs: 1, md: 1.5 }, fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap', color: active ? '#ffffff' : 'rgba(255,255,255,0.7)', borderBottom: '3px solid', borderColor: active ? MINT : 'transparent', borderTop: '3px solid transparent', '&:hover': { color: '#ffffff' }, '&.Mui-focusVisible': { outline: `2px solid ${MINT}`, outlineOffset: -4 } }}
                >
                  {tab.text}
                </ButtonBase>
              );
            })}
          </Box>

          <Box role="group" aria-label="Language" sx={{ display: 'flex', p: '3px', borderRadius: '999px', bgcolor: 'rgba(255,255,255,0.1)' }}>
            {(['id', 'en'] as Lang[]).map((code) => (
              <ButtonBase
                key={code}
                onClick={() => onLang(code)}
                aria-pressed={lang === code}
                sx={{ px: 1.25, height: 26, borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'inherit', color: lang === code ? INK : 'rgba(255,255,255,0.8)', bgcolor: lang === code ? MINT : 'transparent', '&.Mui-focusVisible': { outline: `2px solid ${MINT}`, outlineOffset: 2 } }}
              >
                {code.toUpperCase()}
              </ButtonBase>
            ))}
          </Box>
        </Box>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: '100%', maxWidth: 1760, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
        {children}
      </Box>

      <Box component="footer" className="no-print" sx={{ maxWidth: 1760, mx: 'auto', px: { xs: 2, md: 3 }, pb: 3, width: '100%' }}>
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, display: 'grid', gap: 0.5 }}>
          {(['neutral', 'placeholderWarn', 'attribution'] as const).map((key) => (
            <Typography key={key} sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.5 }}>
              {t(lang, key)}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
