import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Cpu,
  GitCompare,
  History,
  Save,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  KPI_META,
  type Kpi,
  type Scenario,
  deleteScenario,
  loadScenarios,
  runScenario,
  saveScenario,
} from "./scenario";

const SUGGESTIONS = [
  "Reforest 50M hectares in the Sahel and East Africa",
  "Raise global carbon tax by 15% starting 2027",
  "Shut down 30% of coal in India by 2032",
  "Build BRT + metro across all African cities >2M",
  "Dam the Tana river basin for 1.2 GW hydro",
];

const KPIS: Kpi[] = ["gdp", "carbon", "water", "biodiversity", "migration"];

export function ScenarioPanel() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<Scenario | null>(null);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<Scenario[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    setHistory(loadScenarios());
  }, []);

  const run = (p: string) => {
    if (!p.trim()) return;
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      setResult(runScenario(p));
      setRunning(false);
    }, 700);
  };

  const save = () => {
    if (!result) return;
    saveScenario(result);
    setHistory(loadScenarios());
  };

  const del = (id: string) => {
    deleteScenario(id);
    setHistory(loadScenarios());
    setCompareIds((ids) => ids.filter((x) => x !== id));
  };

  const toggleCompare = (id: string) =>
    setCompareIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(-3),
    );

  const comparing = useMemo(
    () => history.filter((h) => compareIds.includes(h.id)),
    [history, compareIds],
  );

  return (
    <div className="panel panel-glow pointer-events-auto w-[460px] max-w-[92vw] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-[color:var(--color-accent)]" />
        <h3 className="text-sm font-semibold">Scenario Engine</h3>
        <span className="mono ml-auto text-[10px] tracking-widest text-[color:var(--color-accent)]">
          AI · COPILOT
        </span>
        <button
          onClick={() => setShowHistory((s) => !s)}
          className={`mono ml-2 flex items-center gap-1 rounded-sm border px-2 py-1 text-[10px] tracking-widest transition ${
            showHistory
              ? "border-[color:var(--color-primary)]/60 bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-3 w-3" /> {history.length}
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(prompt);
        }}
        className="relative"
      >
        <Cpu className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Atlas: what if…"
          className="mono w-full rounded-sm border border-border bg-background/60 py-2 pl-8 pr-9 text-[12px] outline-none placeholder:text-muted-foreground/70 focus:border-[color:var(--color-primary)]/60"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm bg-[color:var(--color-primary)] p-1.5 text-[color:var(--color-primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
          disabled={running}
        >
          <Send className="h-3 w-3" />
        </button>
      </form>

      {showHistory && (
        <HistoryPanel
          history={history}
          compareIds={compareIds}
          onToggle={toggleCompare}
          onLoad={(s) => {
            setResult(s);
            setPrompt(s.prompt);
            setShowHistory(false);
          }}
          onDelete={del}
        />
      )}

      {!showHistory && !result && !running && (
        <div className="mt-3 space-y-1.5">
          <div className="hud-label">Try a scenario</div>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setPrompt(s);
                run(s);
              }}
              className="block w-full rounded-sm border border-transparent px-2 py-1.5 text-left text-[11px] text-muted-foreground hover:border-border hover:bg-card/40 hover:text-foreground"
            >
              <span className="text-[color:var(--color-primary)]">›</span> {s}
            </button>
          ))}
        </div>
      )}

      {running && (
        <div className="mt-4 space-y-2">
          <div className="hud-label">Running coupled simulation…</div>
          <div className="mono space-y-1 text-[10px] text-muted-foreground">
            <div>› loading climate · hydrology · econ submodels</div>
            <div>› spawning 1,248,576 trajectories</div>
            <div className="text-[color:var(--color-primary)]">› solving boundary conditions…</div>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-card/60">
            <div className="h-full w-1/2 bg-[color:var(--color-primary)] pulse-dot" />
          </div>
        </div>
      )}

      {!showHistory && result && (
        <ResultsView
          result={result}
          onSave={save}
          alreadySaved={!!history.find((h) => h.id === result.id)}
          onReset={() => {
            setResult(null);
            setPrompt("");
          }}
        />
      )}

      {comparing.length >= 2 && (
        <CompareDrawer scenarios={comparing} onClose={() => setCompareIds([])} />
      )}
    </div>
  );
}

/* ---------------- Results viz ---------------- */

function ResultsView({
  result,
  onSave,
  alreadySaved,
  onReset,
}: {
  result: Scenario;
  onSave: () => void;
  alreadySaved: boolean;
  onReset: () => void;
}) {
  const [active, setActive] = useState<Kpi>("carbon");
  const data = result.series.filter((p) => p.year % 1 === 0);

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-sm border-l-2 border-[color:var(--color-accent)] bg-card/40 p-2.5">
        <div className="hud-label">Atlas Brief</div>
        <p className="mt-1 text-[11px] leading-snug">{result.summary}</p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-5 gap-1.5">
        {KPIS.map((k) => {
          const v = result.totals[k];
          const m = KPI_META[k];
          const isActive = active === k;
          const good =
            (m.goodWhen === "up" && v > 0) || (m.goodWhen === "down" && v < 0);
          return (
            <button
              key={k}
              onClick={() => setActive(k)}
              className={`rounded-sm border px-1.5 py-1.5 text-left transition ${
                isActive
                  ? "border-[color:var(--color-primary)]/60 bg-[color:var(--color-primary)]/10"
                  : "border-border/60 hover:bg-card/40"
              }`}
            >
              <div className="mono truncate text-[8px] tracking-widest uppercase text-muted-foreground">
                {m.label.split(" ")[0]}
              </div>
              <div className="mono mt-0.5 text-[12px]" style={{ color: m.color }}>
                {v > 0 ? "+" : ""}
                {v.toFixed(2)}
                <span className="ml-0.5 text-[8px] opacity-70">{m.unit}</span>
              </div>
              <div
                className="mono mt-0.5 text-[8px]"
                style={{ color: good ? "var(--color-accent)" : "var(--warning)" }}
              >
                {good ? "▲ favorable" : "▼ caution"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active chart */}
      <div className="rounded-sm border border-border bg-background/40 p-2">
        <div className="mb-1 flex items-center justify-between">
          <div className="hud-label">{KPI_META[active].label} · 2020 – 2050</div>
          <span className="mono text-[9px] tracking-widest" style={{ color: KPI_META[active].color }}>
            Δ {result.totals[active] > 0 ? "+" : ""}
            {result.totals[active].toFixed(2)} {KPI_META[active].unit}
          </span>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: -4 }}>
              <XAxis
                dataKey="year"
                tick={{ fontSize: 9, fontFamily: "JetBrains Mono", fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 9, fontFamily: "JetBrains Mono", fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                width={42}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.16 0.03 240)",
                  border: "1px solid var(--color-border)",
                  fontSize: 11,
                  fontFamily: "JetBrains Mono",
                  borderRadius: 4,
                }}
              />
              <Line
                type="monotone"
                dataKey={active}
                stroke={KPI_META[active].color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={alreadySaved}
          className="mono flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 py-1.5 text-[10px] tracking-widest text-[color:var(--color-accent)] transition hover:bg-[color:var(--color-accent)]/20 disabled:opacity-50"
        >
          {alreadySaved ? <Bookmark className="h-3 w-3" /> : <Save className="h-3 w-3" />}
          {alreadySaved ? "SAVED" : "SAVE RUN"}
        </button>
        <button
          onClick={onReset}
          className="mono flex-1 rounded-sm border border-border py-1.5 text-[10px] tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← NEW SCENARIO
        </button>
      </div>
    </div>
  );
}

/* ---------------- History list ---------------- */

function HistoryPanel({
  history,
  compareIds,
  onToggle,
  onLoad,
  onDelete,
}: {
  history: Scenario[];
  compareIds: string[];
  onToggle: (id: string) => void;
  onLoad: (s: Scenario) => void;
  onDelete: (id: string) => void;
}) {
  if (history.length === 0) {
    return (
      <div className="mono mt-4 rounded-sm border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">
        No saved scenarios yet — run one and hit SAVE.
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="hud-label">History · select 2–3 to compare</div>
        <span className="mono text-[9px] tracking-widest text-[color:var(--color-primary)]">
          {compareIds.length} SELECTED
        </span>
      </div>
      <ul className="max-h-[260px] space-y-1.5 overflow-auto pr-1">
        {history.map((s) => {
          const on = compareIds.includes(s.id);
          return (
            <li
              key={s.id}
              className={`rounded-sm border p-2.5 ${
                on
                  ? "border-[color:var(--color-primary)]/60 bg-[color:var(--color-primary)]/10"
                  : "border-border bg-card/30"
              }`}
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={() => onToggle(s.id)}
                  className={`mono mt-0.5 rounded-sm border px-1.5 py-0.5 text-[9px] tracking-widest ${
                    on
                      ? "border-[color:var(--color-primary)] text-[color:var(--color-primary)]"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {on ? "✓" : "+"}
                </button>
                <button onClick={() => onLoad(s)} className="flex-1 text-left">
                  <div className="line-clamp-1 text-[11px] font-medium">{s.prompt}</div>
                  <div className="mono mt-0.5 flex gap-2 text-[9px] tracking-wider text-muted-foreground">
                    <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    <span style={{ color: "#ff7a59" }}>C {s.totals.carbon.toFixed(1)}%</span>
                    <span style={{ color: "#5eead4" }}>G {s.totals.gdp.toFixed(2)}%</span>
                    <span style={{ color: "#60a5fa" }}>W {s.totals.water.toFixed(2)}</span>
                  </div>
                </button>
                <button
                  onClick={() => onDelete(s.id)}
                  className="text-muted-foreground hover:text-[color:var(--color-destructive)]"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- Compare drawer ---------------- */

const COMPARE_COLORS = ["#5eead4", "#ff7a59", "#a78bfa"];

function CompareDrawer({
  scenarios,
  onClose,
}: {
  scenarios: Scenario[];
  onClose: () => void;
}) {
  // Merge into one chart per KPI
  const merged = useMemo(() => {
    const years = scenarios[0].series.map((p) => p.year);
    return years.map((y, i) => {
      const row: any = { year: y };
      scenarios.forEach((s, idx) => {
        const p = s.series[i];
        row[`s${idx}_gdp`] = p.gdp;
        row[`s${idx}_carbon`] = p.carbon;
        row[`s${idx}_water`] = p.water;
        row[`s${idx}_biodiversity`] = p.biodiversity;
        row[`s${idx}_migration`] = p.migration;
      });
      return row;
    });
  }, [scenarios]);

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-[color:var(--color-primary)]" />
          <span className="text-sm font-semibold">Compare Scenarios</span>
          <span className="mono text-[10px] tracking-widest text-muted-foreground">
            · {scenarios.length} runs · 2020–2050
          </span>
        </div>
        <button
          onClick={onClose}
          className="mono flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[10px] tracking-widest text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" /> CLOSE
        </button>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        {scenarios.map((s, i) => (
          <div
            key={s.id}
            className="flex items-center gap-2 rounded-sm border border-border bg-card/40 px-2.5 py-1.5"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: COMPARE_COLORS[i] }} />
            <span className="line-clamp-1 text-[11px]">{s.prompt}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {KPIS.map((k) => (
          <div key={k} className="rounded-sm border border-border bg-background/50 p-2">
            <div className="hud-label mb-1">{KPI_META[k].label}</div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={merged} margin={{ top: 4, right: 4, left: -28, bottom: -4 }}>
                  <XAxis dataKey="year" hide />
                  <YAxis
                    tick={{ fontSize: 8, fontFamily: "JetBrains Mono", fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.16 0.03 240)",
                      border: "1px solid var(--color-border)",
                      fontSize: 10,
                      fontFamily: "JetBrains Mono",
                    }}
                  />
                  {scenarios.map((_, idx) => (
                    <Line
                      key={idx}
                      type="monotone"
                      dataKey={`s${idx}_${k}`}
                      stroke={COMPARE_COLORS[idx]}
                      strokeWidth={1.8}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mono mt-1 grid grid-cols-3 gap-1 text-[9px]">
              {scenarios.map((s, i) => (
                <div key={i} className="truncate" style={{ color: COMPARE_COLORS[i] }}>
                  {s.totals[k] > 0 ? "+" : ""}
                  {s.totals[k].toFixed(2)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
