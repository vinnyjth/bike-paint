export type BikeShape = "road" | "mountain";

/** Real-world frame dimensions: lengths in mm, angles in degrees */
export interface FrameParams {
  stack: number;
  reach: number;
  seatTubeLength: number;
  headTubeLength: number;
  seatTubeAngle: number;
  headTubeAngle: number;
  chainstayLength: number;
  bbDrop: number;
  /** Fork length along the steering axis, crown to axle (axle-to-crown) */
  forkLength: number;
  forkOffset: number;
  /** Rim bead seat diameter, e.g. 622 for 700c/29", 559 for 26" */
  rimBsd: number;
  tireWidth: number;
  topTubeDia: number;
  downTubeDia: number;
  seatTubeDia: number;
  headTubeDia: number;
}

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
  /** Custom frame dimensions; absent = the shape's stock geometry */
  geometry?: FrameParams;
  /** Where the geometry came from, e.g. "Specialized Tarmac SL7 2024 · 56cm" */
  geometryLabel?: string;
  savedAt: number;
}
