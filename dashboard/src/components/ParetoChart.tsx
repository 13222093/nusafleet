import {
  CartesianGrid,
  Label,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { num, rpBn, t } from "../i18n";
import type { Lang, ScenarioResult } from "../types";

interface Props {
  lang: Lang;
  results: Record<string, ScenarioResult>;
  activeId: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

interface Datum {
  x: number;
  y: number;
  index: number;
  scenario: string;
  plug: number;
  planLabel: string | null;
}

const INK = "#0b0b0b";
const MUTED = "#a3a29c";

export function ParetoChart({
  lang,
  results,
  activeId,
  selectedIndex,
  onSelect,
}: Props) {
  const label = (id: string) =>
    lang === "id" ? results[id].scenario.label_id : results[id].scenario.label_en;

  const series = (id: string): Datum[] =>
    results[id].pareto.map((p, index) => ({
      x: p.co2_t / 1000,
      y: p.cost_rp / 1e9,
      index,
      scenario: label(id),
      plug: p.plug_in_trip_share_pct,
      planLabel: p.label,
    }));

  const others = Object.keys(results).filter((id) => id !== activeId);
  const active = series(activeId);
  const all = [...active, ...others.flatMap(series)];
  const xs = all.map((d) => d.x);
  const ys = all.map((d) => d.y);
  const pad = (lo: number, hi: number) => Math.max((hi - lo) * 0.12, 0.2);
  const xDomain = [
    Math.floor((Math.min(...xs) - pad(Math.min(...xs), Math.max(...xs))) * 10) / 10,
    Math.ceil((Math.max(...xs) + pad(Math.min(...xs), Math.max(...xs))) * 10) / 10,
  ];
  const yDomain = [
    Math.floor(Math.min(...ys) - pad(Math.min(...ys), Math.max(...ys))),
    Math.ceil(Math.max(...ys) + pad(Math.min(...ys), Math.max(...ys))),
  ];

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 16, right: 24, bottom: 36, left: 16 }}>
          <CartesianGrid stroke="#e8e7e2" />
          <XAxis
            type="number"
            dataKey="x"
            domain={xDomain}
            tickFormatter={(v: number) => num(lang, v, 1)}
            stroke="#52514e"
            fontSize={12}
          >
            <Label
              value={t(lang, "axisCo2")}
              position="bottom"
              offset={12}
              fill="#52514e"
              fontSize={12}
            />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            domain={yDomain}
            tickFormatter={(v: number) => num(lang, v, 0)}
            stroke="#52514e"
            fontSize={12}
          >
            <Label
              value={t(lang, "axisCost")}
              angle={-90}
              position="insideLeft"
              fill="#52514e"
              fontSize={12}
              style={{ textAnchor: "middle" }}
            />
          </YAxis>
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active: on, payload }) => {
              if (!on || !payload?.length) return null;
              const d = payload[0].payload as Datum;
              return (
                <div className="tooltip">
                  <strong>{d.scenario}</strong>
                  {d.planLabel ? <div>{t(lang, d.planLabel as "balanced")}</div> : null}
                  <div>{rpBn(lang, d.y * 1e9)}</div>
                  <div>CO2: {num(lang, d.x * 1000)} t</div>
                  <div>
                    {t(lang, "colPlug")}: {num(lang, d.plug)}%
                  </div>
                </div>
              );
            }}
          />
          {others.map((id) => (
            <Scatter
              key={id}
              name={label(id)}
              data={series(id)}
              fill={MUTED}
              line={{ stroke: MUTED, strokeWidth: 2 }}
              shape="circle"
              isAnimationActive={false}
            />
          ))}
          <Scatter
            name={label(activeId)}
            data={active}
            fill={INK}
            line={{ stroke: INK, strokeWidth: 2 }}
            isAnimationActive={false}
            onClick={(d: unknown) => onSelect((d as Datum).index)}
            shape={(props: unknown) => {
              const { cx, cy, payload } = props as {
                cx: number;
                cy: number;
                payload: Datum;
              };
              const selected = payload.index === selectedIndex;
              return (
                <g style={{ cursor: "pointer" }}>
                  <circle cx={cx} cy={cy} r={14} fill="transparent" />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={selected ? 8 : 5}
                    fill={selected ? "#fcfcfb" : INK}
                    stroke={INK}
                    strokeWidth={selected ? 4 : 2}
                  />
                </g>
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="legend">
        <span className="legend-item">
          <span className="swatch-line" style={{ background: INK }} />
          {label(activeId)}
        </span>
        {others.map((id) => (
          <span key={id} className="legend-item">
            <span className="swatch-line" style={{ background: MUTED }} />
            {label(id)}
          </span>
        ))}
      </div>
    </div>
  );
}
