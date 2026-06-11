"use client";

import { MONTANA_GOLD, MontanaColor, recommendFor } from "@/lib/colors";

interface Props {
  /** Color name assigned to the active slot */
  value: string | undefined;
  /** Other colors currently in use — anchors for recommendations */
  inUse: string[];
  onPick: (name: string) => void;
}

function Swatch({
  color,
  selected,
  onPick,
}: {
  color: MontanaColor;
  selected: boolean;
  onPick: (name: string) => void;
}) {
  return (
    <button
      title={color.name}
      onClick={() => onPick(color.name)}
      className={`h-8 w-8 rounded-md border transition-transform hover:scale-110 ${
        selected
          ? "ring-2 ring-offset-1 ring-zinc-800 border-zinc-800"
          : "border-black/15"
      }`}
      style={{ backgroundColor: color.hex }}
    />
  );
}

export default function ColorPicker({ value, inUse, onPick }: Props) {
  // Anchor on the other colors in use; with nothing else picked yet,
  // suggest complements of the current selection instead.
  const anchors = inUse.filter((n) => n !== value);
  const recommended = recommendFor(
    anchors.length > 0 ? anchors : value ? [value] : []
  );

  return (
    <div className="space-y-3">
      {recommended.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Recommended pairings
          </p>
          <div className="flex flex-wrap gap-1.5 rounded-lg bg-emerald-50 p-2">
            {recommended.map((c) => (
              <Swatch
                key={c.name}
                color={c}
                selected={c.name === value}
                onPick={onPick}
              />
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Montana GOLD range
        </p>
        <div className="grid grid-cols-8 gap-1.5">
          {MONTANA_GOLD.map((c) => (
            <Swatch
              key={c.name}
              color={c}
              selected={c.name === value}
              onPick={onPick}
            />
          ))}
        </div>
      </div>
      {value && (
        <p className="text-sm text-zinc-600">
          Selected: <span className="font-medium text-zinc-900">{value}</span>
        </p>
      )}
    </div>
  );
}
