// Phase 1 — Kenya & East Africa simulated data feed.
// Replace fetchKenya() with a real API later (e.g. NASA POWER, World Bank,
// KMD, ENTSO-E equivalents). Values are deterministic so charts are stable
// between SSR and client (avoids hydration drift).

export type YearPoint = {
  year: number;
  tempAnomalyC: number; // vs 1980-2010 baseline, Kenya mean
  rainfallMm: number; // annual mean across Kenya
  droughtIndex: number; // 0..1, higher = worse
  gridCapacityGW: number; // installed
  renewableShare: number; // 0..1
  waterAccessPct: number; // % population with safe water
  roadsPavedKm: number;
  urbanPopM: number; // millions urban
  gdpBn: number; // USD billions
};

// Plausible 2020 baseline (public-domain rough figures, World Bank/IRENA/KMD)
const BASE = {
  year: 2020,
  tempAnomalyC: 1.05,
  rainfallMm: 630,
  droughtIndex: 0.42,
  gridCapacityGW: 2.84,
  renewableShare: 0.81,
  waterAccessPct: 59,
  roadsPavedKm: 14200,
  urbanPopM: 14.3,
  gdpBn: 100.7,
};

// Smooth deterministic trajectory 2020-2050
export function kenyaSeries(): YearPoint[] {
  const out: YearPoint[] = [];
  for (let y = 2020; y <= 2050; y++) {
    const t = (y - 2020) / 30; // 0..1
    // climate: warming + rainfall variability + drought rising
    const wave = Math.sin((y - 2020) * 0.9);
    out.push({
      year: y,
      tempAnomalyC: +(BASE.tempAnomalyC + t * 1.45 + wave * 0.06).toFixed(3),
      rainfallMm: Math.round(BASE.rainfallMm - t * 70 + wave * 35),
      droughtIndex: +Math.min(0.95, BASE.droughtIndex + t * 0.32 + wave * 0.04).toFixed(3),
      gridCapacityGW: +(BASE.gridCapacityGW + t * 6.1 + Math.sin(y) * 0.05).toFixed(2),
      renewableShare: +Math.min(0.97, BASE.renewableShare + t * 0.14).toFixed(3),
      waterAccessPct: +Math.min(96, BASE.waterAccessPct + t * 28).toFixed(1),
      roadsPavedKm: Math.round(BASE.roadsPavedKm + t * 18500),
      urbanPopM: +(BASE.urbanPopM + t * 12.4).toFixed(2),
      gdpBn: +(BASE.gdpBn * Math.pow(1.052, y - 2020)).toFixed(1),
    });
  }
  return out;
}

export const KENYA = kenyaSeries();

export function kenyaAt(year: number): YearPoint {
  return KENYA.find((p) => p.year === year) ?? KENYA[0];
}

// East Africa rollup (simple multipliers — placeholder until real feed)
export function eastAfricaAt(year: number) {
  const k = kenyaAt(year);
  return {
    population: +(k.urbanPopM * 12.4).toFixed(1), // EAC ~480M by 2050
    gridCapacityGW: +(k.gridCapacityGW * 4.2).toFixed(1),
    waterStress: +(k.droughtIndex * 1.1).toFixed(2),
    tempAnomalyC: +(k.tempAnomalyC * 0.96).toFixed(2),
  };
}
