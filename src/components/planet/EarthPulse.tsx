import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Heart,
  ShieldCheck,
  Sprout,
  TriangleAlert,
} from "lucide-react";

/* =========================================================================
 * EARTH PULSE — planetary vital signs.
 * Four critical modules, all driven by the Time Machine year so the user
 * watches civilization's life signs evolve 2020 → 2050.
 *   1. Heartbeat   — composite Earth Vital Index ECG
 *   2. Boundaries  — Rockström 9 planetary boundaries radial
 *   3. Tipping     — distance-to-threshold for cascade systems
 *   4. Stewardship — trust + regenerative economy indices
 * ========================================================================= */

type Severity = "safe" | "warn" | "crit";
const SEV_COLOR: Record<Severity, string> = {
  safe: "#5eead4",
  warn: "#ffd166",
  crit: "#ff6b6b",
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
function t01(year: number) {
  return (year - 2020) / 30;
}

/* ---------- composite Earth Vital Index (0–100, higher = healthier) ---- */

function vitalIndex(year: number) {
  const t = t01(year);
  // baseline degradation curve with mild recovery wobble
  const base = lerp(72, 38, t);
  const wob = Math.sin((year - 2020) * 0.9) * 1.6;
  return Math.max(8, Math.min(98, base + wob));
}

/* =========================================================================
 * 1. HEARTBEAT — ECG canvas
 * ========================================================================= */

function Heartbeat({ year, bpm }: { year: number; bpm: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = c.clientWidth;
      const h = c.clientHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const stress = Math.min(1, Math.max(0, (year - 2020) / 30));
    const period = lerp(1.1, 0.62, stress); // faster heartbeat as planet stresses
    const baseColor =
      stress < 0.4 ? "#5eead4" : stress < 0.75 ? "#ffd166" : "#ff6b6b";

    // ECG waveform — series of PQRST-ish spikes
    const beat = (x: number) => {
      // x in [0, 1) within one period
      if (x < 0.05) return Math.sin((x / 0.05) * Math.PI) * 0.08; // P
      if (x < 0.12) return 0;
      if (x < 0.16) return -0.12; // Q
      if (x < 0.2) return 1.0; // R spike
      if (x < 0.24) return -0.35; // S
      if (x < 0.32) return 0;
      if (x < 0.46) return Math.sin(((x - 0.32) / 0.14) * Math.PI) * 0.22; // T
      return Math.sin(x * 12) * 0.015; // baseline drift
    };

    let raf = 0;
    let t0 = performance.now();
    const trail: { x: number; y: number }[] = [];

    const tick = () => {
      const w = c.clientWidth;
      const h = c.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // grid
      ctx.strokeStyle = "rgba(94, 234, 212, 0.07)";
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 18) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      for (let i = 0; i < h; i += 18) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }

      const now = performance.now();
      const elapsed = (now - t0) / 1000;
      const speed = 80; // px per second
      const headX = (elapsed * speed) % w;
      const cycle = (elapsed % period) / period;
      const amp = h * 0.35;
      const mid = h * 0.55;
      const y = mid - beat(cycle) * amp;

      trail.push({ x: headX, y });
      // keep one screen of trail
      while (trail.length > 600) trail.shift();

      // draw trail with gradient by recency
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = baseColor;
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      let started = false;
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        // break the path when sweep wraps
        if (Math.abs(b.x - a.x) > w / 2) {
          ctx.stroke();
          ctx.beginPath();
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(a.x, a.y);
          started = true;
        }
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // sweep head
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(headX, y, 2.4, 0, Math.PI * 2);
      ctx.fill();

      // erase ahead of sweep
      ctx.fillStyle = "rgba(10, 18, 30, 0.92)";
      ctx.fillRect(headX + 2, 0, 24, h);

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [year]);

  const status =
    bpm < 75 ? { label: "STABLE", color: SEV_COLOR.safe } : bpm < 105 ? { label: "ELEVATED", color: SEV_COLOR.warn } : { label: "CRITICAL", color: SEV_COLOR.crit };

  return (
    <div className="rounded-sm border border-border bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-3.5 w-3.5" style={{ color: status.color }} />
          <span className="hud-label">Earth Vital Sign</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="mono text-[10px] tabular-nums" style={{ color: status.color }}>
            {Math.round(bpm)} BPM
          </span>
          <span
            className="mono rounded-sm px-1.5 py-0.5 text-[9px] tracking-widest"
            style={{
              backgroundColor: `${status.color}1f`,
              color: status.color,
            }}
          >
            {status.label}
          </span>
        </div>
      </div>
      <canvas ref={ref} className="h-16 w-full" />
    </div>
  );
}

/* =========================================================================
 * 2. PLANETARY BOUNDARIES — Rockström 9-axis radial
 * ========================================================================= */

type Boundary = {
  key: string;
  label: string;
  // 2020 baseline transgression (0 = safe, 1 = at boundary, >1 = crossed)
  base: number;
  // 2050 projected if no intervention
  end: number;
};

const BOUNDARIES: Boundary[] = [
  { key: "climate", label: "Climate", base: 1.18, end: 1.62 },
  { key: "biosphere", label: "Biosphere", base: 1.55, end: 1.95 },
  { key: "land", label: "Land Use", base: 1.06, end: 1.34 },
  { key: "freshwater", label: "Freshwater", base: 0.88, end: 1.21 },
  { key: "biogeo", label: "N / P Cycles", base: 1.72, end: 1.88 },
  { key: "ocean", label: "Ocean Acid.", base: 0.74, end: 1.04 },
  { key: "ozone", label: "Ozone", base: 0.42, end: 0.38 },
  { key: "aerosol", label: "Aerosols", base: 0.62, end: 0.82 },
  { key: "novel", label: "Novel Entities", base: 1.45, end: 1.78 },
];

function boundaryValue(b: Boundary, year: number) {
  return lerp(b.base, b.end, t01(year));
}
function boundarySev(v: number): Severity {
  if (v < 0.85) return "safe";
  if (v < 1.15) return "warn";
  return "crit";
}

function Boundaries({ year }: { year: number }) {
  const size = 168;
  const cx = size / 2;
  const cy = size / 2;
  const rMax = size / 2 - 8;

  const crossed = BOUNDARIES.filter((b) => boundaryValue(b, year) > 1).length;

  // wedge angles
  const n = BOUNDARIES.length;
  const wedge = (Math.PI * 2) / n;

  return (
    <div className="rounded-sm border border-border bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TriangleAlert className="h-3.5 w-3.5 text-[color:var(--warning)]" />
          <span className="hud-label">Planetary Boundaries</span>
        </div>
        <span className="mono text-[10px] tracking-widest text-[color:var(--color-destructive)]">
          {crossed}/9 CROSSED
        </span>
      </div>

      <div className="flex items-center gap-3">
        <svg width={size} height={size} className="shrink-0">
          {/* safe-operating-space ring */}
          <circle cx={cx} cy={cy} r={rMax * 0.62} fill="none" stroke="rgba(94,234,212,0.35)" strokeDasharray="3 3" />
          {/* boundary ring */}
          <circle cx={cx} cy={cy} r={rMax * 0.78} fill="none" stroke="rgba(255,209,102,0.45)" />
          {/* wedges */}
          {BOUNDARIES.map((b, i) => {
            const v = boundaryValue(b, year);
            const sev = boundarySev(v);
            const color = SEV_COLOR[sev];
            const r = Math.min(rMax, rMax * (0.42 + Math.min(v, 1.6) * 0.36));
            const a0 = -Math.PI / 2 + i * wedge + wedge * 0.08;
            const a1 = -Math.PI / 2 + (i + 1) * wedge - wedge * 0.08;
            const x0 = cx + Math.cos(a0) * 6;
            const y0 = cy + Math.sin(a0) * 6;
            const x1 = cx + Math.cos(a1) * 6;
            const y1 = cy + Math.sin(a1) * 6;
            const x2 = cx + Math.cos(a1) * r;
            const y2 = cy + Math.sin(a1) * r;
            const x3 = cx + Math.cos(a0) * r;
            const y3 = cy + Math.sin(a0) * r;
            const large = a1 - a0 > Math.PI ? 1 : 0;
            const d = `M${x0},${y0} L${x3},${y3} A${r},${r} 0 ${large} 1 ${x2},${y2} L${x1},${y1} A6,6 0 ${large} 0 ${x0},${y0} Z`;
            return (
              <path
                key={b.key}
                d={d}
                fill={color}
                fillOpacity={0.65}
                stroke={color}
                strokeWidth={0.8}
              >
                <title>{`${b.label}: ${v.toFixed(2)}× (${sev})`}</title>
              </path>
            );
          })}
          {/* axis ticks */}
          {BOUNDARIES.map((_, i) => {
            const a = -Math.PI / 2 + (i + 0.5) * wedge;
            return (
              <line
                key={i}
                x1={cx + Math.cos(a) * 6}
                y1={cy + Math.sin(a) * 6}
                x2={cx + Math.cos(a) * rMax}
                y2={cy + Math.sin(a) * rMax}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={0.5}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={5} fill="rgba(94,234,212,0.9)" />
        </svg>

        <ul className="mono grid w-full grid-cols-1 gap-y-0.5 text-[10px]">
          {BOUNDARIES.map((b) => {
            const v = boundaryValue(b, year);
            const sev = boundarySev(v);
            const color = SEV_COLOR[sev];
            return (
              <li key={b.key} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                  {b.label}
                </span>
                <span className="tabular-nums" style={{ color }}>
                  {v.toFixed(2)}×
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* =========================================================================
 * 3. TIPPING POINTS — distance to threshold cascade
 * ========================================================================= */

type Tipping = { key: string; label: string; base: number; end: number };

const TIPPINGS: Tipping[] = [
  { key: "amazon", label: "Amazon Dieback", base: 0.42, end: 0.91 },
  { key: "amoc", label: "AMOC Collapse", base: 0.18, end: 0.58 },
  { key: "wais", label: "W. Antarctic Sheet", base: 0.55, end: 0.88 },
  { key: "greenland", label: "Greenland Ice", base: 0.48, end: 0.83 },
  { key: "coral", label: "Coral Reef Die-off", base: 0.74, end: 0.97 },
  { key: "perma", label: "Permafrost Thaw", base: 0.36, end: 0.79 },
  { key: "boreal", label: "Boreal Forest Shift", base: 0.22, end: 0.61 },
  { key: "monsoon", label: "Monsoon Disruption", base: 0.31, end: 0.68 },
];

function Tipping({ year }: { year: number }) {
  return (
    <div className="rounded-sm border border-border bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-[color:var(--color-destructive)]" />
          <span className="hud-label">Tipping Point Monitor</span>
        </div>
        <span className="mono text-[10px] tracking-widest text-muted-foreground">
          Δ to threshold
        </span>
      </div>
      <ul className="space-y-1.5">
        {TIPPINGS.map((tp) => {
          const v = lerp(tp.base, tp.end, t01(year));
          const pct = Math.min(1, Math.max(0, v));
          const sev: Severity = pct < 0.55 ? "safe" : pct < 0.8 ? "warn" : "crit";
          const color = SEV_COLOR[sev];
          const remain = Math.max(0, (1 - pct) * 100);
          return (
            <li key={tp.key}>
              <div className="mb-0.5 flex items-center justify-between text-[10px]">
                <span className="text-foreground/85">{tp.label}</span>
                <span className="mono tabular-nums" style={{ color }}>
                  {pct >= 1 ? "TRIPPED" : `${remain.toFixed(0)}% margin`}
                </span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-sm bg-card/50">
                {/* danger zone marker */}
                <div
                  aria-hidden
                  className="absolute top-0 bottom-0 w-px"
                  style={{ left: "80%", backgroundColor: SEV_COLOR.crit, opacity: 0.5 }}
                />
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${pct * 100}%`,
                    background: `linear-gradient(90deg, ${SEV_COLOR.safe}55, ${color})`,
                    boxShadow: pct > 0.8 ? `0 0 10px ${color}` : "none",
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* =========================================================================
 * 4. STEWARDSHIP — trust + regenerative economy
 * ========================================================================= */

function Meter({
  label,
  value,
  Icon,
  hint,
  goodWhen = "up",
}: {
  label: string;
  value: number; // 0..100
  Icon: typeof ShieldCheck;
  hint: string;
  goodWhen?: "up" | "down";
}) {
  const good = goodWhen === "up" ? value >= 55 : value <= 45;
  const mid = goodWhen === "up" ? value >= 35 : value <= 65;
  const color = good ? SEV_COLOR.safe : mid ? SEV_COLOR.warn : SEV_COLOR.crit;
  return (
    <div className="rounded-sm border border-border bg-background/40 p-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3" style={{ color }} />
          <span className="hud-label">{label}</span>
        </div>
        <span className="mono text-[11px] tabular-nums" style={{ color }}>
          {value.toFixed(0)}
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-sm bg-card/50">
        <div
          className="h-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}55, ${color})`,
          }}
        />
      </div>
      <div className="mono mt-1 text-[9px] tracking-wide text-muted-foreground">{hint}</div>
    </div>
  );
}

function Stewardship({ year }: { year: number }) {
  const t = t01(year);
  // these are stylized civilization-level indices
  const trust = lerp(48, 31, t) + Math.sin((year - 2020) * 0.7) * 2;
  const regen = lerp(22, 47, t) + Math.cos((year - 2020) * 0.5) * 1.4;
  const flourish = lerp(58, 49, t) + Math.sin((year - 2020) * 0.9) * 1.1;
  const extract = lerp(74, 61, t) + Math.cos((year - 2020) * 0.8) * 1.6;

  return (
    <div className="grid grid-cols-2 gap-2">
      <Meter
        label="Constitutional Trust"
        value={trust}
        Icon={ShieldCheck}
        hint="Governance · institutional integrity"
      />
      <Meter
        label="Regenerative Index"
        value={regen}
        Icon={Sprout}
        hint="Restoration vs extraction ratio"
      />
      <Meter
        label="Human Flourishing"
        value={flourish}
        Icon={Heart}
        hint="Health · meaning · opportunity"
      />
      <Meter
        label="Extraction Load"
        value={extract}
        Icon={TriangleAlert}
        hint="Material throughput vs biocapacity"
        goodWhen="down"
      />
    </div>
  );
}

/* =========================================================================
 * SHELL
 * ========================================================================= */

export function EarthPulse({ year }: { year: number }) {
  const [open, setOpen] = useState(true);
  const vi = useMemo(() => vitalIndex(year), [year]);
  // BPM = elevated when vital index drops
  const bpm = useMemo(() => lerp(58, 132, 1 - vi / 100), [vi]);

  return (
    <div className="panel pointer-events-auto w-[360px] p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: SEV_COLOR.safe }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: SEV_COLOR.safe }}
            />
          </span>
          <h3 className="text-sm font-semibold">Earth Pulse</h3>
          <span className="mono text-[9px] tracking-widest text-muted-foreground">
            VITAL SIGNS · {year}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="hud-label">EVI</div>
            <div
              className="mono text-xs tabular-nums"
              style={{
                color: vi > 60 ? SEV_COLOR.safe : vi > 40 ? SEV_COLOR.warn : SEV_COLOR.crit,
              }}
            >
              {vi.toFixed(1)}
            </div>
          </div>
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-2.5">
          <Heartbeat year={year} bpm={bpm} />
          <Boundaries year={year} />
          <Tipping year={year} />
          <Stewardship year={year} />
          <div className="mono flex items-center justify-between border-t border-border pt-2 text-[9px] tracking-widest text-muted-foreground">
            <span>FRAMEWORK · ROCKSTRÖM 2023 · IPCC AR6 · UNSDG</span>
            <span className="text-[color:var(--color-accent)]">SIGNED ✓</span>
          </div>
        </div>
      )}
    </div>
  );
}