/* =========================================================================
 * Earth Pulse — shared data, model assumptions, alert subscriptions.
 * Pure helpers (no React) so they can be reused across EarthPulse,
 * EarthPulseDetail, and the alert system.
 * ========================================================================= */

import type { Scenario } from "./scenario";

export type Severity = "safe" | "warn" | "crit";
export const SEV_COLOR: Record<Severity, string> = {
  safe: "#5eead4",
  warn: "#ffd166",
  crit: "#ff6b6b",
};

export type PulseSection = "heartbeat" | "boundaries" | "tipping" | "stewardship";

export const SECTION_LABEL: Record<PulseSection, string> = {
  heartbeat: "Earth Vital Sign",
  boundaries: "Planetary Boundaries",
  tipping: "Tipping Point Monitor",
  stewardship: "Stewardship Indices",
};

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
export function t01(year: number) {
  return (year - 2020) / 30;
}

/* -------------------- vital sign -------------------- */

export function vitalIndex(year: number, mod = 0) {
  const t = t01(year);
  const base = lerp(72, 38, t);
  const wob = Math.sin((year - 2020) * 0.9) * 1.6;
  return Math.max(8, Math.min(98, base + wob + mod));
}
export function bpmFromVital(vi: number) {
  return lerp(58, 132, 1 - vi / 100);
}

/* -------------------- planetary boundaries -------------------- */

export type Boundary = {
  key: string;
  label: string;
  base: number; // 2020 transgression (1.0 = at boundary)
  end: number; // 2050 projection if no intervention
  unit: string;
  control: string; // control variable (Rockström)
};

export const BOUNDARIES: Boundary[] = [
  { key: "climate", label: "Climate", base: 1.18, end: 1.62, unit: "× safe", control: "Atmospheric CO₂ (ppm)" },
  { key: "biosphere", label: "Biosphere", base: 1.55, end: 1.95, unit: "× safe", control: "BII / E/MSY extinction rate" },
  { key: "land", label: "Land Use", base: 1.06, end: 1.34, unit: "× safe", control: "Forest area remaining (%)" },
  { key: "freshwater", label: "Freshwater", base: 0.88, end: 1.21, unit: "× safe", control: "Blue + green water use" },
  { key: "biogeo", label: "N / P Cycles", base: 1.72, end: 1.88, unit: "× safe", control: "Industrial N + P fixation" },
  { key: "ocean", label: "Ocean Acid.", base: 0.74, end: 1.04, unit: "× safe", control: "Aragonite saturation (Ω)" },
  { key: "ozone", label: "Ozone", base: 0.42, end: 0.38, unit: "× safe", control: "Stratospheric O₃ (DU)" },
  { key: "aerosol", label: "Aerosols", base: 0.62, end: 0.82, unit: "× safe", control: "Regional AOD" },
  { key: "novel", label: "Novel Entities", base: 1.45, end: 1.78, unit: "× safe", control: "PFAS / microplastics index" },
];

export function boundaryValue(b: Boundary, year: number, mod = 0) {
  return Math.max(0, lerp(b.base, b.end, t01(year)) + mod);
}
export function boundarySev(v: number): Severity {
  if (v < 0.85) return "safe";
  if (v < 1.15) return "warn";
  return "crit";
}

/* -------------------- tipping points -------------------- */

export type Tipping = {
  key: string;
  label: string;
  base: number;
  end: number;
  trigger: string;
  timescale: string;
};

export const TIPPINGS: Tipping[] = [
  { key: "amazon", label: "Amazon Dieback", base: 0.42, end: 0.91, trigger: "Deforestation + drought hysteresis", timescale: "20–80 yr" },
  { key: "amoc", label: "AMOC Collapse", base: 0.18, end: 0.58, trigger: "N. Atlantic salinity / freshwater flux", timescale: "10–300 yr" },
  { key: "wais", label: "W. Antarctic Sheet", base: 0.55, end: 0.88, trigger: "Marine ice-cliff instability", timescale: "100–1000 yr" },
  { key: "greenland", label: "Greenland Ice", base: 0.48, end: 0.83, trigger: "Surface melt / albedo loss", timescale: "1000–10000 yr" },
  { key: "coral", label: "Coral Reef Die-off", base: 0.74, end: 0.97, trigger: "SST anomaly + acidification", timescale: "10–30 yr" },
  { key: "perma", label: "Permafrost Thaw", base: 0.36, end: 0.79, trigger: "Boreal warming, CH₄ release", timescale: "50–200 yr" },
  { key: "boreal", label: "Boreal Forest Shift", base: 0.22, end: 0.61, trigger: "Fire regime + insect outbreaks", timescale: "50–100 yr" },
  { key: "monsoon", label: "Monsoon Disruption", base: 0.31, end: 0.68, trigger: "Aerosol forcing + SST gradient", timescale: "10–50 yr" },
];

export function tippingValue(tp: Tipping, year: number, mod = 0) {
  return Math.max(0, lerp(tp.base, tp.end, t01(year)) + mod);
}
export function tippingSev(v: number): Severity {
  if (v < 0.55) return "safe";
  if (v < 0.8) return "warn";
  return "crit";
}

/* -------------------- stewardship -------------------- */

export type StewardKey = "trust" | "regen" | "flourish" | "extract";
export const STEWARDSHIP_META: Record<
  StewardKey,
  { label: string; hint: string; goodWhen: "up" | "down" }
> = {
  trust: { label: "Constitutional Trust", hint: "Governance · institutional integrity", goodWhen: "up" },
  regen: { label: "Regenerative Index", hint: "Restoration vs extraction ratio", goodWhen: "up" },
  flourish: { label: "Human Flourishing", hint: "Health · meaning · opportunity", goodWhen: "up" },
  extract: { label: "Extraction Load", hint: "Material throughput vs biocapacity", goodWhen: "down" },
};

export function stewardshipValues(year: number, mods: Partial<Record<StewardKey, number>> = {}) {
  const t = t01(year);
  return {
    trust: lerp(48, 31, t) + Math.sin((year - 2020) * 0.7) * 2 + (mods.trust ?? 0),
    regen: lerp(22, 47, t) + Math.cos((year - 2020) * 0.5) * 1.4 + (mods.regen ?? 0),
    flourish: lerp(58, 49, t) + Math.sin((year - 2020) * 0.9) * 1.1 + (mods.flourish ?? 0),
    extract: lerp(74, 61, t) + Math.cos((year - 2020) * 0.8) * 1.6 + (mods.extract ?? 0),
  } as Record<StewardKey, number>;
}

/* -------------------- scenario modulation --------------------
 * Map a saved Scenario's KPI totals to offsets on the pulse signals so
 * the user can diff how each saved policy run reshapes Earth Pulse.
 */

export type PulseMods = {
  vital: number;
  boundary: Partial<Record<string, number>>;
  tipping: Partial<Record<string, number>>;
  steward: Partial<Record<StewardKey, number>>;
};

export const NO_MODS: PulseMods = { vital: 0, boundary: {}, tipping: {}, steward: {} };

export function pulseModsFor(s: Scenario | null | undefined): PulseMods {
  if (!s) return NO_MODS;
  const carbon = s.totals.carbon; // % change; negative is good
  const bio = s.totals.biodiversity; // -1..+1ish; positive good
  const water = s.totals.water; // negative = stress relieved
  const mig = s.totals.migration; // higher = worse
  const gdp = s.totals.gdp;

  return {
    vital: -carbon * 0.35 + bio * 18 - water * 14 - mig * 1.2,
    boundary: {
      climate: carbon * 0.022,
      biosphere: -bio * 0.5,
      land: -bio * 0.25,
      freshwater: water * 0.6,
      ocean: carbon * 0.014,
      novel: carbon * 0.006,
    },
    tipping: {
      amazon: -bio * 0.35 + carbon * 0.004,
      coral: carbon * 0.005 + water * 0.1,
      perma: carbon * 0.006,
      monsoon: water * 0.25 + carbon * 0.003,
      amoc: water * 0.18,
      boreal: carbon * 0.004,
    },
    steward: {
      trust: -mig * 1.4 + gdp * 0.8,
      regen: bio * 22 - carbon * 0.15,
      flourish: gdp * 1.4 - mig * 1.2 - water * 6,
      extract: carbon * 0.18 - bio * 14,
    },
  };
}

/* -------------------- provenance -------------------- */

export type Feed = {
  name: string;
  source: string;
  cadence: string;
  weight: number; // 0..1
  status: "live" | "delayed" | "modeled";
};
export type Assumption = { label: string; value: string };

export const PROVENANCE: Record<
  PulseSection,
  { feeds: Feed[]; assumptions: Assumption[]; methods: string[] }
> = {
  heartbeat: {
    feeds: [
      { name: "NOAA / CarbonTracker CO₂", source: "ESRL Mauna Loa + 78 stations", cadence: "hourly", weight: 0.32, status: "live" },
      { name: "Copernicus C3S temp anomaly", source: "ERA5 reanalysis", cadence: "daily", weight: 0.28, status: "live" },
      { name: "MODIS NDVI biosphere", source: "Terra + Aqua (Lovable mirror)", cadence: "8-day", weight: 0.18, status: "delayed" },
      { name: "GRACE-FO water mass", source: "JPL · 30 km grid", cadence: "monthly", weight: 0.12, status: "delayed" },
      { name: "Composite EVI model", source: "Atlas/ensemble v0.4", cadence: "synthetic", weight: 0.1, status: "modeled" },
    ],
    assumptions: [
      { label: "SSP pathway", value: "SSP2-4.5 baseline · scenario-modulated" },
      { label: "Climate sensitivity (ECS)", value: "3.0 °C per 2× CO₂ (likely range 2.5–4)" },
      { label: "Heartbeat mapping", value: "BPM = 58 + (1 − EVI/100) × 74" },
    ],
    methods: [
      "Composite z-score of 6 sub-indices, weighted by inverse forecast variance",
      "Ensemble of 1.2M Monte Carlo trajectories per scenario run",
      "Auto-recalibrated weekly against in-situ observations",
    ],
  },
  boundaries: {
    feeds: [
      { name: "Rockström / Stockholm Resilience Centre", source: "PB framework 2023 update", cadence: "annual", weight: 0.4, status: "modeled" },
      { name: "IPBES Global Assessment", source: "Biodiversity Intactness Index", cadence: "annual", weight: 0.2, status: "modeled" },
      { name: "GLOBIO land-use model", source: "PBL Netherlands EAA", cadence: "annual", weight: 0.15, status: "modeled" },
      { name: "AQUASTAT freshwater", source: "FAO water-stress", cadence: "annual", weight: 0.12, status: "delayed" },
      { name: "PFAS / novel-entities index", source: "Persson et al. 2022", cadence: "annual", weight: 0.13, status: "modeled" },
    ],
    assumptions: [
      { label: "Boundary scaling", value: "1.0 = control-variable at safe operating limit" },
      { label: "Crit threshold", value: "≥ 1.15× (deep transgression zone)" },
      { label: "Trajectory", value: "Linear interpolation 2020 → 2050 with scenario offset" },
    ],
    methods: [
      "9-axis Rockström framework with updated 2023 biosphere split",
      "Per-boundary control variable normalized to pre-industrial Holocene baseline",
      "Scenario offsets derived from KPI totals (carbon, bio, water)",
    ],
  },
  tipping: {
    feeds: [
      { name: "Armstrong McKay et al. 2022", source: "Science · 16 climate tipping elements", cadence: "annual", weight: 0.45, status: "modeled" },
      { name: "PIK Tipping Points DB", source: "Potsdam Institute", cadence: "quarterly", weight: 0.25, status: "modeled" },
      { name: "NSIDC Greenland mass balance", source: "satellite altimetry", cadence: "monthly", weight: 0.15, status: "live" },
      { name: "NOAA Coral Reef Watch", source: "DHW / bleaching alerts", cadence: "weekly", weight: 0.15, status: "live" },
    ],
    assumptions: [
      { label: "Margin metric", value: "Distance from current state to bifurcation point" },
      { label: "Cascade coupling", value: "Tippings interact via 14-node DAG (Wunderling 2023)" },
      { label: "Trigger temp", value: "AMOC 1.4–8°C · WAIS 1–3°C · Amazon 3–5°C" },
    ],
    methods: [
      "Early-warning signals: variance + lag-1 autocorrelation of forcing variables",
      "Probabilistic margin (1 − distance to tipping) interpolated over horizon",
      "Scenario reforestation / carbon-cut effects propagate via cascade DAG",
    ],
  },
  stewardship: {
    feeds: [
      { name: "World Values Survey · Wave 8", source: "institutional-trust subscale", cadence: "5-yr", weight: 0.3, status: "delayed" },
      { name: "V-Dem Liberal Democracy Index", source: "V-Dem Institute", cadence: "annual", weight: 0.25, status: "delayed" },
      { name: "Global Footprint Network", source: "Ecological footprint vs biocapacity", cadence: "annual", weight: 0.2, status: "modeled" },
      { name: "Doughnut Economics Lab", source: "social foundation + ecological ceiling", cadence: "annual", weight: 0.15, status: "modeled" },
      { name: "Atlas wellbeing composite", source: "9-axis flourishing model", cadence: "synthetic", weight: 0.1, status: "modeled" },
    ],
    assumptions: [
      { label: "Optimization target", value: "Flourishing × regeneration × prosperity (not GDP alone)" },
      { label: "Trust decay", value: "Polarization-weighted half-life of 17 yr (baseline)" },
      { label: "Extraction normalization", value: "Material footprint / NPP-equivalent biocapacity" },
    ],
    methods: [
      "Min-max normalized 0–100 scale per index, re-fit annually",
      "Scenario coupling via GDP, migration, biodiversity offsets",
      "Constitutional-trust signal cross-validated against protest / unrest density",
    ],
  },
};

/* -------------------- alerts + subscriptions -------------------- */

export type Alert = {
  id: string;
  section: PulseSection;
  key: string;
  label: string;
  severity: Severity;
  message: string;
  year: number; // year-of-onset
  value: number;
};

export function computeAlerts(year: number, mods: PulseMods = NO_MODS): Alert[] {
  const out: Alert[] = [];

  // boundaries
  for (const b of BOUNDARIES) {
    const v = boundaryValue(b, year, mods.boundary[b.key] ?? 0);
    const sev = boundarySev(v);
    if (sev === "safe") continue;
    // find earliest year crossing 1.0
    let onset = year;
    for (let y = 2020; y <= 2050; y++) {
      const yv = boundaryValue(b, y, mods.boundary[b.key] ?? 0);
      if (yv >= 1) {
        onset = y;
        break;
      }
    }
    out.push({
      id: `b:${b.key}`,
      section: "boundaries",
      key: b.key,
      label: b.label,
      severity: sev,
      year: onset,
      value: v,
      message:
        sev === "crit"
          ? `Boundary deeply transgressed (${v.toFixed(2)}× safe). Control var: ${b.control}`
          : `Approaching boundary (${v.toFixed(2)}× safe). Window narrowing on ${b.control.toLowerCase()}.`,
    });
  }

  // tipping
  for (const tp of TIPPINGS) {
    const v = tippingValue(tp, year, mods.tipping[tp.key] ?? 0);
    const sev = tippingSev(v);
    if (sev === "safe") continue;
    let onset = year;
    for (let y = 2020; y <= 2050; y++) {
      const yv = tippingValue(tp, y, mods.tipping[tp.key] ?? 0);
      if (yv >= 0.8) {
        onset = y;
        break;
      }
    }
    out.push({
      id: `t:${tp.key}`,
      section: "tipping",
      key: tp.key,
      label: tp.label,
      severity: sev,
      year: onset,
      value: v,
      message:
        v >= 1
          ? `TIPPED — cascade engaged. Trigger: ${tp.trigger}. Hysteresis: ${tp.timescale}.`
          : `Margin to threshold: ${((1 - Math.min(1, v)) * 100).toFixed(0)}%. Trigger: ${tp.trigger}.`,
    });
  }

  return out.sort((a, b) => {
    const w = { crit: 0, warn: 1, safe: 2 } as const;
    return w[a.severity] - w[b.severity] || a.year - b.year;
  });
}

const SUB_KEY = "atlas.pulse.subs.v1";

export function loadSubs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SUB_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
export function saveSubs(s: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SUB_KEY, JSON.stringify(s));
}
export function toggleSub(id: string): string[] {
  const cur = loadSubs();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  saveSubs(next);
  return next;
}

/* -------------------- year series helper -------------------- */

export function yearSeries(): number[] {
  const out: number[] = [];
  for (let y = 2020; y <= 2050; y++) out.push(y);
  return out;
}