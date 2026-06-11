import { BikeShape } from "./types";

export const VIEW_W = 800;
export const VIEW_H = 520;

export interface Tube {
  id: string;
  label: string;
  d: string;
  width: number;
}

export interface BikeGeometry {
  tubes: Tube[];
  wheels: { cx: number; cy: number; r: number }[];
  /** Non-painted stroked parts: seatpost, bars, cranks, etc. */
  accessories: { d: string; width: number }[];
  /** Non-painted filled parts: saddle */
  solids: string[];
}

export const TUBE_INFO = [
  { id: "top", label: "Top tube" },
  { id: "down", label: "Down tube" },
  { id: "seat", label: "Seat tube" },
  { id: "head", label: "Head tube" },
  { id: "seatstay", label: "Seat stays" },
  { id: "chainstay", label: "Chain stays" },
  { id: "fork", label: "Fork" },
];

export const TUBE_LABELS = TUBE_INFO.map((t) => t.label);

// Tube widths: head tube largest, down tube between head and top,
// top and seat tubes matched.
const road: BikeGeometry = {
  tubes: [
    { id: "top", label: "Top tube", d: "M336,224 L518,215", width: 13 },
    { id: "down", label: "Down tube", d: "M532,262 L390,400", width: 16 },
    { id: "seat", label: "Seat tube", d: "M390,400 L336,224", width: 13 },
    { id: "head", label: "Head tube", d: "M518,215 L532,262", width: 20 },
    { id: "seatstay", label: "Seat stays", d: "M339,240 L248,377", width: 8 },
    { id: "chainstay", label: "Chain stays", d: "M390,400 L248,377", width: 9 },
    { id: "fork", label: "Fork", d: "M532,262 C546,302 578,345 598,377", width: 10 },
  ],
  wheels: [
    { cx: 248, cy: 377, r: 110 },
    { cx: 598, cy: 377, r: 110 },
  ],
  accessories: [
    { d: "M336,224 L329,193", width: 8 }, // seatpost
    { d: "M518,215 L522,200 L558,196", width: 8 }, // stem
    { d: "M558,196 C584,194 592,212 584,232 C580,243 568,247 559,244", width: 7 }, // drop bar
    { d: "M390,400 L442,423", width: 8 }, // crank arm
    { d: "M430,425 L456,425", width: 6 }, // pedal
    { d: "M390,400 m-24,0 a24,24 0 1,0 48,0 a24,24 0 1,0 -48,0", width: 5 }, // chainring
  ],
  solids: [
    // saddle, nose pointing forward
    "M293,190 Q299,180 318,179 Q341,178 354,183 Q364,186 368,190 Q354,196 331,195 Q306,195 293,190 Z",
  ],
};

const mountain: BikeGeometry = {
  tubes: [
    { id: "top", label: "Top tube", d: "M354,258 L545,207", width: 15 },
    { id: "down", label: "Down tube", d: "M560,238 L395,405", width: 18 },
    { id: "seat", label: "Seat tube", d: "M395,405 L350,250", width: 15 },
    { id: "head", label: "Head tube", d: "M545,205 L560,240", width: 22 },
    { id: "seatstay", label: "Seat stays", d: "M354,272 L246,375", width: 9 },
    { id: "chainstay", label: "Chain stays", d: "M395,405 L246,375", width: 10 },
    { id: "fork", label: "Fork", d: "M560,240 L639,375", width: 16 },
  ],
  wheels: [
    { cx: 246, cy: 375, r: 115 },
    { cx: 639, cy: 375, r: 115 },
  ],
  accessories: [
    { d: "M350,250 L339,197", width: 9 }, // dropper post
    { d: "M545,205 L552,188", width: 9 }, // stem
    { d: "M514,186 L596,190", width: 8 }, // flat bar
    { d: "M395,405 L447,429", width: 9 }, // crank arm
    { d: "M435,431 L461,431", width: 7 }, // pedal
    { d: "M395,405 m-21,0 a21,21 0 1,0 42,0 a21,21 0 1,0 -42,0", width: 5 }, // chainring
  ],
  solids: [
    // saddle, slightly chunkier than the road one
    "M303,196 Q309,184 328,183 Q350,182 362,188 Q371,191 374,196 Q360,202 337,201 Q314,201 303,196 Z",
  ],
};

export function bikeGeometry(shape: BikeShape): BikeGeometry {
  return shape === "road" ? road : mountain;
}
