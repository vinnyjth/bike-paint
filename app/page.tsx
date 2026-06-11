"use client";

import { useEffect, useMemo, useState } from "react";
import BikeCanvas from "@/components/BikeCanvas";
import ColorPicker from "@/components/ColorPicker";
import SavedDesigns from "@/components/SavedDesigns";
import { TUBE_INFO, TUBE_LABELS } from "@/lib/bikes";
import { colorHex } from "@/lib/colors";
import { loadDesigns, persistDesigns } from "@/lib/storage";
import {
  BikeShape,
  Design,
  PATTERN_LABELS,
  PatternType,
  Stroke,
} from "@/lib/types";

const DEFAULT_PALETTE = [
  "Shock Blue",
  "Mango",
  "Shock White",
  "Fire Red",
  "Citrus",
  "Mint Light",
  "Shock Black",
  "Turquoise",
];

const TUBE_LABEL_BY_ID = Object.fromEntries(
  TUBE_INFO.map((t) => [t.id, t.label])
);

const BACKDROPS = [
  { name: "White", hex: "#ffffff" },
  { name: "Light grey", hex: "#e4e4e7" },
  { name: "Mid grey", hex: "#a1a1aa" },
  { name: "Dark grey", hex: "#52525b" },
  { name: "Slate", hex: "#1e293b" },
  { name: "Black", hex: "#0a0a0a" },
];

function slotLabels(
  pattern: PatternType,
  splatterCount: number,
  stripeCount: number
): string[] {
  switch (pattern) {
    case "one":
      return ["Frame"];
    case "two":
    case "fade":
      return ["Color A", "Color B"];
    case "stripes":
      return Array.from({ length: stripeCount }, (_, i) => `Stripe ${i + 1}`);
    case "dots":
      return ["Base coat", "Dots"];
    case "tubes":
      return TUBE_LABELS;
    case "freestyle":
      return ["Base coat", "Brush"];
    case "splatter":
      return [
        "Base coat",
        ...Array.from({ length: splatterCount }, (_, i) => `Splatter ${i + 1}`),
      ];
  }
}

export default function Home() {
  const [shape, setShape] = useState<BikeShape>("road");
  const [pattern, setPattern] = useState<PatternType>("one");
  // One shared palette: every pattern reads its colors from the front of this
  // array, so picks carry over cleanly when you switch patterns.
  const [palette, setPalette] = useState<string[]>(DEFAULT_PALETTE);
  const [activeSlot, setActiveSlot] = useState(0);
  const [splitAngle, setSplitAngle] = useState(20);
  const [splatterSize, setSplatterSize] = useState(6);
  const [splatterCount, setSplatterCount] = useState(2);
  const [splatterDensity, setSplatterDensity] = useState(9);
  const [stripeWidth, setStripeWidth] = useState(24);
  const [stripeCount, setStripeCount] = useState(2);
  const [dotSize, setDotSize] = useState(7);
  const [seed, setSeed] = useState(42);
  const [locks, setLocks] = useState<Record<string, string>>({});
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [brushSize, setBrushSize] = useState(10);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [designName, setDesignName] = useState("");
  const [backdrop, setBackdrop] = useState(BACKDROPS[0].hex);

  useEffect(() => {
    setDesigns(loadDesigns());
  }, []);

  const slots = useMemo(
    () => slotLabels(pattern, splatterCount, stripeCount),
    [pattern, splatterCount, stripeCount]
  );
  const slot = Math.min(activeSlot, slots.length - 1);
  const inUse = palette.slice(0, slots.length);
  const brushColor =
    pattern === "freestyle" ? palette[slot === 0 ? 1 : slot] : palette[0];

  const pickColor = (name: string) => {
    setPalette((p) => {
      const next = [...p];
      next[slot] = name;
      return next;
    });
  };

  const toggleLock = (tubeId: string) => {
    setLocks((prev) => {
      const next = { ...prev };
      if (next[tubeId]) {
        delete next[tubeId];
      } else {
        next[tubeId] = palette[slot];
      }
      return next;
    });
  };

  const saveDesign = () => {
    const design: Design = {
      id: crypto.randomUUID(),
      name: designName.trim() || `Design ${designs.length + 1}`,
      shape,
      pattern,
      palette,
      splitAngle,
      splatterSize,
      splatterCount,
      splatterDensity,
      stripeWidth,
      stripeCount,
      dotSize,
      seed,
      locks,
      strokes: pattern === "freestyle" ? strokes : [],
      savedAt: Date.now(),
    };
    const next = [design, ...designs];
    setDesigns(next);
    persistDesigns(next);
    setDesignName("");
  };

  const loadDesign = (d: Design) => {
    setShape(d.shape);
    setPattern(d.pattern);
    setPalette(d.palette);
    setSplitAngle(d.splitAngle);
    setSplatterSize(d.splatterSize);
    setSplatterCount(d.splatterCount);
    setSplatterDensity(d.splatterDensity ?? 9);
    setStripeWidth(d.stripeWidth ?? 24);
    setStripeCount(d.stripeCount ?? 2);
    setDotSize(d.dotSize ?? 7);
    setSeed(d.seed);
    setLocks(d.locks ?? {});
    setStrokes(d.strokes);
    setActiveSlot(0);
  };

  const deleteDesign = (id: string) => {
    const next = designs.filter((d) => d.id !== id);
    setDesigns(next);
    persistDesigns(next);
  };

  const showAngle =
    pattern === "two" || pattern === "fade" || pattern === "stripes";
  const lockedIds = Object.keys(locks);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">
          Bike Paint Lab
          <span className="ml-2 text-sm font-normal text-zinc-500">
            Montana GOLD edition
          </span>
        </h1>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[1fr_400px]">
        {/* Canvas side */}
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["road", "mountain"] as BikeShape[]).map((s) => (
              <button
                key={s}
                onClick={() => setShape(s)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  shape === s
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {s === "road" ? "Road bike" : "Mountain bike"}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-end gap-1.5">
              <span className="mr-1 text-xs font-medium text-zinc-500">
                Backdrop
              </span>
              {BACKDROPS.map((b) => (
                <button
                  key={b.hex}
                  title={b.name}
                  onClick={() => setBackdrop(b.hex)}
                  className={`h-6 w-6 rounded-full border ${
                    backdrop === b.hex
                      ? "ring-2 ring-offset-1 ring-zinc-800 border-zinc-800"
                      : "border-black/20"
                  }`}
                  style={{ backgroundColor: b.hex }}
                />
              ))}
            </div>
            <div
              className="rounded-lg transition-colors"
              style={{ backgroundColor: backdrop }}
            >
              <BikeCanvas
              shape={shape}
              pattern={pattern}
              palette={palette}
              splitAngle={splitAngle}
              splatterSize={splatterSize}
              splatterCount={splatterCount}
              splatterDensity={splatterDensity}
              stripeWidth={stripeWidth}
              stripeCount={stripeCount}
              dotSize={dotSize}
              seed={seed}
              locks={locks}
              strokes={strokes}
              brushColor={brushColor}
              brushSize={brushSize}
              onStrokesChange={setStrokes}
              onTubeClick={toggleLock}
            />
            </div>
            <p className="mt-1 text-center text-xs text-zinc-400">
              {pattern === "freestyle"
                ? "Draw on the frame — paint only sticks to the tubes."
                : "Click a tube to lock it to the selected color; click again to unlock."}
            </p>
          </div>

          {/* Pattern-specific controls */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="space-y-4">
              {showAngle && (
                <label className="block text-sm">
                  <span className="font-medium">
                    {pattern === "two"
                      ? "Split orientation"
                      : pattern === "fade"
                        ? "Fade direction"
                        : "Stripe angle"}
                  </span>
                  <span className="ml-2 text-zinc-500">{splitAngle}°</span>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={splitAngle}
                    onChange={(e) => setSplitAngle(Number(e.target.value))}
                    className="mt-2 w-full"
                  />
                </label>
              )}
              {pattern === "stripes" && (
                <div className="flex items-center gap-6 text-sm">
                  <label className="flex flex-1 items-center gap-3">
                    <span className="whitespace-nowrap font-medium">
                      Stripe width
                    </span>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      value={stripeWidth}
                      onChange={(e) => setStripeWidth(Number(e.target.value))}
                      className="w-full"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="font-medium">Colors</span>
                    <select
                      value={stripeCount}
                      onChange={(e) => setStripeCount(Number(e.target.value))}
                      className="rounded-md border border-zinc-300 px-2 py-1"
                    >
                      {[2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              {pattern === "dots" && (
                <label className="block text-sm">
                  <span className="font-medium">Dot size</span>
                  <input
                    type="range"
                    min={3}
                    max={14}
                    value={dotSize}
                    onChange={(e) => setDotSize(Number(e.target.value))}
                    className="mt-2 w-full"
                  />
                </label>
              )}
              {pattern === "splatter" && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <label className="block text-sm">
                      <span className="font-medium">Splatter size</span>
                      <input
                        type="range"
                        min={2}
                        max={14}
                        value={splatterSize}
                        onChange={(e) => setSplatterSize(Number(e.target.value))}
                        className="mt-2 w-full"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium">Splatter frequency</span>
                      <input
                        type="range"
                        min={2}
                        max={15}
                        value={splatterDensity}
                        onChange={(e) =>
                          setSplatterDensity(Number(e.target.value))
                        }
                        className="mt-2 w-full"
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <span className="font-medium">Splatter colors</span>
                      <select
                        value={splatterCount}
                        onChange={(e) => setSplatterCount(Number(e.target.value))}
                        className="rounded-md border border-zinc-300 px-2 py-1"
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      onClick={() => setSeed(Math.floor(Math.random() * 1e9))}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                    >
                      Re-splatter
                    </button>
                  </div>
                </>
              )}
              {pattern === "freestyle" && (
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex flex-1 items-center gap-3">
                    <span className="whitespace-nowrap font-medium">
                      Brush size
                    </span>
                    <input
                      type="range"
                      min={3}
                      max={24}
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </label>
                  <button
                    onClick={() => setStrokes(strokes.slice(0, -1))}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium hover:bg-zinc-50"
                  >
                    Undo
                  </button>
                  <button
                    onClick={() => setStrokes([])}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium hover:bg-zinc-50"
                  >
                    Clear
                  </button>
                </div>
              )}
              {(pattern === "one" || pattern === "tubes") && (
                <p className="text-sm text-zinc-500">
                  {pattern === "one"
                    ? "A single clean coat across the whole frame."
                    : "Every tube gets its own can — assign colors via the slots above."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Controls side */}
        <div className="space-y-4">
          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Pattern
            </h2>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PATTERN_LABELS) as PatternType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPattern(p)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    pattern === p
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {PATTERN_LABELS[p]}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Colors
            </h2>
            <div className="mb-3 flex flex-wrap gap-2">
              {slots.map((label, i) => (
                <button
                  key={label}
                  onClick={() => setActiveSlot(i)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                    slot === i
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-sm border border-black/20"
                    style={{ backgroundColor: colorHex(palette[i]) }}
                  />
                  {label}
                </button>
              ))}
            </div>
            <ColorPicker value={palette[slot]} inUse={inUse} onPick={pickColor} />
          </section>

          {lockedIds.length > 0 && (
            <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  Locked tubes
                </h2>
                <button
                  onClick={() => setLocks({})}
                  className="text-xs font-medium text-zinc-400 hover:text-red-600"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {lockedIds.map((id) => (
                  <span
                    key={id}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700"
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-zinc-500">
                      <rect x="3" y="7" width="10" height="7" rx="1.5" />
                      <path
                        d="M5,7 V5 a3,3 0 0 1 6,0 V7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                    <span
                      className="h-4 w-4 rounded-sm border border-black/20"
                      style={{ backgroundColor: colorHex(locks[id]) }}
                      title={locks[id]}
                    />
                    {TUBE_LABEL_BY_ID[id]}
                    <button
                      onClick={() => toggleLock(id)}
                      className="ml-0.5 text-zinc-400 hover:text-red-600"
                      title="Clear lock"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Saved designs
            </h2>
            <div className="mb-3 flex gap-2">
              <input
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                placeholder={`Design ${designs.length + 1}`}
                className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
              />
              <button
                onClick={saveDesign}
                className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Save
              </button>
            </div>
            <SavedDesigns
              designs={designs}
              onLoad={loadDesign}
              onDelete={deleteDesign}
            />
          </section>

          <p className="px-1 text-xs text-zinc-400">
            On-screen colors approximate the Montana GOLD can range.
          </p>
        </div>
      </main>
    </div>
  );
}
