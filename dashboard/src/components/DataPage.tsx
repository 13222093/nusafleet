import { num, t } from "../i18n";
import type { Lang, Summary } from "../types";

export function DataPage({ lang, summary }: { lang: Lang; summary: Summary }) {
  const basis = (x: { source: string | null; rationale: string | null }) =>
    [x.source, x.rationale].filter(Boolean).join(" ");

  return (
    <div className="stack">
      <p className="lead">{t(lang, "dataIntro")}</p>

      <section className="card">
        <h2>{t(lang, "assumptions")}</h2>
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>{t(lang, "colParam")}</th>
                <th className="r">{t(lang, "colValue")}</th>
                <th>{t(lang, "colUnit")}</th>
                <th>{t(lang, "colBasis")}</th>
                <th>{t(lang, "colConfidence")}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summary.assumptions).map(([key, a]) => (
                <tr key={key}>
                  <td>
                    <code>{key}</code>
                  </td>
                  <td className="r">
                    {num(lang, a.value, a.value < 10 ? 2 : 0)}
                  </td>
                  <td>{a.unit}</td>
                  <td>{basis(a)}</td>
                  <td>{a.confidence}</td>
                </tr>
              ))}
              {summary.scenarios.map((s) => (
                <tr key={s.id}>
                  <td>
                    <code>{s.id}</code>
                  </td>
                  <td className="r">
                    {num(lang, s.elec_price_rp_per_kwh)} /{" "}
                    {num(lang, s.grid_ef_kgco2_per_kwh, 2)}
                  </td>
                  <td>Rp/kWh / kgCO2/kWh</td>
                  <td>{[s.rationale, s.note].filter(Boolean).join(" ")}</td>
                  <td>low</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>{t(lang, "datasets")}</h2>
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>{t(lang, "colFile")}</th>
                <th>{t(lang, "colBasis")}</th>
                <th>{t(lang, "colConfidence")}</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(summary.tables).map((tb) => (
                <tr key={tb.file}>
                  <td>
                    <code>{tb.file}</code>
                  </td>
                  <td>{basis(tb)}</td>
                  <td>{tb.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>{t(lang, "vessels")}</h2>
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>{t(lang, "colVessel")}</th>
                <th className="r">{t(lang, "colCap")}</th>
                <th className="r">{t(lang, "colSpeed")}</th>
                <th className="r">{t(lang, "colHs")}</th>
                <th className="r">{t(lang, "colCapex")}</th>
                <th className="r">{t(lang, "colSafety")}</th>
                <th>{t(lang, "colNotes")}</th>
              </tr>
            </thead>
            <tbody>
              {summary.vessel_types.map((v) => (
                <tr key={v.type}>
                  <td>{lang === "id" ? v.label_id : v.label_en}</td>
                  <td className="r">{num(lang, v.cap_pax)}</td>
                  <td className="r">{num(lang, v.speed_kn)}</td>
                  <td className="r">{num(lang, v.hs_max_m, 1)}</td>
                  <td className="r">{num(lang, v.capex_rp / 1e9)}</td>
                  <td className="r">{num(lang, v.safety_score)}</td>
                  <td>{v.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>{t(lang, "routes")}</h2>
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>{t(lang, "colRoute")}</th>
                <th className="r">{t(lang, "colDistance")}</th>
                <th className="r">{t(lang, "colDemand")}</th>
                <th>{t(lang, "colConfidence")}</th>
                <th>{t(lang, "colNotes")}</th>
              </tr>
            </thead>
            <tbody>
              {summary.routes.map((r) => (
                <tr key={r.route_id}>
                  <td>{r.name}</td>
                  <td className="r">{num(lang, r.distance_nm, 1)}</td>
                  <td className="r">{num(lang, r.daily_pax)}</td>
                  <td>{r.confidence}</td>
                  <td>{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
