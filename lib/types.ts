export type BikeShape = "road" | "mountain";

export type PatternType =
  | "one"
  | "two"
  | "fade"
  | "stripes"
  | "dots"
  | "tubes"
  | "freestyle"
  | "splatter";

export const PATTERN_LABELS: Record<PatternType, string> = {
  one: "One color",
  two: "Two-color split",
  fade: "Fade",
  stripes: "Stripes",
  dots: "Polka dots",
  tubes: "Tube by tube",
  freestyle: "Freestyle",
  splatter: "Splatter",
};

export interface Stroke {
  points: [number, number][];
  /** Montana GOLD color name */
  color: string;
  size: number;
}

export interface Design {
  id: string;
  name: string;
  shape: BikeShape;
  pattern: PatternType;
  /** Shared palette of Montana GOLD color names; patterns read slots from the front */
  palette: string[];
  splitAngle: number;
  splatterSize: number;
  splatterCount: number;
  splatterDensity: number;
  stripeWidth: number;
  stripeCount: number;
  dotSize: number;
  seed: number;
  /** Tube id -> Montana GOLD color name, overrides any pattern */
  locks: Record<string, string>;
  strokes: Stroke[];
  savedAt: number;
}
