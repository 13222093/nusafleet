import { useEffect, useState } from "react";
import { VESSEL_COLOR } from "./colors";
import { EstimateBadge } from "./components/Badge";
import { DataPage } from "./components/DataPage";
import { Heatmap } from "./components/Heatmap";
import { MapView, vesselLabel } from "./components/MapView";
import { ParetoChart } from "./components/ParetoChart";
import { num, rpBn, signed, t } from "./i18n";
import type { Lang, ScenarioResult, Summary } from "./types";

type Page = "plan" | "data";

async function loadJson<T>(name: string): Promise<T> {
  const response = await fetch(`./data/${name}.json`);
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  return (await response.json()) as T;
}

export default function App() {
  const [lang, setLang] = useState<Lang>("id");
  const [page, setPage] = useState<Page>("plan");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [results, setResults] = useState<Record<string, ScenarioResult>>({});
  const [scenarioId, setScenarioId] = useState<string>("");
  const [planIndex, setPlanIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await loadJson<Summary>("summary");
        const loaded = await Promise.all(
          s.scenario_ids.map((id) => loadJson<ScenarioResult>(id)),
        );
        setSummary(s);
        setResults(
          Object.fromEntries(s.scenario_ids.map((id, i) => [id, loaded[i]])),
        );
        setScenarioId(s.scenario_ids[0]);
      } catch {
        setFailed(true);
      }
    })();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  if (failed) return <p className="status">{t(lang, "loadError")}</p>;
  if (!summary || !results[scenarioId]) {
    return <p className="status">{t(lang, "loading")}</p>;
  }

  const result = results[scenarioId];
  const index = Math.min(planIndex, result.pareto.length - 1);
  const plan = result.pareto[index];
  const base = result.baseline.kpis;
  const scenarioLabel = (id: string) =>
    lang === "id" ? results[id].scenario.label_id : results[id].scenario.label_en;

  const costDelta = plan.cost_rp - base.annual_cost_rp;
  const co2Delta = plan.co2_t - base.co2_t;
  const reliabilityGain = plan.reliability_pct - base.reliability_pct;
  const cancelledAvoided =
    (reliabilityGain / 100) * base.scheduled_trips_per_year;

  const namedPlans = result.pareto
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.label !== null);

  const selectScenario = (id: string) => {
    // Keep the same kind of plan when switching scenario, if it exists there
    const wanted = plan.label;
    const next = results[id].pareto.findIndex((p) => p.label === wanted);
    setScenarioId(id);
    setPlanIndex(next >= 0 ? next : 0);
  };

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>NusaFleet</h1>
          <p className="tagline">{t(lang, "tagline")}</p>
        </div>
        <nav className="top-actions">
          <div className="seg" role="tablist">
            {(["plan", "data"] as Page[]).map((p) => (
              <button
                key={p}
                role="tab"
                aria-selected={page === p}
                className={page === p ? "on" : ""}
                onClick={() => setPage(p)}
              >
                {t(lang, p === "plan" ? "navPlan" : "navData")}
              </button>
            ))}
          </div>
          <div className="seg" aria-label="Language">
            {(["id", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                aria-pressed={lang === l}
                className={lang === l ? "on" : ""}
                onClick={() => setLang(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <p className="notice">
        {t(lang, "placeholderWarn")} {t(lang, "neutral")}
      </p>

      {page === "data" ? (
        <DataPage lang={lang} summary={summary} />
      ) : (
        <div className="stack">
          <section className="filters">
            <div>
              <span className="filter-label">{t(lang, "scenario")}</span>
              <div className="seg">
                {summary.scenario_ids.map((id) => (
                  <button
                    key={id}
                    aria-pressed={id === scenarioId}
                    className={id === scenarioId ? "on" : ""}
                    onClick={() => selectScenario(id)}
                  >
                    {scenarioLabel(id)}
                    <small>{results[id].scenario.available_from_year}</small>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="filter-label">{t(lang, "plan")}</span>
              <div className="seg">
                {namedPlans.map(({ p, i }) => (
                  <button
                    key={i}
                    aria-pressed={i === index}
                    className={i === index ? "on" : ""}
                    onClick={() => setPlanIndex(i)}
                  >
                    {t(lang, p.label as "balanced")}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="kpis">
            <div className="kpi">
              <span className="kpi-label">
                {t(lang, "kpiCost")} <EstimateBadge lang={lang} />
              </span>
              <span className="kpi-value">{rpBn(lang, plan.cost_rp)}</span>
              <span className="kpi-sub">
                {signed(lang, costDelta / 1e9, 1)} {lang === "id" ? "miliar" : "bn"}{" "}
                {t(lang, "vsToday")}
              </span>
            </div>
            <div className="kpi">
              <span className="kpi-label">
                {t(lang, "kpiCo2")} <EstimateBadge lang={lang} />
              </span>
              <span className="kpi-value">{num(lang, plan.co2_t)} t</span>
              <span className="kpi-sub">
                {signed(lang, co2Delta)} t (
                {signed(lang, (100 * co2Delta) / base.co2_t)}%) {t(lang, "vsToday")}
              </span>
            </div>
            <div className="kpi">
              <span className="kpi-label">
                {t(lang, "kpiReliability")} <EstimateBadge lang={lang} />
              </span>
              <span className="kpi-value">
                {num(lang, plan.reliability_pct, 1)}%
              </span>
              <span className="kpi-sub">
                {t(lang, "today")}: {num(lang, base.reliability_pct, 1)}%
              </span>
            </div>
            <div className="kpi">
              <span className="kpi-label">
                {t(lang, "kpiCancelled")} <EstimateBadge lang={lang} />
              </span>
              <span className="kpi-value">{num(lang, cancelledAvoided)}</span>
              <span className="kpi-sub">{t(lang, "perYear")}</span>
            </div>
            <div className="kpi">
              <span className="kpi-label">
                {t(lang, "kpiCapex")} <EstimateBadge lang={lang} />
              </span>
              <span className="kpi-value">{rpBn(lang, plan.capex_rp, 0)}</span>
              <span className="kpi-sub">
                {t(lang, "kpiChargers")}:{" "}
                {plan.chargers.length
                  ? plan.chargers.map((c) => c.port_name).join(", ")
                  : t(lang, "none")}
              </span>
            </div>
          </section>

          <section className="grid-2">
            <div className="card">
              <h2>{t(lang, "mapTitle")}</h2>
              <MapView
                lang={lang}
                routes={summary.routes}
                ports={summary.ports}
                vesselTypes={summary.vessel_types}
                fleet={plan.fleet_plan}
                chargers={plan.chargers}
              />
              <p className="note">{t(lang, "mapNote")}</p>
            </div>
            <div className="card">
              <h2>
                {t(lang, "fleetTable")} <EstimateBadge lang={lang} />
              </h2>
              <div className="table-scroll">
                <table className="data">
                  <thead>
                    <tr>
                      <th>{t(lang, "colRoute")}</th>
                      <th>{t(lang, "colVessel")}</th>
                      <th className="r">{t(lang, "colCount")}</th>
                      <th className="r">{t(lang, "colTrips")}</th>
                      <th className="r">{t(lang, "colOpDays")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.fleet_plan.map((row) => (
                      <tr key={`${row.route_id}-${row.vessel_type}`}>
                        <td>{row.route_name}</td>
                        <td>
                          <span
                            className="dot"
                            style={{ background: VESSEL_COLOR[row.vessel_type] }}
                          />
                          {vesselLabel(summary.vessel_types, row.vessel_type, lang)}
                        </td>
                        <td className="r">{row.count}</td>
                        <td className="r">{row.daily_trips}</td>
                        <td className="r">{num(lang, row.operable_days)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="grid-2">
            <div className="card">
              <h2>
                {t(lang, "paretoTitle")} <EstimateBadge lang={lang} />
              </h2>
              <ParetoChart
                lang={lang}
                results={results}
                activeId={scenarioId}
                selectedIndex={index}
                onSelect={setPlanIndex}
              />
              <p className="note">{t(lang, "paretoNote")}</p>
            </div>
            <div className="card">
              <h2>
                {t(lang, "heatTitle")} <EstimateBadge lang={lang} />
              </h2>
              <Heatmap lang={lang} result={result} />
              <p className="note">{t(lang, "heatNote")}</p>
            </div>
          </section>

          <section className="card">
            <h2>
              {t(lang, "tableTitle")}: {t(lang, plan.label ?? "balanced")}{" "}
              <EstimateBadge lang={lang} />
            </h2>
            <div className="table-scroll">
              <table className="data">
                <thead>
                  <tr>
                    <th>{t(lang, "colScenario")}</th>
                    <th className="r">{t(lang, "colFrom")}</th>
                    <th className="r">{t(lang, "kpiCost")}</th>
                    <th className="r">{t(lang, "kpiCapex")}</th>
                    <th className="r">{t(lang, "kpiCo2")}</th>
                    <th className="r">{t(lang, "kpiReliability")}</th>
                    <th className="r">{t(lang, "colPlug")}</th>
                    <th className="r">{t(lang, "kpiChargers")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{t(lang, "today")}</td>
                    <td className="r">2026</td>
                    <td className="r">{rpBn(lang, base.annual_cost_rp)}</td>
                    <td className="r">{rpBn(lang, 0, 0)}</td>
                    <td className="r">{num(lang, base.co2_t)} t</td>
                    <td className="r">{num(lang, base.reliability_pct, 1)}%</td>
                    <td className="r">0%</td>
                    <td className="r">0</td>
                  </tr>
                  {summary.scenario_ids.map((id) => {
                    const pts = results[id].pareto;
                    const match =
                      pts.find((p) => p.label === plan.label) ?? pts[0];
                    return (
                      <tr key={id} className={id === scenarioId ? "active" : ""}>
                        <td>{scenarioLabel(id)}</td>
                        <td className="r">
                          {results[id].scenario.available_from_year}
                        </td>
                        <td className="r">{rpBn(lang, match.cost_rp)}</td>
                        <td className="r">{rpBn(lang, match.capex_rp, 0)}</td>
                        <td className="r">{num(lang, match.co2_t)} t</td>
                        <td className="r">
                          {num(lang, match.reliability_pct, 1)}%
                        </td>
                        <td className="r">
                          {num(lang, match.plug_in_trip_share_pct)}%
                        </td>
                        <td className="r">{match.chargers.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      <footer className="foot">{t(lang, "attribution")}</footer>
    </div>
  );
}
