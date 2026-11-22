// Navigation rail layout from the Kopibara dashboard, extended with a second
// page (Data & Assumptions) and a language toggle.
import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import FactCheckIcon from '@mui/icons-material/FactCheck';

import { t } from '../i18n';
import type { Lang } from '../types';

const drawerWidth = 88; // Small "Rail" width

export type Page = 'plan' | 'data';

interface LayoutProps {
  children: React.ReactNode;
  lang: Lang;
  onLang: (lang: Lang) => void;
  page: Page;
  onPage: (page: Page) => void;
}

export function Layout({ children, lang, onLang, page, onPage }: LayoutProps) {
  const navItems: { id: Page; text: string; icon: React.ReactNode }[] = [
    { id: 'plan', text: t(lang, 'navPlan'), icon: <DashboardIcon /> },
    { id: 'data', text: t(lang, 'navData'), icon: <FactCheckIcon /> },
  ];

  const langToggle = (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={lang}
      onChange={(_e, value: Lang | null) => value && onLang(value)}
      aria-label="Language"
      orientation="vertical"
      sx={{ bgcolor: 'background.paper', '& .MuiToggleButton-root': { borderRadius: 3, px: 1.5, py: 0.5, fontWeight: 600 } }}
    >
      <ToggleButton value="id">ID</ToggleButton>
      <ToggleButton value="en">EN</ToggleButton>
    </ToggleButtonGroup>
  );

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', py: 2 }}>
      {/* Rail Logo/Icon */}
      <Box sx={{ mb: 4, mt: 1, color: 'primary.main', p: 1 }}>
        <DirectionsBoatIcon sx={{ fontSize: 28, color: 'primary.main' }} />
      </Box>

      <List sx={{ width: '100%', px: 1 }}>
        {navItems.map((item) => {
          const active = page === item.id;
          return (
            <ListItem key={item.id} disablePadding sx={{ display: 'block', mb: 3 }}>
              <ListItemButton
                selected={active}
                onClick={() => onPage(item.id)}
                sx={{
                  minHeight: 0,
                  justifyContent: 'center',
                  p: 0,
                  flexDirection: 'column',
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: 'transparent' },
                  '&.Mui-selected': { bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } },
                }}
              >
                {/* Active Indicator Pill */}
                <Box
                  sx={{
                    width: 56,
                    height: 32,
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: active ? 'primary.light' : 'transparent',
                    mb: 0.5,
                    transition: 'background-color 0.2s',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, color: active ? 'text.primary' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.72rem',
                    lineHeight: 1.2,
                    fontWeight: active ? 700 : 500,
                    color: active ? 'text.primary' : 'text.secondary',
                    textAlign: 'center',
                  }}
                >
                  {item.text}
                </Typography>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: 'auto', mb: 1 }}>{langToggle}</Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Mobile App Bar */}
      <AppBar position="fixed" sx={{ display: { sm: 'none' } }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <DirectionsBoatIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" noWrap component="div" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              NusaFleet
            </Typography>
          </Stack>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={page}
            onChange={(_e, value: Page | null) => value && onPage(value)}
          >
            {navItems.map((item) => (
              <ToggleButton key={item.id} value={item.id} aria-label={item.text}>
                {item.icon}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Toolbar>
      </AppBar>

      {/* Navigation Rail */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="navigation rail">
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none',
              bgcolor: 'background.default',
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
          maxWidth: '100vw',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar sx={{ display: { sm: 'none' } }} />

        <Box sx={{ maxWidth: 1280, mx: 'auto', flexGrow: 1, width: '100%' }}>{children}</Box>

        {/* Disclaimer Footer */}
        <Box sx={{ mt: 4, py: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ m: 0 }}>
            {t(lang, 'placeholderWarn')}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ m: 0 }}>
            {t(lang, 'attribution')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
