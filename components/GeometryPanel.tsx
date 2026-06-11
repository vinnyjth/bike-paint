"use client";

import { useState } from "react";
import { defaultParams } from "@/lib/bikes";
import { BikeShape, FrameParams } from "@/lib/types";

interface ImportResult {
  name: string;
  version: string | null;
  build: string | null;
  suggestedShape: BikeShape;
  sizes: { size: string; params: Partial<FrameParams> }[];
}

interface Props {
  shape: BikeShape;
  /** null = the shape's stock geometry */
  custom: FrameParams | null;
  customLabel: string | null;
  onCustomChange: (params: FrameParams | null) => void;
  onImport: (params: FrameParams, shape: BikeShape, label: string) => void;
}

const WHEEL_SIZES = [
  { label: '700c / 29"', bsd: 622 },
  { label: '650b / 27.5"', bsd: 584 },
  { label: '650c', bsd: 571 },
  { label: '26"', bsd: 559 },
  { label: '24"', bsd: 507 },
  { label: '20" (BMX)', bsd: 406 },
  { label: '16"', bsd: 305 },
];

const SLIDERS: {
  key: keyof FrameParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}[] = [
  { key: "topTubeDia", label: "Top tube", min: 20, max: 80, step: 1, unit: "mm" },
  { key: "downTubeDia", label: "Down tube", min: 20, max: 90, step: 1, unit: "mm" },
  { key: "seatTubeDia", label: "Seat tube", min: 20, max: 80, step: 1, unit: "mm" },
  { key: "headTubeDia", label: "Head tube", min: 25, max: 90, step: 1, unit: "mm" },
  { key: "seatTubeAngle", label: "Seat tube angle", min: 64, max: 80, step: 0.5, unit: "°" },
  { key: "headTubeAngle", label: "Head tube angle", min: 60, max: 80, step: 0.5, unit: "°" },
  { key: "forkLength", label: "Fork length", min: 300, max: 650, step: 5, unit: "mm" },
  { key: "tireWidth", label: "Tire width", min: 20, max: 80, step: 1, unit: "mm" },
];

export default function GeometryPanel({
  shape,
  custom,
  customLabel,
  onCustomChange,
  onImport,
}: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [sizeIdx, setSizeIdx] = useState(0);

  const params = custom ?? defaultParams(shape);

  const setValue = (key: keyof FrameParams, value: number) => {
    onCustomChange({ ...params, [key]: value });
  };

  const applySize = (r: ImportResult, idx: number) => {
    setSizeIdx(idx);
    const merged = { ...defaultParams(r.suggestedShape), ...r.sizes[idx].params };
    const label = [r.name, r.version].filter(Boolean).join(" ") + ` · ${r.sizes[idx].size}`;
    onImport(merged, r.suggestedShape, label);
    setOpen(true);
  };

  const doImport = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/bikeinsights?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult(data);
      applySize(data, 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    onCustomChange(null);
    setResult(null);
    setError(null);
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Frame geometry
        </h2>
        <div className="flex items-center gap-3">
          {custom && (
            <button
              onClick={reset}
              className="text-xs font-medium text-zinc-400 hover:text-red-600"
            >
              Reset to stock
            </button>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
          >
            {open ? "Hide ▴" : "Customize ▾"}
          </button>
        </div>
      </div>

      {customLabel && (
        <p className="mb-3 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
          Geometry from {customLabel}
        </p>
      )}

      {open && (
        <>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <span className="font-medium">Wheel size</span>
            <select
              value={params.rimBsd}
              onChange={(e) => setValue("rimBsd", Number(e.target.value))}
              className="rounded-md border border-zinc-300 px-2 py-1"
            >
              {!WHEEL_SIZES.some((ws) => ws.bsd === params.rimBsd) && (
                <option value={params.rimBsd}>{params.rimBsd}mm BSD</option>
              )}
              {WHEEL_SIZES.map((ws) => (
                <option key={ws.bsd} value={ws.bsd}>
                  {ws.label}
                </option>
              ))}
            </select>
          </label>
          <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {SLIDERS.map(({ key, label, min, max, step, unit }) => (
              <label key={key} className="block text-sm">
                <span className="font-medium">{label}</span>
                <span className="ml-2 text-zinc-500">
                  {params[key]}
                  {unit}
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={params[key]}
                  onChange={(e) => setValue(key, Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </label>
            ))}
          </div>

          <div className="border-t border-zinc-100 pt-3">
            <p className="mb-2 text-xs font-medium text-zinc-500">
              Import from Bike Insights — paste a bike or specific-geometry link
            </p>
            <div className="flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && url.trim() && !busy && doImport()}
                placeholder="https://bikeinsights.com/bikes/..."
                className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
              />
              <button
                onClick={doImport}
                disabled={busy || !url.trim()}
                className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40"
              >
                {busy ? "Importing…" : "Import"}
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            {result && result.sizes.length > 1 && (
              <label className="mt-3 flex items-center gap-2 text-sm">
                <span className="font-medium">Size</span>
                <select
                  value={sizeIdx}
                  onChange={(e) => applySize(result, Number(e.target.value))}
                  className="rounded-md border border-zinc-300 px-2 py-1"
                >
                  {result.sizes.map((s, i) => (
                    <option key={i} value={i}>
                      {s.size}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </>
      )}
    </section>
  );
}
