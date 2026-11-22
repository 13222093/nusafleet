import { useState } from "react";
import { SEQ_BLUE } from "../colors";
import { num, rpBn, t } from "../i18n";
import type { HeatCell, Lang, ScenarioResult } from "../types";

interface Props {
  lang: Lang;
  result: ScenarioResult;
}

export function Heatmap({ lang, result }: Props) {
  const { diesel_prices, elec_prices, cells } = result.sensitivity;
  const [hover, setHover] = useState<HeatCell | null>(null);

  const costs = cells.filter((c) => c.feasible).map((c) => c.cost_rp);
  const lo = Math.min(...costs);
  const hi = Math.max(...costs);
  const step = (cost: number) =>
    hi === lo
      ? 0
      : Math.min(
          SEQ_BLUE.length - 1,
          Math.floor(((cost - lo) / (hi - lo)) * SEQ_BLUE.length),
        );
  const cell = (diesel: number, elec: number) =>
    cells.find(
      (c) =>
        c.diesel_price_rp_per_l === diesel && c.elec_price_rp_per_kwh === elec,
    );

  return (
    <div className="chart">
      <table className="heat" onMouseLeave={() => setHover(null)}>
        <thead>
          <tr>
            <th className="heat-corner">
              {t(lang, "heatDiesel")} / {t(lang, "heatElec")}
            </th>
            {elec_prices.map((e) => (
              <th key={e} scope="col">
                {num(lang, e)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...diesel_prices].reverse().map((d) => (
            <tr key={d}>
              <th scope="row">{num(lang, d)}</th>
              {elec_prices.map((e) => {
                const c = cell(d, e);
                if (!c || !c.feasible) return <td key={e}>n/a</td>;
                const s = step(c.cost_rp);
                return (
                  <td
                    key={e}
                    tabIndex={0}
                    onMouseEnter={() => setHover(c)}
                    onFocus={() => setHover(c)}
                    style={{
                      background: SEQ_BLUE[s],
                      color: s >= 6 ? "#ffffff" : "#0b0b0b",
                    }}
                  >
                    <span className="heat-value">
                      {num(lang, c.cost_rp / 1e9, 1)}
                    </span>
                    {c.plug_in_trip_share_pct > 0 ? (
                      <span className="heat-tag">
                        ⚡ {num(lang, c.plug_in_trip_share_pct)}%
                      </span>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="heat-foot">
        <span className="legend-item">
          {t(lang, "heatLow")}
          <span className="ramp">
            {SEQ_BLUE.map((c) => (
              <span key={c} style={{ background: c }} />
            ))}
          </span>
          {t(lang, "heatHigh")}
        </span>
        <span className="heat-hover">
          {hover
            ? `${t(lang, "heatDiesel")} ${num(lang, hover.diesel_price_rp_per_l)}, ${t(lang, "heatElec")} ${num(lang, hover.elec_price_rp_per_kwh)}: ${rpBn(lang, hover.cost_rp)}, CO2 ${num(lang, hover.co2_t)} t, ${t(lang, "colPlug")} ${num(lang, hover.plug_in_trip_share_pct)}%`
            : ""}
        </span>
      </div>
    </div>
  );
}
