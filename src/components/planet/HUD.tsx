import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Beaker,
  Cpu,
  Droplets,
  Factory,
  Globe2,
  Layers,
  Leaf,
  Mountain,
  Radio,
  Send,
  Sparkles,
  Users,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import type { LayerKey } from "./Globe";

/* -------------------- TOP BAR -------------------- */

export function TopBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const utc = now.toISOString().replace("T", " ").slice(0, 19);

  return (
    <header className="pointer-events-auto absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9">
          <div className="absolute inset-0 rounded-full border border-[color:var(--color-primary)]/60" />
          <div className="absolute inset-1 rounded-full border border-[color:var(--color-accent)]/40" />
          <div className="sweep absolute inset-0 origin-center">
            <div className="absolute left-1/2 top-0 h-1/2 w-px bg-gradient-to-b from-[color:var(--color-primary)] to-transparent" />
          </div>
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-primary)] pulse-dot" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide">
            ATLAS<span className="text-[color:var(--color-primary)]">.</span>EARTH
          </div>
          <div className="hud-label -mt-0.5">Planetary Digital Twin · v0.1</div>
        </div>
      </div>

      <nav className="hidden items-center gap-1 md:flex">
        {["Planet", "Cities", "Ecosystems", "Economy", "Scenarios"].map((t, i) => (
          <button
            key={t}
            className={`mono rounded-sm px-3 py-1.5 text-[11px] tracking-widest uppercase transition ${
              i === 0
                ? "bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <div className="hidden text-right md:block">
          <div className="hud-label">UTC · Live Feed</div>
          <div className="mono text-xs text-foreground/80">{utc}</div>
        </div>
        <div className="flex items-center gap-2 rounded-sm border border-[color:var(--color-primary)]/40 bg-[color:var(--color-primary)]/10 px-3 py-1.5">
          <Radio className="h-3 w-3 text-[color:var(--color-primary)]" />
          <span className="mono text-[10px] tracking-widest text-[color:var(--color-primary)]">
            UPLINK · 218 SAT
          </span>
        </div>
      </div>
    </header>
  );
}

/* -------------------- LAYER PANEL -------------------- */

const LAYERS: {
  key: LayerKey;
  label: string;
  desc: string;
  Icon: typeof Globe2;
  premium?: boolean;
  swatch: string;
}[] = [
  { key: "climate", label: "Climate", desc: "Temp anomaly · CO₂ flow", Icon: Wind, swatch: "#ff7a59" },
  { key: "water", label: "Water Systems", desc: "Reserves · stress index", Icon: Droplets, swatch: "#60a5fa" },
  { key: "energy", label: "Energy Grids", desc: "Load · transmission", Icon: Zap, swatch: "#ffd166" },
  { key: "supply", label: "Supply Chains", desc: "Ports · choke points", Icon: Factory, swatch: "#a78bfa", premium: true },
  { key: "population", label: "Population", desc: "Density · migration", Icon: Users, swatch: "#6ee7ff" },
  { key: "biodiversity", label: "Biodiversity", desc: "Forest · species index", Icon: Leaf, swatch: "#5eead4", premium: true },
];

export function LayerPanel({
  active,
  onToggle,
}: {
  active: LayerKey[];
  onToggle: (k: LayerKey) => void;
}) {
  return (
    <div className="panel pointer-events-auto w-72 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-[color:var(--color-primary)]" />
          <h3 className="text-sm font-semibold">Layer Marketplace</h3>
        </div>
        <span className="hud-label">{active.length}/6</span>
      </div>
      <ul className="space-y-1.5">
        {LAYERS.map(({ key, label, desc, Icon, premium, swatch }) => {
          const isActive = active.includes(key);
          return (
            <li key={key}>
              <button
                onClick={() => onToggle(key)}
                className={`group flex w-full items-center gap-3 rounded-sm border px-2.5 py-2 text-left transition ${
                  isActive
                    ? "border-[color:var(--color-primary)]/50 bg-[color:var(--color-primary)]/10"
                    : "border-transparent hover:border-border hover:bg-card/40"
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: swatch,
                    boxShadow: isActive ? `0 0 10px ${swatch}` : "none",
                  }}
                />
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{label}</span>
                    {premium && (
                      <span className="mono rounded-sm bg-[color:var(--color-accent)]/15 px-1 text-[8px] tracking-widest text-[color:var(--color-accent)]">
                        PRO
                      </span>
                    )}
                  </div>
                  <div className="mono text-[9px] tracking-wider text-muted-foreground">
                    {desc}
                  </div>
                </div>
                <span
                  className={`mono text-[9px] tracking-widest ${
                    isActive ? "text-[color:var(--color-primary)]" : "text-muted-foreground/60"
                  }`}
                >
                  {isActive ? "ON" : "OFF"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-sm border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/5 p-2.5">
        <div className="mono text-[9px] tracking-widest text-[color:var(--color-accent)]">
          + ADD LAYER
        </div>
        <div className="mt-0.5 text-[11px] text-foreground/80">
          Insurance Risk · Agriculture · Permafrost
        </div>
      </div>
    </div>
  );
}

/* -------------------- STATS RAIL -------------------- */

function useTick(period = 1500) {
  const [t, set] = useState(0);
  useEffect(() => {
    const i = setInterval(() => set((x) => x + 1), period);
    return () => clearInterval(i);
  }, [period]);
  return t;
}

function Stat({
  label,
  value,
  delta,
  Icon,
  trend = "up",
}: {
  label: string;
  value: string;
  delta: string;
  Icon: typeof Activity;
  trend?: "up" | "down" | "warn";
}) {
  const color =
    trend === "up"
      ? "text-[color:var(--color-accent)]"
      : trend === "warn"
        ? "text-[color:var(--warning)]"
        : "text-[color:var(--color-destructive)]";
  return (
    <div className="panel flex items-center gap-3 px-3 py-2.5">
      <div className="rounded-sm bg-[color:var(--color-primary)]/10 p-1.5">
        <Icon className="h-3.5 w-3.5 text-[color:var(--color-primary)]" />
      </div>
      <div className="min-w-0">
        <div className="hud-label">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="mono text-sm text-foreground">{value}</span>
          <span className={`mono text-[10px] ${color}`}>{delta}</span>
        </div>
      </div>
    </div>
  );
}

export function StatsRail() {
  const t = useTick(2000);
  const pop = (8.21 + Math.sin(t * 0.3) * 0.0001).toFixed(4);
  const co2 = (424.7 + Math.sin(t * 0.4) * 0.3).toFixed(1);
  const temp = (1.32 + Math.sin(t * 0.5) * 0.02).toFixed(2);
  const energy = (19.8 + Math.cos(t * 0.6) * 0.4).toFixed(1);
  const ships = 53291 + (t % 47);

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
      <Stat Icon={Users} label="Pop · Live" value={`${pop}B`} delta="+0.74%/yr" trend="up" />
      <Stat Icon={Wind} label="CO₂ ppm" value={co2} delta="+2.4 ppm" trend="warn" />
      <Stat Icon={Activity} label="ΔT vs 1880" value={`+${temp}°C`} delta="+0.18°/dec" trend="warn" />
      <Stat Icon={Zap} label="Grid Load TW" value={energy} delta="+1.2%" trend="up" />
      <Stat Icon={Factory} label="Active Vessels" value={ships.toLocaleString()} delta="live" trend="up" />
    </div>
  );
}

/* -------------------- TIME MACHINE -------------------- */

export function TimeMachine({
  year,
  onChange,
}: {
  year: number;
  onChange: (y: number) => void;
}) {
  const ticks = useMemo(() => {
    const arr = [];
    for (let y = 2020; y <= 2050; y += 5) arr.push(y);
    return arr;
  }, []);

  return (
    <div className="panel pointer-events-auto px-5 py-3">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mountain className="h-3.5 w-3.5 text-[color:var(--color-primary)]" />
          <span className="hud-label">Time Machine</span>
        </div>
        <div className="mono text-xl font-semibold text-[color:var(--color-primary)]">
          {year}
        </div>
      </div>
      <input
        type="range"
        min={2020}
        max={2050}
        value={year}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-[color:var(--color-primary)]"
      />
      <div className="mono mt-1 flex justify-between text-[9px] tracking-widest text-muted-foreground">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* -------------------- ALERT CENTER -------------------- */

const ALERTS: { sev: "high" | "med" | "low"; region: string; msg: string; time: string }[] = [
  { sev: "high", region: "Bay of Bengal", msg: "Cyclone forming · 89% confidence · landfall T-72h", time: "02m" },
  { sev: "med", region: "Horn of Africa", msg: "Water reserves -14% vs 5-yr baseline", time: "11m" },
  { sev: "high", region: "Suez Canal", msg: "Vessel queue +37 · supply delay 4.2d projected", time: "23m" },
  { sev: "low", region: "Amazon — Pará", msg: "Deforestation rate trending +6% MoM", time: "1h" },
  { sev: "med", region: "Sahel Belt", msg: "Crop failure probability rising · maize 41%", time: "1h" },
  { sev: "high", region: "PJM Grid · US-East", msg: "Demand spike forecast 18:00 EST · +14%", time: "2h" },
];

export function AlertCenter() {
  return (
    <div className="panel pointer-events-auto flex h-full w-80 flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--warning)]" />
          <h3 className="text-sm font-semibold">Alert Center</h3>
        </div>
        <span className="mono text-[10px] tracking-widest text-[color:var(--warning)]">
          {ALERTS.filter((a) => a.sev === "high").length} CRITICAL
        </span>
      </div>

      <ul className="space-y-2 overflow-auto pr-1">
        {ALERTS.map((a, i) => {
          const sevColor =
            a.sev === "high"
              ? "var(--color-destructive)"
              : a.sev === "med"
                ? "var(--warning)"
                : "var(--color-primary)";
          return (
            <li
              key={i}
              className="rounded-sm border border-border bg-card/30 p-2.5 transition hover:border-[color:var(--color-primary)]/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="pulse-dot h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: `oklch(from ${sevColor} l c h)` }}
                  />
                  <span className="mono text-[10px] tracking-widest uppercase" style={{ color: sevColor }}>
                    {a.sev}
                  </span>
                  <span className="text-[11px] font-medium">{a.region}</span>
                </div>
                <span className="mono text-[9px] text-muted-foreground">{a.time}</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{a.msg}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* -------------------- SCENARIO ENGINE / COPILOT -------------------- */

const SUGGESTIONS = [
  "Build a dam on the Zambezi at -16.5°S",
  "Raise global carbon tax by 15%",
  "Shut down 30% of coal in India by 2032",
  "Reforest 50M hectares in the Sahel",
];

type SimResult = {
  prompt: string;
  metrics: { label: string; value: string; trend: "up" | "down" | "warn"; weight: number }[];
  summary: string;
};

function simulate(prompt: string): SimResult {
  // deterministic pseudo-results so it feels alive without a backend
  let h = 0;
  for (let i = 0; i < prompt.length; i++) h = (h * 31 + prompt.charCodeAt(i)) >>> 0;
  const r = (i: number, lo: number, hi: number) => {
    const v = ((h >> (i * 3)) & 0xff) / 255;
    return lo + v * (hi - lo);
  };
  return {
    prompt,
    summary:
      "Atlas ran 1.2M Monte Carlo trajectories across 47 coupled systems. Outcome distribution stabilized after 8.3s.",
    metrics: [
      { label: "GDP Impact (10yr)", value: `${r(0, -1.2, 3.4).toFixed(2)}%`, trend: "up", weight: r(0, 40, 95) },
      { label: "Emissions Δ", value: `${r(1, -22, 5).toFixed(1)}%`, trend: "warn", weight: r(1, 30, 90) },
      { label: "Water Stress", value: `${r(2, -18, 12).toFixed(1)}%`, trend: "down", weight: r(2, 25, 85) },
      { label: "Migration Pressure", value: `${(r(3, 0.4, 4.1)).toFixed(2)}M`, trend: "warn", weight: r(3, 20, 80) },
      { label: "Biodiversity Index", value: `${r(4, -0.08, 0.12).toFixed(3)}`, trend: "up", weight: r(4, 35, 90) },
      { label: "Resilience ROI", value: `${(r(5, 0.8, 4.2)).toFixed(2)}x`, trend: "up", weight: r(5, 50, 95) },
    ],
  };
}

export function ScenarioEngine() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);

  const run = (p: string) => {
    if (!p.trim()) return;
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      setResult(simulate(p));
      setRunning(false);
    }, 900);
  };

  return (
    <div className="panel panel-glow pointer-events-auto w-[440px] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-[color:var(--color-accent)]" />
        <h3 className="text-sm font-semibold">Scenario Engine</h3>
        <span className="mono ml-auto text-[10px] tracking-widest text-[color:var(--color-accent)]">
          AI · COPILOT
        </span>
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

      {!result && !running && (
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

      {result && (
        <div className="mt-4 space-y-3">
          <div className="rounded-sm border-l-2 border-[color:var(--color-accent)] bg-card/40 p-2.5">
            <div className="hud-label">Atlas Brief</div>
            <p className="mt-1 text-[11px] leading-snug">{result.summary}</p>
          </div>
          <div className="space-y-1.5">
            {result.metrics.map((m) => {
              const c =
                m.trend === "up"
                  ? "var(--color-accent)"
                  : m.trend === "warn"
                    ? "var(--warning)"
                    : "var(--color-destructive)";
              return (
                <div key={m.label} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="mono" style={{ color: c }}>
                      {m.value}
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-card/60">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${m.weight}%`, backgroundColor: c }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => {
              setResult(null);
              setPrompt("");
            }}
            className="mono w-full rounded-sm border border-border py-1.5 text-[10px] tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← NEW SCENARIO
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------- TICKER -------------------- */

const TICKER_ITEMS = [
  ["CO₂ atm.", "424.7 ppm", "+0.4"],
  ["Brent", "$83.21", "-0.8%"],
  ["Wheat", "$612", "+1.2%"],
  ["Arctic Ice", "4.21M km²", "-2.1%"],
  ["Refugees", "117.3M", "+0.6%"],
  ["Renewables", "38.4% mix", "+1.4"],
  ["Cargo TEU", "847M YTD", "+3.1%"],
  ["Forest cover", "31.2%", "-0.04"],
  ["Insured losses", "$94B YTD", "+18%"],
  ["AI compute", "11.2 ZFLOPS", "+22%"],
];

export function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative overflow-hidden border-y border-border bg-card/40">
      <div className="ticker mono flex w-max gap-8 py-1.5 text-[10px] tracking-widest whitespace-nowrap">
        {items.map((it, i) => (
          <span key={i} className="flex items-center gap-2">
            <Beaker className="h-3 w-3 text-[color:var(--color-primary)]" />
            <span className="text-muted-foreground">{it[0]}</span>
            <span className="text-foreground">{it[1]}</span>
            <span
              className={
                it[2].startsWith("-")
                  ? "text-[color:var(--color-destructive)]"
                  : "text-[color:var(--color-accent)]"
              }
            >
              {it[2]}
            </span>
            <Waves className="h-3 w-3 text-border" />
          </span>
        ))}
      </div>
    </div>
  );
}