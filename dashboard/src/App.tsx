// Page composition: headline band, then one dark console (controls + map),
// then the supporting analysis. Built on the Kopibara dashboard stack.
import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { HeatmapChart, ParetoChart } from './components/Charts';
import { ComparisonTable } from './components/ComparisonTable';
import { PrioritySlider, ScenarioTimeline, scenarioShort } from './components/Controls';
import { DataPage } from './components/DataPage';
import { FleetStrip } from './components/FleetTable';
import { KpiBand } from './components/HeroPanel';
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

type Tab = 'fleet' | 'pareto' | 'heat' | 'compare' | 'whatif';

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
  const [tab, setTab] = useState<Tab>('fleet');
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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'fleet', label: t(lang, 'tabFleet') },
    { id: 'pareto', label: t(lang, 'tabPareto') },
    { id: 'heat', label: t(lang, 'tabHeat') },
    { id: 'compare', label: t(lang, 'tabCompare') },
    // The live sliders need the solver API; without it the tab is left out
    ...(live.apiOnline === true ? [{ id: 'whatif' as Tab, label: t(lang, 'tabWhatIf') }] : []),
  ];
  const shownTab: Tab = tabs.some((x) => x.id === tab) ? tab : 'fleet';
  const pickPoint = (i: number) => {
    setOverrides({});
    setPlanIndex(i);
  };

  return shell(
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 436px' }, gap: 2, height: { lg: 'calc(100vh - 56px - 48px)' }, minHeight: { lg: 640 } }}>
      {/* Left: one dark console, controls on top and the map filling the rest */}
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRadius: '24px', overflow: 'hidden', bgcolor: '#06252b' }}>
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2, pb: 3.5, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr' }, columnGap: 5, rowGap: 4, flexShrink: 0 }}>
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
          <PrioritySlider lang={lang} points={result.pareto} index={index} onSelect={pickPoint} />
        </Box>
        <Box sx={{ flex: 1, minHeight: { xs: 460, lg: 0 } }}>
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
      </Box>

      {/* Right: headline numbers always visible, details one tab away */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0, overflowY: { lg: 'auto' }, pr: { lg: 0.5 } }}>
        <KpiBand lang={lang} plan={plan} base={base} caption={`${planName}, ${scenarioName(scenarioId)}`} />

        <Box role="tablist" aria-label={t(lang, 'detailTabs')} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, flexShrink: 0 }}>
          {tabs.map((x) => {
            const on = x.id === shownTab;
            return (
              <ButtonBase
                key={x.id}
                role="tab"
                aria-selected={on}
                onClick={() => setTab(x.id)}
                sx={{ height: 32, px: 1.2, borderRadius: '999px', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', color: on ? '#ffffff' : 'text.secondary', bgcolor: on ? '#06252b' : '#ffffff', border: '1px solid', borderColor: on ? '#06252b' : '#dde6e4', '&:hover': { borderColor: '#06252b' }, '&.Mui-focusVisible': { outline: '2px solid #009688', outlineOffset: 2 } }}
              >
                {x.label}
              </ButtonBase>
            );
          })}
        </Box>

        <Box role="tabpanel" sx={{ flexShrink: 0 }}>
          {shownTab === 'fleet' ? <FleetStrip lang={lang} routes={summary.routes} today={todayFleet} plan={plan.fleet_plan} safetyToday={base.avg_safety_score} safetyPlan={plan.avg_safety_score} /> : null}
          {shownTab === 'pareto' ? <ParetoChart lang={lang} results={results} activeId={scenarioId} selectedIndex={index} onSelect={pickPoint} /> : null}
          {shownTab === 'heat' ? <HeatmapChart lang={lang} result={result} /> : null}
          {shownTab === 'compare' ? <ComparisonTable lang={lang} results={results} activeId={scenarioId} planLabel={sliderPlan.label ?? 'balanced'} /> : null}
          {shownTab === 'whatif' ? <WhatIfPanel lang={lang} knobs={knobs} overrides={overrides} onChange={setOverrides} state={live.state} message={live.message} /> : null}
        </Box>
      </Box>

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
