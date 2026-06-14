import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2 } from "lucide-react";
import { Globe } from "@/components/planet/Globe";
import type { LayerKey } from "@/components/planet/Globe";
import {
  AlertCenter,
  LayerPanel,
  StatsRail,
  Ticker,
  TimeMachine,
  TopBar,
} from "@/components/planet/HUD";
import { ScenarioPanel } from "@/components/planet/ScenarioPanel";
import { CityView } from "@/components/planet/CityView";
import { EarthPulse } from "@/components/planet/EarthPulse";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas Earth · Planetary Digital Twin" },
      {
        name: "description",
        content:
          "A living simulation of civilization. Climate, water, energy, supply chains, biodiversity — modeled in real time.",
      },
      { property: "og:title", content: "Atlas Earth · Planetary Digital Twin" },
      {
        property: "og:description",
        content:
          "A living simulation of civilization. Climate, water, energy, supply chains, biodiversity — modeled in real time.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [layers, setLayers] = useState<LayerKey[]>([
    "climate",
    "water",
    "energy",
    "supply",
    "population",
  ]);
  const [year, setYear] = useState(2026);
  const [cityOpen, setCityOpen] = useState(false);

  const toggle = (k: LayerKey) =>
    setLayers((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Aurora background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 110%, oklch(0.82 0.16 190 / 0.18), transparent 60%), radial-gradient(ellipse at 80% 0%, oklch(0.78 0.18 155 / 0.10), transparent 55%)",
        }}
      />
      <div aria-hidden className="scanline absolute inset-0" />

      {/* Earth canvas — hero */}
      <Globe activeLayers={layers} timeYear={year} />

      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, oklch(0.05 0.02 240 / 0.6) 100%)",
        }}
      />

      <TopBar />

      {/* Left dock — layer marketplace */}
      <aside className="pointer-events-none absolute left-6 top-24 bottom-44 z-10 flex flex-col gap-3 overflow-y-auto pr-1">
        <LayerPanel active={layers} onToggle={toggle} />
        <EarthPulse year={year} />
      </aside>

      {/* Right dock — alerts */}
      <aside className="pointer-events-none absolute right-6 top-24 bottom-44 z-10">
        <AlertCenter />
      </aside>

      {/* Hero overlay — only when no scenario open is conceptual; always show small intro */}
      <div className="pointer-events-none absolute left-1/2 top-28 z-10 -translate-x-1/2 text-center">
        <div className="hud-label">EARTH · LIVE</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
          The nervous system of a planet.
        </h1>
        <p className="mono mt-1 text-[10px] tracking-widest text-muted-foreground">
          218 SATELLITES · 47 COUPLED MODELS · 1.2M TRAJECTORIES/MIN
        </p>
        <button
          onClick={() => setCityOpen(true)}
          className="mono pointer-events-auto mt-3 inline-flex items-center gap-1.5 rounded-sm border border-[color:var(--color-primary)]/50 bg-[color:var(--color-primary)]/10 px-3 py-1.5 text-[10px] tracking-widest text-[color:var(--color-primary)] transition hover:bg-[color:var(--color-primary)]/20"
        >
          <Building2 className="h-3 w-3" /> ZOOM · NAIROBI ↘
        </button>
      </div>

      {/* Bottom dock */}
      <div className="absolute right-0 bottom-0 left-0 z-10">
        <div className="px-6 pb-3">
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <StatsRail />
              <TimeMachine year={year} onChange={setYear} />
            </div>
            <ScenarioPanel />
          </div>
        </div>
        <Ticker />
      </div>

      <CityView open={cityOpen} onClose={() => setCityOpen(false)} year={year} />
    </div>
  );
}
