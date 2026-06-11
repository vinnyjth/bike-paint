// Montana GOLD spray paint range (curated selection).
// Hex values are on-screen approximations of the real cans.

export interface MontanaColor {
  name: string;
  hex: string;
}

export const MONTANA_GOLD: MontanaColor[] = [
  // Whites / yellows
  { name: "Shock White", hex: "#F4F4EE" },
  { name: "Marble", hex: "#DDD9D0" },
  { name: "Easter Yellow", hex: "#F2E6A0" },
  { name: "Banana", hex: "#FCE96A" },
  { name: "Shock Yellow", hex: "#FFE600" },
  { name: "100% Yellow", hex: "#FFD500" },
  { name: "Citrus", hex: "#F7D117" },
  { name: "Melon Yellow", hex: "#FFC42E" },
  // Oranges
  { name: "Apricot", hex: "#FBBF77" },
  { name: "Mango", hex: "#FFA51F" },
  { name: "Goldfish", hex: "#FF8A3B" },
  { name: "Shock Orange", hex: "#FF6A13" },
  // Reds / pinks
  { name: "Fire Red", hex: "#E03C31" },
  { name: "Shock Red", hex: "#D2202F" },
  { name: "Royal Red", hex: "#A6192E" },
  { name: "Strawberry", hex: "#E54B68" },
  { name: "Raspberry", hex: "#B5305B" },
  { name: "Shock Pink", hex: "#FF3F8E" },
  { name: "Fuchsia", hex: "#C5408E" },
  // Purples
  { name: "Lavender", hex: "#B9A7E0" },
  { name: "Shock Lilac", hex: "#9B7EDE" },
  { name: "Violet Dark", hex: "#4B2E83" },
  { name: "Plum", hex: "#6E2C6B" },
  // Blues
  { name: "Ceramic", hex: "#AEC6D4" },
  { name: "Shock Blue Light", hex: "#4FA8E0" },
  { name: "Shock Blue", hex: "#0077C8" },
  { name: "Ultramarine", hex: "#1F3DA6" },
  { name: "Denim", hex: "#33597F" },
  // Teals / greens
  { name: "Turquoise", hex: "#00A3A1" },
  { name: "Mint Light", hex: "#BCE3C5" },
  { name: "Shock Green Light", hex: "#6CC24A" },
  { name: "Shock Green", hex: "#00A651" },
  { name: "Fern Green", hex: "#4A7729" },
  { name: "Kiwi", hex: "#B5BD00" },
  { name: "Avocado", hex: "#6A7029" },
  { name: "Olive", hex: "#5E5C2F" },
  // Browns / neutrals
  { name: "Manila", hex: "#E7D3A1" },
  { name: "Toffee", hex: "#8A5A3B" },
  { name: "Shock Brown", hex: "#5C4033" },
  { name: "Iron Curtain", hex: "#5B5F66" },
  { name: "Pebble", hex: "#C9C4BA" },
  { name: "Shock Black", hex: "#141414" },
  // Metallics
  { name: "Silverchrome", hex: "#C0C5C9" },
  { name: "Goldchrome", hex: "#C9A227" },
  { name: "Copperchrome", hex: "#B26E45" },
];

const byName = new Map(MONTANA_GOLD.map((c) => [c.name, c]));

export function colorHex(name: string): string {
  return byName.get(name)?.hex ?? "#888888";
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Recommend Montana GOLD colors that pair well with the given reference
 * colors. Complementary hues score best, triadic hues next.
 */
export function recommendFor(refNames: string[], count = 8): MontanaColor[] {
  const refs = refNames
    .filter((n) => byName.has(n))
    .map((n) => hexToHsl(colorHex(n)))
    .filter((hsl) => hsl.s > 14); // neutrals don't anchor a harmony

  if (refs.length === 0) return [];

  const scored = MONTANA_GOLD.filter((c) => !refNames.includes(c.name))
    .map((c) => {
      const hsl = hexToHsl(c.hex);
      if (hsl.s < 18 || hsl.l < 12 || hsl.l > 92) return null; // skip neutrals/extremes
      let best = Infinity;
      for (const ref of refs) {
        const comp = hueDist(hsl.h, (ref.h + 180) % 360); // complementary
        const tri = Math.min(
          hueDist(hsl.h, (ref.h + 120) % 360),
          hueDist(hsl.h, (ref.h + 240) % 360)
        );
        best = Math.min(best, comp, tri * 1.6); // weight complements above triads
      }
      return { color: c, score: best };
    })
    .filter((x): x is { color: MontanaColor; score: number } => x !== null)
    .sort((a, b) => a.score - b.score);

  return scored.slice(0, count).map((s) => s.color);
}
