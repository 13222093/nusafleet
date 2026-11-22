// Page composition: headline band, then one dark console (controls + map),
// then the supporting analysis. Built on the Kopibara dashboard stack.
import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { HeatmapChart, ParetoChart } from './components/Charts';
import { ComparisonTable } from './components/ComparisonTable';
import { PrioritySlider, ScenarioTimeline, scenarioShort } from './components/Controls';
import { DataPage } from './components/DataPage';
import { FleetStrip } from './components/FleetTable';
import { KpiBand } from './components/HeroPanel';
import { EstimateChip } from './components/KPICard';
import { Layout } from './components/Layout';
import type { Page } from './components/Layout';
import { MapView } from './components/MapView';
import { RouteDrawer } from './components/RouteDrawer';
import { WhatIfPanel } from './components/WhatIfPanel';
import type { Knob } from './components/WhatIfPanel';
import { t } from './i18n';
import { useLiveSolve } from './live';
import type { Overrides } from './live';
import type { Lang, ParetoPoint, ScenarioResult, Summary } from './types';

async function loadJson<T>(name: string): Promise<T> {
  const response = await fetch(`./data/${name}.json`);
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  return (await response.json()) as T;
}

/** Index of the frontier point with this label, or the first point. */
function indexOfLabel(points: ParetoPoint[], label: ParetoPoint['label']): number {
  const found = points.findIndex((p) => p.label === label);
  return found >= 0 ? found : 0;
}

const PLAY_STEP_MS = 3200;

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
  const [overrides, setOverrides] = useState<Overrides>({});
  const [playing, setPlaying] = useState(false);
  const live = useLiveSolve(scenarioId, overrides);

  useEffect(() => {
    (async () => {
      try {
        const s = await loadJson<Summary>('summary');
        const loaded = await Promise.all(s.scenario_ids.map((id) => loadJson<ScenarioResult>(id)));
        const first = s.scenario_ids[0];
        setSummary(s);
        setResults(Object.fromEntries(s.scenario_ids.map((id, i) => [id, loaded[i]])));
        setScenarioId(first);
        // Open on the balanced plan: it shows the trade-off instead of an all-diesel fleet
        setPlanIndex(indexOfLabel(loaded[0].pareto, 'balanced'));
      } catch {
        setFailed(true);
      }
    })();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const currentLabel: ParetoPoint['label'] = results[scenarioId]?.pareto[planIndex]?.label ?? null;

  const selectScenario = (id: string) => {
    // Keep the same kind of plan when switching scenario
    setScenarioId(id);
    setPlanIndex(indexOfLabel(results[id].pareto, currentLabel ?? 'balanced'));
  };

  // "Play the decade": step through the supply scenarios in order, then stop
  useEffect(() => {
    if (!playing || !summary) return undefined;
    const ids = summary.scenario_ids;
    const timer = window.setTimeout(() => {
      const next = ids.indexOf(scenarioId) + 1;
      if (next >= ids.length) {
        setPlaying(false);
        return;
      }
      setScenarioId(ids[next]);
      setPlanIndex(indexOfLabel(results[ids[next]].pareto, currentLabel ?? 'balanced'));
    }, PLAY_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, scenarioId, summary, results, currentLabel]);

  const shell = (children: React.ReactNode) => (
    <Layout lang={lang} onLang={setLang} page={page} onPage={setPage}>
      {children}
    </Layout>
  );

  if (failed) return shell(<Alert severity="error">{t(lang, 'loadError')}</Alert>);
  if (!summary || !results[scenarioId]) return shell(<Typography color="text.secondary">{t(lang, 'loading')}</Typography>);
  if (page === 'data') return shell(<DataPage lang={lang} summary={summary} />);

  const result = results[scenarioId];
  const index = Math.min(planIndex, result.pareto.length - 1);
  const sliderPlan = result.pareto[index];
  // While a what-if is active, the live result replaces the plan on the map and in the numbers
  const plan = live.result?.plan ?? sliderPlan;
  const base = live.result?.base ?? result.baseline.kpis;
  const todayFleet = live.result?.baseFleet ?? result.baseline.fleet_plan;
  const todayRoutes = live.result?.baseRoutes ?? result.baseline.routes;

  const scenarioName = (id: string) => {
    const s = results[id].scenario;
    return `${s.available_from_year} ${scenarioShort(id, lang, lang === 'id' ? s.label_id : s.label_en)}`;
  };
  const planName = live.result
    ? t(lang, 'wiLive')
    : t(lang, sliderPlan.label === 'least_cost' ? 'cheapest' : sliderPlan.label === 'lowest_co2' ? 'cleanest' : sliderPlan.label === 'balanced' ? 'balanced' : 'customPlan');

  const knobs: Knob[] = [
    { key: 'diesel', label: 'wiDiesel', unit: '/ L', min: Math.min(...result.sensitivity.diesel_prices), max: Math.max(...result.sensitivity.diesel_prices), step: 100, fallback: summary.assumptions.diesel_price_rp_per_l.value },
    { key: 'elec', label: 'wiElec', unit: '/ kWh', min: Math.min(...result.sensitivity.elec_prices), max: Math.max(...result.sensitivity.elec_prices), step: 25, fallback: result.scenario.elec_price_rp_per_kwh },
    // Capped well below the sweep maximum so the base value is not jammed against the left edge
    { key: 'carbon', label: 'wiCarbon', unit: '/ t CO2', min: 0, max: 500000, step: 5000, fallback: summary.assumptions.carbon_price_rp_per_tco2.value },
  ];

  const play = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    setOverrides({});
    setMapView('plan');
    setScenarioId(summary.scenario_ids[0]);
    setPlanIndex(indexOfLabel(results[summary.scenario_ids[0]].pareto, currentLabel ?? 'balanced'));
    setPlaying(true);
  };

  return shell(
    <Box>
      <KpiBand lang={lang} plan={plan} base={base} caption={`${planName}, ${scenarioName(scenarioId)}`} />

      {/* One dark console: controls on top, the map right under them */}
      <Box sx={{ mb: 2, borderRadius: '24px', overflow: 'hidden', bgcolor: '#06252b' }}>
        <Box sx={{ px: { xs: 2, md: 3.5 }, pt: { xs: 2, md: 2.5 }, pb: { xs: 3.5, md: 4 }, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.25fr 1fr' }, columnGap: 6, rowGap: 4 }}>
          <ScenarioTimeline
            lang={lang}
            ids={summary.scenario_ids}
            results={results}
            activeId={scenarioId}
            onSelect={(id) => {
              setPlaying(false);
              selectScenario(id);
            }}
            stationCount={(id) => results[id].pareto[indexOfLabel(results[id].pareto, currentLabel ?? 'balanced')].chargers.length}
            playing={playing}
            onPlay={play}
          />
          <PrioritySlider
            lang={lang}
            points={result.pareto}
            index={index}
            onSelect={(i) => {
              setOverrides({});
              setPlanIndex(i);
            }}
          />
        </Box>
        <MapView
          lang={lang}
          routes={summary.routes}
          ports={summary.ports}
          vesselTypes={summary.vessel_types}
          fleet={mapView === 'today' ? todayFleet : plan.fleet_plan}
          chargers={mapView === 'today' ? [] : plan.chargers}
          selectedRouteId={routeId}
          onRouteClick={setRouteId}
          view={mapView}
          onView={setMapView}
        />
      </Box>

      {/* The live sliders need the solver API; without it they are left out */}
      {live.apiOnline === true ? <WhatIfPanel lang={lang} knobs={knobs} overrides={overrides} onChange={setOverrides} state={live.state} message={live.message} /> : null}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 4, mb: 2 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
          {t(lang, 'exploreTitle')}
        </Typography>
        <EstimateChip label={t(lang, 'estimate')} hint={t(lang, 'estimateHint')} />
      </Box>

      <Grid container spacing={2} sx={{ mb: 2, alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <FleetStrip lang={lang} routes={summary.routes} today={todayFleet} plan={plan.fleet_plan} safetyToday={base.avg_safety_score} safetyPlan={plan.avg_safety_score} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <ParetoChart
            lang={lang}
            results={results}
            activeId={scenarioId}
            selectedIndex={index}
            onSelect={(i) => {
              setOverrides({});
              setPlanIndex(i);
            }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <HeatmapChart lang={lang} result={result} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <ComparisonTable lang={lang} results={results} activeId={scenarioId} planLabel={sliderPlan.label ?? 'balanced'} />
        </Grid>
      </Grid>

      <RouteDrawer
        lang={lang}
        route={summary.routes.find((r) => r.route_id === routeId) ?? null}
        onClose={() => setRouteId(null)}
        today={{ fleet: todayFleet, routes: todayRoutes }}
        plan={{ fleet: plan.fleet_plan, routes: plan.routes }}
        chargers={plan.chargers}
        ports={summary.ports}
        vesselTypes={summary.vessel_types}
      />
    </Box>,
  );
}

export default App;
