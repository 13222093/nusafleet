// Page composition follows the Kopibara dashboard (header, KPI grid, chart
// rows, fleet table), re-targeted to the NusaFleet scenario outputs.
import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import { CarbonSensitivityChart, HeatmapChart, ParetoChart, VesselMixChart } from './components/Charts';
import { ComparisonTable } from './components/ComparisonTable';
import { AmbitionSlider, ScenarioTimeline } from './components/Controls';
import { DataPage } from './components/DataPage';
import { FleetTable } from './components/FleetTable';
import { HeroPanel } from './components/HeroPanel';
import { Layout } from './components/Layout';
import type { Page } from './components/Layout';
import { MapView } from './components/MapView';
import { RouteDrawer } from './components/RouteDrawer';
import { num, rpBn, t } from './i18n';
import type { Lang, ScenarioResult, Summary } from './types';

async function loadJson<T>(name: string): Promise<T> {
  const response = await fetch(`./data/${name}.json`);
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  return (await response.json()) as T;
}

const toggleSx = {
  bgcolor: 'background.paper',
  flexWrap: 'wrap',
  '& .MuiToggleButton-root': { textTransform: 'none', px: 2, py: 0.75, fontWeight: 600, borderRadius: 5 },
  '& .Mui-selected': { bgcolor: 'primary.main', color: '#ffffff', '&:hover': { bgcolor: 'primary.dark' } },
} as const;

function App() {
  const [lang, setLang] = useState<Lang>('id');
  const [page, setPage] = useState<Page>('plan');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [results, setResults] = useState<Record<string, ScenarioResult>>({});
  const [scenarioId, setScenarioId] = useState('');
  const [planIndex, setPlanIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [mapView, setMapView] = useState<'plan' | 'today'>('plan');
  const [routeId, setRouteId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await loadJson<Summary>('summary');
        const loaded = await Promise.all(s.scenario_ids.map((id) => loadJson<ScenarioResult>(id)));
        setSummary(s);
        setResults(Object.fromEntries(s.scenario_ids.map((id, i) => [id, loaded[i]])));
        setScenarioId(s.scenario_ids[0]);
      } catch {
        setFailed(true);
      }
    })();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const shell = (children: React.ReactNode) => (
    <Layout lang={lang} onLang={setLang} page={page} onPage={setPage}>
      {children}
    </Layout>
  );

  if (failed) return shell(<Alert severity="error">{t(lang, 'loadError')}</Alert>);
  if (!summary || !results[scenarioId]) return shell(<Typography color="text.secondary">{t(lang, 'loading')}</Typography>);

  const result = results[scenarioId];
  const index = Math.min(planIndex, result.pareto.length - 1);
  const plan = result.pareto[index];
  const base = result.baseline.kpis;
  const scenarioLabel = (id: string) => (lang === 'id' ? results[id].scenario.label_id : results[id].scenario.label_en);


  const selectScenario = (id: string) => {
    // Keep the same kind of plan when switching scenario, if it exists there
    const next = results[id].pareto.findIndex((p) => p.label === plan.label);
    setScenarioId(id);
    setPlanIndex(next >= 0 ? next : 0);
  };

  const header = (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 1 }}>
        NusaFleet
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {t(lang, 'tagline')}
      </Typography>
      {page === 'plan' ? (
        <>
          <Paper variant="outlined" sx={{ mt: 2, p: 2, display: 'inline-flex', borderRadius: 3, maxWidth: '100%' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} divider={<Divider orientation="vertical" flexItem />} spacing={2} alignItems={{ md: 'center' }}>
              <Box>
                <Typography component="span" fontWeight="bold">{t(lang, 'routes')}: </Typography>
                {summary.routes.length}
              </Box>
              <Box>
                <Typography component="span" fontWeight="bold">{t(lang, 'colDemand')}: </Typography>
                {num(lang, summary.routes.reduce((s, r) => s + r.daily_pax, 0))}
              </Box>
              <Box>
                <Typography component="span" fontWeight="bold">{t(lang, 'today')}: </Typography>
                {base.fleet_size} {t(lang, 'colCount').toLowerCase()}, {rpBn(lang, base.annual_cost_rp)}, {num(lang, base.co2_t)} t CO2
              </Box>
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ mt: 3, p: { xs: 2, md: 3 }, borderRadius: 6, display: 'flex', flexWrap: 'wrap', gap: { xs: 3, md: 6 }, alignItems: 'flex-start' }}>
            <ScenarioTimeline lang={lang} ids={summary.scenario_ids} results={results} activeId={scenarioId} onSelect={selectScenario} />
            <AmbitionSlider lang={lang} points={result.pareto} index={index} onSelect={setPlanIndex} />
          </Paper>
        </>
      ) : null}
    </Box>
  );

  if (page === 'data') {
    return shell(
      <Box sx={{ flexGrow: 1 }}>
        {header}
        <DataPage lang={lang} summary={summary} />
      </Box>,
    );
  }

  return shell(
    <Box sx={{ flexGrow: 1 }}>
      {header}

      {/* Hero: the map is the page, the three headline numbers sit beside it */}
      <Grid container spacing={3} sx={{ mb: 4, alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardHeader
              title={t(lang, 'mapTitle')}
              subheader={t(lang, 'mapNote')}
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              subheaderTypographyProps={{ variant: 'body2' }}
              action={
                <ToggleButtonGroup exclusive size="small" value={mapView} onChange={(_e, v: 'plan' | 'today' | null) => v && setMapView(v)} aria-label={t(lang, 'showOnMap')} sx={{ ...toggleSx, mt: 1, mr: 1 }}>
                  <ToggleButton value="today">{t(lang, 'today')}</ToggleButton>
                  <ToggleButton value="plan">{t(lang, 'planShort')}</ToggleButton>
                </ToggleButtonGroup>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <MapView lang={lang} routes={summary.routes} ports={summary.ports} vesselTypes={summary.vessel_types} fleet={mapView === 'today' ? result.baseline.fleet_plan : plan.fleet_plan} chargers={mapView === 'today' ? [] : plan.chargers} selectedRouteId={routeId} onRouteClick={setRouteId} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <HeroPanel lang={lang} plan={plan} base={base} scenarioLabel={scenarioLabel(scenarioId)} />
        </Grid>
      </Grid>

      {/* Fleet table */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12 }}>
          <FleetTable lang={lang} fleet={plan.fleet_plan} chargers={plan.chargers} vesselTypes={summary.vessel_types} />
        </Grid>
      </Grid>

      <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
        {t(lang, 'exploreTitle')}
      </Typography>

      <Grid container spacing={4} sx={{ mb: 4, alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <VesselMixChart lang={lang} fleet={plan.fleet_plan} vesselTypes={summary.vessel_types} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <CarbonSensitivityChart lang={lang} result={result} />
        </Grid>
      </Grid>

      {/* Analysis row */}
      <Grid container spacing={4} sx={{ mb: 4, alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <ParetoChart lang={lang} results={results} activeId={scenarioId} selectedIndex={index} onSelect={setPlanIndex} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <HeatmapChart lang={lang} result={result} />
        </Grid>
      </Grid>

      <ComparisonTable lang={lang} results={results} activeId={scenarioId} planLabel={plan.label} />

      <RouteDrawer
        lang={lang}
        route={summary.routes.find((r) => r.route_id === routeId) ?? null}
        onClose={() => setRouteId(null)}
        today={{ fleet: result.baseline.fleet_plan, routes: result.baseline.routes }}
        plan={{ fleet: plan.fleet_plan, routes: plan.routes }}
        chargers={plan.chargers}
        ports={summary.ports}
        vesselTypes={summary.vessel_types}
      />

      <Alert severity="info" variant="outlined" sx={{ mt: 4, borderRadius: 4, bgcolor: 'background.paper' }}>
        {t(lang, 'neutral')}
      </Alert>
    </Box>,
  );
}

export default App;
