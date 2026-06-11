"use client";

import { colorHex } from "@/lib/colors";
import { Design, PATTERN_LABELS } from "@/lib/types";

interface Props {
  designs: Design[];
  onLoad: (design: Design) => void;
  onDelete: (id: string) => void;
}

export default function SavedDesigns({ designs, onLoad, onDelete }: Props) {
  if (designs.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No saved designs yet — paint something and hit save.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {designs.map((d) => (
        <li
          key={d.id}
          className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2.5"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">{d.name}</p>
            <p className="text-xs text-zinc-500">
              {d.geometryLabel ?? (d.shape === "road" ? "Road" : "Mountain")} ·{" "}
              {PATTERN_LABELS[d.pattern]}
            </p>
            <div className="mt-1 flex gap-1">
              {d.palette.slice(0, 6).map((name, i) => (
                <span
                  key={i}
                  title={name}
                  className="h-3.5 w-3.5 rounded-sm border border-black/10"
                  style={{ backgroundColor: colorHex(name) }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={() => onLoad(d)}
            className="rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
          >
            Load
          </button>
          <button
            onClick={() => onDelete(d.id)}
            className="rounded-md px-2 py-1.5 text-xs text-zinc-400 hover:text-red-600"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
