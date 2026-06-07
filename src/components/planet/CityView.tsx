import { useMemo, useState } from "react";
import { Building2, Cloud, Droplets, Gauge, Layers, Wind, X } from "lucide-react";
import { kenyaAt } from "@/lib/kenya-data";

export type CityLayer = "flood" | "traffic" | "air";

const LAYER_META: Record<CityLayer, { label: string; color: string; Icon: typeof Cloud; desc: string }> = {
  flood: { label: "Flood Zones", color: "#60a5fa", Icon: Droplets, desc: "Q100 inundation · drainage strain" },
  traffic: { label: "Traffic Flow", color: "#ffd166", Icon: Gauge, desc: "Live congestion · transit headway" },
  air: { label: "Air Quality", color: "#ff7a59", Icon: Wind, desc: "PM2.5 µg/m³ · NO₂ plumes" },
};

// Stylized Nairobi neighborhoods (synthetic top-down map — no geo deps).
const HOODS = [
  { name: "Westlands", x: 230, y: 170, r: 42 },
  { name: "CBD", x: 360, y: 260, r: 46 },
  { name: "Eastleigh", x: 460, y: 230, r: 38 },
  { name: "Kibera", x: 280, y: 330, r: 44 },
  { name: "Karen", x: 180, y: 410, r: 50 },
  { name: "Embakasi", x: 510, y: 360, r: 52 },
  { name: "Ruaraka", x: 410, y: 150, r: 36 },
  { name: "Lang'ata", x: 240, y: 380, r: 36 },
];

// flood polygons (river basins)
const FLOOD = [
  "M 80 260 Q 200 220 320 280 T 560 320 L 580 360 Q 380 340 200 360 T 60 320 Z",
  "M 200 420 Q 320 380 460 420 T 600 460 L 580 500 Q 380 480 200 500 T 80 460 Z",
];
const ROADS = [
  "M 40 200 L 620 220",
  "M 60 360 Q 320 320 600 380",
  "M 360 60 L 380 540",
  "M 120 60 Q 260 280 220 540",
  "M 540 60 Q 480 280 560 540",
];

export function CityView({
  open,
  onClose,
  year,
}: {
  open: boolean;
  onClose: () => void;
  year: number;
}) {
  const [layers, setLayers] = useState<Set<CityLayer>>(new Set(["flood", "traffic", "air"]));
  const toggle = (k: CityLayer) =>
    setLayers((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const k = kenyaAt(year);

  // Per-neighborhood metrics scale with year (deterministic — no Math.random in render)
  const cells = useMemo(
    () =>
      HOODS.map((h, i) => {
        const phase = (i + 1) * 0.7 + (year - 2020) * 0.13;
        const floodRisk = 0.25 + 0.6 * Math.abs(Math.sin(phase));
        const traffic = 0.3 + 0.6 * Math.abs(Math.cos(phase * 1.3));
        const pm = 18 + 60 * Math.abs(Math.sin(phase * 0.8)) + (year - 2020) * 0.6;
        return { ...h, floodRisk, traffic, pm };
      }),
    [year],
  );

  if (!open) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex animate-[fadein_.35s_ease] flex-col bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Building2 className="h-4 w-4 text-[color:var(--color-primary)]" />
          <div>
            <div className="text-sm font-semibold">Nairobi · City Twin</div>
            <div className="mono text-[10px] tracking-widest text-muted-foreground">
              -1.29°S 36.82°E · {k.urbanPopM.toFixed(2)}M urban · {k.year}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mono flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-[10px] tracking-widest text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" /> EXIT TO PLANET
        </button>
      </div>

      <div className="grid flex-1 grid-cols-[280px_1fr_320px] gap-4 overflow-hidden p-4">
        {/* Layer controls */}
        <div className="panel flex flex-col p-3">
          <div className="mb-2 flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-[color:var(--color-primary)]" />
            <span className="text-sm font-semibold">City Layers</span>
          </div>
          {(Object.keys(LAYER_META) as CityLayer[]).map((k2) => {
            const m = LAYER_META[k2];
            const on = layers.has(k2);
            return (
              <button
                key={k2}
                onClick={() => toggle(k2)}
                className={`mt-1.5 flex items-center gap-3 rounded-sm border px-2.5 py-2 text-left transition ${
                  on
                    ? "border-[color:var(--color-primary)]/50 bg-[color:var(--color-primary)]/10"
                    : "border-transparent hover:border-border"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: m.color, boxShadow: on ? `0 0 10px ${m.color}` : "" }}
                />
                <m.Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs font-medium">{m.label}</div>
                  <div className="mono text-[9px] tracking-wider text-muted-foreground">{m.desc}</div>
                </div>
                <span
                  className={`mono text-[9px] tracking-widest ${
                    on ? "text-[color:var(--color-primary)]" : "text-muted-foreground/60"
                  }`}
                >
                  {on ? "ON" : "OFF"}
                </span>
              </button>
            );
          })}

          <div className="mt-4 space-y-1.5 rounded-sm border border-border bg-card/40 p-2.5">
            <div className="hud-label">Live Kenya feed · {year}</div>
            <Row label="Temp anomaly" v={`+${k.tempAnomalyC.toFixed(2)}°C`} />
            <Row label="Rainfall" v={`${k.rainfallMm} mm`} />
            <Row label="Grid capacity" v={`${k.gridCapacityGW} GW`} />
            <Row label="Renewables" v={`${(k.renewableShare * 100).toFixed(0)}%`} />
            <Row label="Water access" v={`${k.waterAccessPct}%`} />
          </div>
        </div>

        {/* Map */}
        <div className="panel relative overflow-hidden">
          <svg viewBox="0 0 660 580" className="h-full w-full">
            <defs>
              <radialGradient id="cityBg" cx="50%" cy="50%">
                <stop offset="0%" stopColor="oklch(0.22 0.04 235)" />
                <stop offset="100%" stopColor="oklch(0.1 0.03 250)" />
              </radialGradient>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="oklch(0.78 0.1 200 / 0.08)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="660" height="580" fill="url(#cityBg)" />
            <rect width="660" height="580" fill="url(#grid)" />

            {/* flood */}
            {layers.has("flood") &&
              FLOOD.map((d, i) => (
                <path key={i} d={d} fill={LAYER_META.flood.color} opacity={0.18} stroke={LAYER_META.flood.color} strokeOpacity={0.4} />
              ))}

            {/* roads / traffic */}
            {ROADS.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={layers.has("traffic") ? LAYER_META.traffic.color : "oklch(0.78 0.1 200 / 0.3)"}
                strokeWidth={layers.has("traffic") ? 2 + (i % 3) : 1}
                strokeOpacity={layers.has("traffic") ? 0.55 + (i % 3) * 0.1 : 0.35}
                strokeDasharray={layers.has("traffic") ? "6 4" : undefined}
              />
            ))}

            {/* AQ plumes */}
            {layers.has("air") &&
              cells.map((c) => (
                <circle
                  key={`a-${c.name}`}
                  cx={c.x}
                  cy={c.y}
                  r={c.r * 1.4}
                  fill={LAYER_META.air.color}
                  opacity={Math.min(0.28, c.pm / 360)}
                />
              ))}

            {/* neighborhoods */}
            {cells.map((c) => (
              <g key={c.name}>
                <circle cx={c.x} cy={c.y} r={c.r} fill="oklch(0.96 0.01 200 / 0.06)" stroke="oklch(0.82 0.16 190 / 0.5)" />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={4}
                  fill={
                    layers.has("flood") && c.floodRisk > 0.65
                      ? LAYER_META.flood.color
                      : layers.has("air") && c.pm > 55
                        ? LAYER_META.air.color
                        : "oklch(0.82 0.16 190)"
                  }
                />
                <text x={c.x} y={c.y - c.r - 4} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="oklch(0.96 0.01 200 / 0.85)" letterSpacing="1">
                  {c.name.toUpperCase()}
                </text>
                <text x={c.x} y={c.y + c.r + 12} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="8" fill="oklch(0.68 0.03 220)" letterSpacing="0.5">
                  PM {c.pm.toFixed(0)} · F{Math.round(c.floodRisk * 100)} · T{Math.round(c.traffic * 100)}
                </text>
              </g>
            ))}

            <text x="20" y="24" fontFamily="JetBrains Mono" fontSize="10" fill="oklch(0.68 0.03 220)" letterSpacing="2">
              NAIROBI · TILE 36M / EPSG:32737
            </text>
          </svg>
        </div>

        {/* Right column — KPIs */}
        <div className="panel flex flex-col gap-2 p-3">
          <div className="hud-label">Forecast · {year}</div>
          <Kpi label="Flood risk hot zones" v={`${cells.filter((c) => c.floodRisk > 0.65).length}/${cells.length}`} />
          <Kpi label="Mean PM2.5" v={`${(cells.reduce((s, c) => s + c.pm, 0) / cells.length).toFixed(0)} µg/m³`} />
          <Kpi label="Avg congestion" v={`${Math.round((cells.reduce((s, c) => s + c.traffic, 0) / cells.length) * 100)}%`} />
          <Kpi label="Pop. at risk (flood)" v={`${(k.urbanPopM * 0.18).toFixed(2)}M`} />
          <Kpi label="Drought index (KE)" v={k.droughtIndex.toFixed(2)} />
          <div className="mt-2 rounded-sm border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/5 p-2.5 text-[11px] leading-snug">
            <div className="mono mb-1 text-[9px] tracking-widest text-[color:var(--color-accent)]">
              ATLAS · CITY BRIEF
            </div>
            Embakasi & CBD show compounding flood + AQ risk by {year}. Recommend
            permeable surface retrofit (-37% Q100) and BRT line 4 extension to
            cut PM2.5 by ~12%.
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="mono text-foreground">{v}</span>
    </div>
  );
}
function Kpi({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-sm border border-border bg-card/40 px-3 py-2">
      <div className="hud-label">{label}</div>
      <div className="mono mt-0.5 text-base text-[color:var(--color-primary)]">{v}</div>
    </div>
  );
}
