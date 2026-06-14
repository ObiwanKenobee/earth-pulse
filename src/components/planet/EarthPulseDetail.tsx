import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BellOff,
  BellRing,
  Database,
  GitCompareArrows,
  LineChart as LineIcon,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  BOUNDARIES,
  PROVENANCE,
  SECTION_LABEL,
  SEV_COLOR,
  STEWARDSHIP_META,
  TIPPINGS,
  bpmFromVital,
  boundarySev,
  boundaryValue,
  computeAlerts,
  loadSubs,
  pulseModsFor,
  stewardshipValues,
  tippingSev,
  tippingValue,
  toggleSub,
  vitalIndex,
  yearSeries,
  type Alert,
  type PulseMods,
  type PulseSection,
  type StewardKey,
} from "./pulse-data";
import { loadScenarios, type Scenario } from "./scenario";

/* =========================================================================
 * Earth Pulse — drill-down drawer.
 * Tabs: Variables · Provenance · Alerts · Compare (scenarios)
 * ========================================================================= */

type Tab = "vars" | "prov" | "alerts" | "compare";

const TAB_META: Record<Tab, { label: string; Icon: typeof LineIcon }> = {
  vars: { label: "Variables", Icon: LineIcon },
  prov: { label: "Provenance", Icon: Database },
  alerts: { label: "Alerts", Icon: BellRing },
  compare: { label: "Compare", Icon: GitCompareArrows },
};

const COMPARE_COLORS = ["#5eead4", "#a78bfa", "#ffd166", "#60a5fa"];

export function EarthPulseDetail({
  section,
  year,
  onClose,
}: {
  section: PulseSection | null;
  year: number;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("vars");
  useEffect(() => {
    if (section) setTab("vars");
  }, [section]);

  if (!section) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        aria-hidden
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="panel panel-glow relative z-10 flex h-[88vh] w-[min(1080px,94vw)] flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-[color:var(--color-accent)]" />
            <div>
              <div className="hud-label">Earth Pulse · Drill-down</div>
              <h2 className="text-sm font-semibold">{SECTION_LABEL[section]}</h2>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(Object.keys(TAB_META) as Tab[]).map((k) => {
              const M = TAB_META[k];
              const active = tab === k;
              return (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`mono flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[10px] tracking-widest transition ${
                    active
                      ? "border-[color:var(--color-primary)]/60 bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <M.Icon className="h-3 w-3" />
                  {M.label}
                </button>
              );
            })}
            <button
              onClick={onClose}
              className="ml-2 rounded-sm border border-border p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "vars" && <VariablesTab section={section} year={year} />}
          {tab === "prov" && <ProvenanceTab section={section} />}
          {tab === "alerts" && <AlertsTab year={year} focus={section} />}
          {tab === "compare" && <CompareTab section={section} year={year} />}
        </div>
      </div>
    </div>
  );
}

/* ============================ VARIABLES ============================== */

function VariablesTab({ section, year }: { section: PulseSection; year: number }) {
  const years = yearSeries();

  if (section === "heartbeat") {
    const data = years.map((y) => ({
      year: y,
      EVI: +vitalIndex(y).toFixed(2),
      BPM: +bpmFromVital(vitalIndex(y)).toFixed(1),
    }));
    return (
      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <ChartCard title="Earth Vital Index · 2020 → 2050" data={data} keys={[{ k: "EVI", color: SEV_COLOR.safe }]} yLabel="EVI (0–100)" markYear={year} />
        <SeriesTable
          rows={data}
          year={year}
          columns={[
            { k: "EVI", label: "EVI", unit: "" },
            { k: "BPM", label: "Heart rate", unit: "bpm" },
          ]}
        />
      </div>
    );
  }

  if (section === "boundaries") {
    const data = years.map((y) => {
      const row: Record<string, number> = { year: y };
      for (const b of BOUNDARIES) row[b.key] = +boundaryValue(b, y).toFixed(3);
      return row;
    });
    return (
      <div className="space-y-4">
        <ChartCard
          title="All 9 boundaries · transgression × safe"
          data={data}
          keys={BOUNDARIES.map((b, i) => ({ k: b.key, color: COMPARE_COLORS[i % COMPARE_COLORS.length] }))}
          yLabel="× safe (1.0 = boundary)"
          markYear={year}
          refLines={[{ y: 1, color: SEV_COLOR.warn, label: "boundary" }, { y: 1.15, color: SEV_COLOR.crit, label: "deep" }]}
        />
        <VarsTable
          year={year}
          rows={BOUNDARIES.map((b) => {
            const v = boundaryValue(b, year);
            return {
              key: b.key,
              label: b.label,
              control: b.control,
              value: v.toFixed(2),
              unit: b.unit,
              sev: boundarySev(v),
              base: b.base.toFixed(2),
              end: b.end.toFixed(2),
            };
          })}
        />
      </div>
    );
  }

  if (section === "tipping") {
    const data = years.map((y) => {
      const row: Record<string, number> = { year: y };
      for (const tp of TIPPINGS) row[tp.key] = +tippingValue(tp, y).toFixed(3);
      return row;
    });
    return (
      <div className="space-y-4">
        <ChartCard
          title="Tipping margins · distance to threshold"
          data={data}
          keys={TIPPINGS.map((tp, i) => ({ k: tp.key, color: COMPARE_COLORS[i % COMPARE_COLORS.length] }))}
          yLabel="0 = safe · 1.0 = tipped"
          markYear={year}
          refLines={[{ y: 0.8, color: SEV_COLOR.warn, label: "warn" }, { y: 1, color: SEV_COLOR.crit, label: "tip" }]}
        />
        <VarsTable
          year={year}
          rows={TIPPINGS.map((tp) => {
            const v = tippingValue(tp, year);
            return {
              key: tp.key,
              label: tp.label,
              control: tp.trigger,
              value: v.toFixed(2),
              unit: tp.timescale,
              sev: tippingSev(v),
              base: tp.base.toFixed(2),
              end: tp.end.toFixed(2),
            };
          })}
        />
      </div>
    );
  }

  // stewardship
  const data = years.map((y) => {
    const s = stewardshipValues(y);
    return { year: y, trust: +s.trust.toFixed(2), regen: +s.regen.toFixed(2), flourish: +s.flourish.toFixed(2), extract: +s.extract.toFixed(2) };
  });
  const cur = stewardshipValues(year);
  return (
    <div className="space-y-4">
      <ChartCard
        title="Stewardship indices · 0–100"
        data={data}
        keys={[
          { k: "trust", color: SEV_COLOR.safe },
          { k: "regen", color: "#a3e635" },
          { k: "flourish", color: "#a78bfa" },
          { k: "extract", color: SEV_COLOR.crit },
        ]}
        yLabel="index"
        markYear={year}
      />
      <VarsTable
        year={year}
        rows={(Object.keys(STEWARDSHIP_META) as StewardKey[]).map((k) => {
          const m = STEWARDSHIP_META[k];
          const v = cur[k];
          const good = m.goodWhen === "up" ? v >= 55 : v <= 45;
          const mid = m.goodWhen === "up" ? v >= 35 : v <= 65;
          return {
            key: k,
            label: m.label,
            control: m.hint,
            value: v.toFixed(1),
            unit: m.goodWhen === "up" ? "↑ better" : "↓ better",
            sev: (good ? "safe" : mid ? "warn" : "crit") as "safe" | "warn" | "crit",
            base: "—",
            end: "—",
          };
        })}
      />
    </div>
  );
}

function ChartCard({
  title,
  data,
  keys,
  yLabel,
  markYear,
  refLines,
}: {
  title: string;
  data: Array<Record<string, number>>;
  keys: { k: string; color: string }[];
  yLabel: string;
  markYear?: number;
  refLines?: { y: number; color: string; label: string }[];
}) {
  return (
    <div className="rounded-sm border border-border bg-background/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="hud-label">{title}</span>
        <span className="mono text-[9px] tracking-widest text-muted-foreground">{yLabel}</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
            <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "rgba(10,18,30,0.95)",
                border: "1px solid rgba(94,234,212,0.3)",
                borderRadius: 4,
                fontSize: 11,
              }}
            />
            {refLines?.map((r) => (
              <ReferenceLine
                key={r.label}
                y={r.y}
                stroke={r.color}
                strokeDasharray="3 3"
                label={{ value: r.label, fontSize: 9, fill: r.color, position: "right" }}
              />
            ))}
            {markYear !== undefined && (
              <ReferenceLine x={markYear} stroke="rgba(94,234,212,0.8)" strokeDasharray="2 2" />
            )}
            {keys.map(({ k, color }) => (
              <Line key={k} type="monotone" dataKey={k} stroke={color} strokeWidth={1.6} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function VarsTable({
  year,
  rows,
}: {
  year: number;
  rows: { key: string; label: string; control: string; value: string; unit: string; sev: "safe" | "warn" | "crit"; base: string; end: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <table className="w-full text-left text-[11px]">
        <thead className="bg-card/50 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-normal">Variable</th>
            <th className="px-3 py-2 font-normal">Control</th>
            <th className="px-3 py-2 font-normal text-right">@ {year}</th>
            <th className="px-3 py-2 font-normal text-right">2020</th>
            <th className="px-3 py-2 font-normal text-right">2050</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-border/60">
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SEV_COLOR[r.sev] }} />
                  <span className="font-medium text-foreground/90">{r.label}</span>
                </div>
              </td>
              <td className="px-3 py-1.5 text-muted-foreground">{r.control}</td>
              <td className="mono px-3 py-1.5 text-right tabular-nums" style={{ color: SEV_COLOR[r.sev] }}>
                {r.value} <span className="text-muted-foreground">{r.unit}</span>
              </td>
              <td className="mono px-3 py-1.5 text-right tabular-nums text-muted-foreground">{r.base}</td>
              <td className="mono px-3 py-1.5 text-right tabular-nums text-muted-foreground">{r.end}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SeriesTable({
  rows,
  year,
  columns,
}: {
  rows: Array<Record<string, number>>;
  year: number;
  columns: { k: string; label: string; unit: string }[];
}) {
  const sample = rows.filter((r) => (r.year as number) % 5 === 0);
  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <div className="mono border-b border-border bg-card/40 px-3 py-2 text-[10px] tracking-widest text-muted-foreground">
        SAMPLED · every 5 yr
      </div>
      <table className="w-full text-[11px]">
        <thead className="text-muted-foreground">
          <tr>
            <th className="px-3 py-1.5 text-left font-normal">Year</th>
            {columns.map((c) => (
              <th key={c.k} className="px-3 py-1.5 text-right font-normal">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sample.map((r) => (
            <tr
              key={r.year}
              className={`border-t border-border/60 ${r.year === year ? "bg-[color:var(--color-primary)]/8" : ""}`}
            >
              <td className="mono px-3 py-1.5 tabular-nums">{r.year}</td>
              {columns.map((c) => (
                <td key={c.k} className="mono px-3 py-1.5 text-right tabular-nums">
                  {(r as Record<string, number>)[c.k].toFixed(1)}
                  <span className="ml-1 text-muted-foreground">{c.unit}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================ PROVENANCE ============================= */

function ProvenanceTab({ section }: { section: PulseSection }) {
  const p = PROVENANCE[section];
  return (
    <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
      <div className="rounded-sm border border-border bg-background/40 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-[color:var(--color-primary)]" />
          <span className="hud-label">Data Feeds · weighted ensemble</span>
        </div>
        <ul className="space-y-2">
          {p.feeds.map((f) => (
            <li key={f.name} className="rounded-sm border border-border/60 bg-card/30 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-medium">{f.name}</div>
                  <div className="mono text-[10px] tracking-wide text-muted-foreground">
                    {f.source} · {f.cadence}
                  </div>
                </div>
                <span
                  className="mono rounded-sm px-1.5 py-0.5 text-[9px] tracking-widest"
                  style={{
                    backgroundColor: `${statusColor(f.status)}1f`,
                    color: statusColor(f.status),
                  }}
                >
                  {f.status.toUpperCase()}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-sm bg-card/60">
                  <div
                    className="h-full"
                    style={{
                      width: `${f.weight * 100}%`,
                      background: `linear-gradient(90deg, ${SEV_COLOR.safe}55, ${SEV_COLOR.safe})`,
                    }}
                  />
                </div>
                <span className="mono w-10 text-right text-[10px] tabular-nums text-muted-foreground">
                  {(f.weight * 100).toFixed(0)}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <div className="rounded-sm border border-border bg-background/40 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--color-accent)]" />
            <span className="hud-label">Model assumptions</span>
          </div>
          <ul className="space-y-2 text-[11px]">
            {p.assumptions.map((a) => (
              <li key={a.label}>
                <div className="mono text-[9px] tracking-widest text-muted-foreground">{a.label}</div>
                <div className="text-foreground/90">{a.value}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-sm border border-border bg-background/40 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[color:var(--color-primary)]" />
            <span className="hud-label">Methods</span>
          </div>
          <ul className="list-disc space-y-1.5 pl-4 text-[11px] marker:text-[color:var(--color-primary)]">
            {p.methods.map((m) => (
              <li key={m} className="text-foreground/85">
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function statusColor(s: "live" | "delayed" | "modeled") {
  return s === "live" ? SEV_COLOR.safe : s === "delayed" ? SEV_COLOR.warn : "#a78bfa";
}

/* ============================== ALERTS =============================== */

function AlertsTab({ year, focus }: { year: number; focus: PulseSection }) {
  const [subs, setSubs] = useState<string[]>([]);
  useEffect(() => setSubs(loadSubs()), []);
  const alerts = useMemo(() => computeAlerts(year), [year]);
  const inFocus = alerts.filter((a) => a.section === focus);
  const rest = alerts.filter((a) => a.section !== focus);
  const onSub = (id: string) => setSubs(toggleSub(id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Active alerts @ {year}</h3>
          <p className="mono text-[10px] tracking-wide text-muted-foreground">
            {alerts.length} risks tripped or in warning · {subs.length} subscribed
          </p>
        </div>
        <div className="mono flex gap-2 text-[10px] tracking-widest">
          <Legend color={SEV_COLOR.crit} label="CRIT" />
          <Legend color={SEV_COLOR.warn} label="WARN" />
        </div>
      </div>

      <AlertList title={`${SECTION_LABEL[focus]} (focus)`} alerts={inFocus} subs={subs} onSub={onSub} />
      {rest.length > 0 && <AlertList title="Other systems" alerts={rest} subs={subs} onSub={onSub} dim />}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1" style={{ color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function AlertList({
  title,
  alerts,
  subs,
  onSub,
  dim,
}: {
  title: string;
  alerts: Alert[];
  subs: string[];
  onSub: (id: string) => void;
  dim?: boolean;
}) {
  if (!alerts.length)
    return (
      <div className="rounded-sm border border-border bg-background/40 p-4 text-[11px] text-muted-foreground">
        <span className="hud-label">{title}</span>
        <div className="mt-1">No alerts tripped at this year.</div>
      </div>
    );
  return (
    <div className={`rounded-sm border border-border bg-background/40 p-4 ${dim ? "opacity-80" : ""}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="hud-label">{title}</span>
        <span className="mono text-[9px] tracking-widest text-muted-foreground">{alerts.length}</span>
      </div>
      <ul className="space-y-1.5">
        {alerts.map((a) => {
          const subbed = subs.includes(a.id);
          const c = SEV_COLOR[a.severity];
          return (
            <li
              key={a.id}
              className="flex items-start justify-between gap-3 rounded-sm border border-border/60 bg-card/30 p-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ backgroundColor: c }} />
                  <span className="mono text-[10px] tracking-widest" style={{ color: c }}>
                    {a.severity.toUpperCase()}
                  </span>
                  <span className="text-[12px] font-medium">{a.label}</span>
                  <span className="mono text-[9px] tracking-widest text-muted-foreground">
                    onset {a.year}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{a.message}</p>
              </div>
              <button
                onClick={() => onSub(a.id)}
                className={`mono flex shrink-0 items-center gap-1 rounded-sm border px-2 py-1 text-[10px] tracking-widest transition ${
                  subbed
                    ? "border-[color:var(--color-primary)]/60 bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {subbed ? <BellRing className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                {subbed ? "ON" : "SUB"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ============================== COMPARE ============================== */

function CompareTab({ section, year }: { section: PulseSection; year: number }) {
  const [all, setAll] = useState<Scenario[]>([]);
  useEffect(() => setAll(loadScenarios()), []);
  const [picked, setPicked] = useState<string[]>([]);
  const togglePick = (id: string) =>
    setPicked((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < 3 ? [...cur, id] : cur,
    );

  const baseline: { id: string; label: string; mods: PulseMods; color: string } = {
    id: "__baseline",
    label: "Baseline (no intervention)",
    mods: pulseModsFor(null),
    color: "#94a3b8",
  };
  const lanes = [
    baseline,
    ...picked
      .map((id, i) => {
        const s = all.find((x) => x.id === id);
        return s
          ? { id, label: s.prompt.slice(0, 38), mods: pulseModsFor(s), color: COMPARE_COLORS[i % COMPARE_COLORS.length] }
          : null;
      })
      .filter(Boolean) as { id: string; label: string; mods: PulseMods; color: string }[],
  ];

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <div className="rounded-sm border border-border bg-background/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="hud-label">Saved scenarios</span>
          <span className="mono text-[9px] tracking-widest text-muted-foreground">
            {picked.length}/3
          </span>
        </div>
        {all.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            No saved runs yet. Run a scenario from the Scenario Engine and save it to diff its
            effect on Earth Pulse.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {all.map((s) => {
              const on = picked.includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    onClick={() => togglePick(s.id)}
                    className={`flex w-full items-start gap-2 rounded-sm border px-2 py-1.5 text-left text-[11px] transition ${
                      on
                        ? "border-[color:var(--color-primary)]/60 bg-[color:var(--color-primary)]/10"
                        : "border-border hover:border-[color:var(--color-primary)]/30"
                    }`}
                  >
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: on
                          ? COMPARE_COLORS[picked.indexOf(s.id) % COMPARE_COLORS.length]
                          : "transparent",
                        border: on ? "none" : "1px solid currentColor",
                      }}
                    />
                    <span className="line-clamp-2">{s.prompt}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="space-y-4">
        {section === "heartbeat" && <CompareHeartbeat lanes={lanes} year={year} />}
        {section === "boundaries" && <CompareBoundaries lanes={lanes} year={year} />}
        {section === "tipping" && <CompareTipping lanes={lanes} year={year} />}
        {section === "stewardship" && <CompareSteward lanes={lanes} year={year} />}
      </div>
    </div>
  );
}

type Lane = { id: string; label: string; mods: PulseMods; color: string };

function CompareHeartbeat({ lanes, year }: { lanes: Lane[]; year: number }) {
  const years = yearSeries();
  const data = years.map((y) => {
    const row: Record<string, number> = { year: y };
    for (const l of lanes) row[l.id] = +vitalIndex(y, l.mods.vital).toFixed(2);
    return row;
  });
  return (
    <>
      <ChartCard
        title="Earth Vital Index across scenarios"
        data={data}
        keys={lanes.map((l) => ({ k: l.id, color: l.color }))}
        yLabel="EVI (0–100)"
        markYear={year}
      />
      <DiffTable
        lanes={lanes}
        year={year}
        rows={lanes.map((l) => {
          const v = vitalIndex(year, l.mods.vital);
          const bpm = bpmFromVital(v);
          return { lane: l, cells: [v.toFixed(1), `${bpm.toFixed(0)} bpm`] };
        })}
        headers={["EVI", "Heart rate"]}
      />
    </>
  );
}

function CompareBoundaries({ lanes, year }: { lanes: Lane[]; year: number }) {
  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <table className="w-full text-[11px]">
        <thead className="bg-card/50 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-normal">Boundary @ {year}</th>
            {lanes.map((l) => (
              <th key={l.id} className="px-3 py-2 text-right font-normal" style={{ color: l.color }}>
                {l.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BOUNDARIES.map((b) => {
            const baseV = boundaryValue(b, year, lanes[0].mods.boundary[b.key] ?? 0);
            return (
              <tr key={b.key} className="border-t border-border/60">
                <td className="px-3 py-1.5">{b.label}</td>
                {lanes.map((l) => {
                  const v = boundaryValue(b, year, l.mods.boundary[b.key] ?? 0);
                  const sev = boundarySev(v);
                  const delta = v - baseV;
                  return (
                    <td key={l.id} className="mono px-3 py-1.5 text-right tabular-nums" style={{ color: SEV_COLOR[sev] }}>
                      {v.toFixed(2)}×
                      {l.id !== lanes[0].id && (
                        <span className="ml-1 text-[9px]" style={{ color: delta < 0 ? SEV_COLOR.safe : SEV_COLOR.crit }}>
                          {delta >= 0 ? "+" : ""}
                          {delta.toFixed(2)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CompareTipping({ lanes, year }: { lanes: Lane[]; year: number }) {
  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <table className="w-full text-[11px]">
        <thead className="bg-card/50 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-normal">Tipping element @ {year}</th>
            {lanes.map((l) => (
              <th key={l.id} className="px-3 py-2 text-right font-normal" style={{ color: l.color }}>
                {l.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIPPINGS.map((tp) => {
            const baseV = tippingValue(tp, year, lanes[0].mods.tipping[tp.key] ?? 0);
            return (
              <tr key={tp.key} className="border-t border-border/60">
                <td className="px-3 py-1.5">{tp.label}</td>
                {lanes.map((l) => {
                  const v = tippingValue(tp, year, l.mods.tipping[tp.key] ?? 0);
                  const sev = tippingSev(v);
                  const delta = v - baseV;
                  return (
                    <td key={l.id} className="mono px-3 py-1.5 text-right tabular-nums" style={{ color: SEV_COLOR[sev] }}>
                      {(v * 100).toFixed(0)}%
                      {l.id !== lanes[0].id && (
                        <span className="ml-1 text-[9px]" style={{ color: delta < 0 ? SEV_COLOR.safe : SEV_COLOR.crit }}>
                          {delta >= 0 ? "+" : ""}
                          {(delta * 100).toFixed(0)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CompareSteward({ lanes, year }: { lanes: Lane[]; year: number }) {
  const keys = Object.keys(STEWARDSHIP_META) as StewardKey[];
  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <table className="w-full text-[11px]">
        <thead className="bg-card/50 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-normal">Index @ {year}</th>
            {lanes.map((l) => (
              <th key={l.id} className="px-3 py-2 text-right font-normal" style={{ color: l.color }}>
                {l.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => {
            const baseV = stewardshipValues(year, lanes[0].mods.steward)[k];
            return (
              <tr key={k} className="border-t border-border/60">
                <td className="px-3 py-1.5">{STEWARDSHIP_META[k].label}</td>
                {lanes.map((l) => {
                  const v = stewardshipValues(year, l.mods.steward)[k];
                  const delta = v - baseV;
                  const good = STEWARDSHIP_META[k].goodWhen === "up" ? delta > 0 : delta < 0;
                  return (
                    <td key={l.id} className="mono px-3 py-1.5 text-right tabular-nums">
                      {v.toFixed(1)}
                      {l.id !== lanes[0].id && (
                        <span
                          className="ml-1 text-[9px]"
                          style={{ color: good ? SEV_COLOR.safe : SEV_COLOR.crit }}
                        >
                          {delta >= 0 ? "+" : ""}
                          {delta.toFixed(1)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DiffTable({
  lanes,
  rows,
  headers,
}: {
  lanes: Lane[];
  year: number;
  rows: { lane: Lane; cells: string[] }[];
  headers: string[];
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <table className="w-full text-[11px]">
        <thead className="bg-card/50 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-normal">Scenario</th>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-right font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.lane.id} className="border-t border-border/60">
              <td className="px-3 py-1.5">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.lane.color }} />
                  {r.lane.label}
                </span>
              </td>
              {r.cells.map((c, i) => (
                <td key={i} className="mono px-3 py-1.5 text-right tabular-nums">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}