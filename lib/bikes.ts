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
  /** Non-painted stroked parts: seatpost, bars, drivetrain, etc. */
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

// Road geometry scaled from a size-56 race bike at ~0.334 px/mm:
// 700c wheels, 410mm chainstays, 70mm BB drop, 73.5deg seat tube,
// 73deg head tube, stack 565 / reach 390. Axles y=378, BB (380,401).
const road: BikeGeometry = {
  tubes: [
    { id: "top", label: "Top tube", d: "M327,222 L510,212", width: 13 },
    { id: "down", label: "Down tube", d: "M525,262 L380,401", width: 17 },
    { id: "seat", label: "Seat tube", d: "M380,401 L327,222", width: 14 },
    { id: "head", label: "Head tube", d: "M510,212 L525,262", width: 19 },
    { id: "seatstay", label: "Seat stays", d: "M329,238 L239,374", width: 7.5 },
    { id: "chainstay", label: "Chain stays", d: "M380,401 L239,376", width: 8 },
    { id: "fork", label: "Fork", d: "M525,262 C534,300 562,344 592,378", width: 10 },
  ],
  wheels: [
    { cx: 238, cy: 378, r: 112 },
    { cx: 592, cy: 378, r: 112 },
  ],
  accessories: [
    { d: "M327,222 L313,174", width: 8 }, // seatpost
    { d: "M510,212 L505,197", width: 10 }, // steerer + spacers
    { d: "M505,198 L548,200", width: 9 }, // stem
    { d: "M548,200 L566,200 C577,201 580,210 578,219 C576,231 566,238 556,236", width: 7 }, // drop bar
    { d: "M575,206 L586,224", width: 5.5 }, // brake hood/lever
    { d: "M380,401 L334,383", width: 7 }, // far crank arm
    { d: "M380,401 L433,421", width: 8 }, // drive crank arm
    { d: "M421,424 L449,424", width: 6 }, // pedal
    { d: "M380,401 m-23,0 a23,23 0 1,0 46,0 a23,23 0 1,0 -46,0", width: 4 }, // chainring
    { d: "M238,378 m-11,0 a11,11 0 1,0 22,0 a11,11 0 1,0 -22,0", width: 3.5 }, // cog
    { d: "M376,378 L240,368", width: 2.5 }, // chain top run
    { d: "M380,424 L254,409", width: 2.5 }, // chain bottom run
    { d: "M244,388 L252,408", width: 4 }, // derailleur cage
    { d: "M252,408 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0", width: 3 }, // pulley
    { d: "M238,378 m-24,0 a24,24 0 1,0 48,0 a24,24 0 1,0 -48,0", width: 3 }, // rear rotor
    { d: "M592,378 m-24,0 a24,24 0 1,0 48,0 a24,24 0 1,0 -48,0", width: 3 }, // front rotor
  ],
  solids: [
    // saddle: flat top, kicked tail, dropped nose
    "M273,176 Q275,169 290,167 L336,167 Q349,168 356,175 Q341,180 312,180 Q286,180 273,176 Z",
  ],
};

// MTB scaled from a modern trail hardtail: 29er wheels, 435mm stays,
// slack 64.5deg head angle, steep 74deg seat tube, long reach.
// Stanchions are dark metal; the painted "fork" tube is the lowers.
const mountain: BikeGeometry = {
  tubes: [
    { id: "top", label: "Top tube", d: "M345,252 L528,180", width: 15 },
    { id: "down", label: "Down tube", d: "M546,205 L382,382", width: 18 },
    { id: "seat", label: "Seat tube", d: "M380,382 L341,247", width: 15 },
    { id: "head", label: "Head tube", d: "M532,173 L546,205", width: 21 },
    { id: "seatstay", label: "Seat stays", d: "M345,262 L234,368", width: 9 },
    { id: "chainstay", label: "Chain stays", d: "M380,382 L234,371", width: 10 },
    { id: "fork", label: "Fork", d: "M573,264 L619,372", width: 16 },
  ],
  wheels: [
    { cx: 233, cy: 372, r: 118 },
    { cx: 619, cy: 372, r: 118 },
  ],
  accessories: [
    { d: "M546,205 L576,272", width: 12 }, // fork stanchion
    { d: "M341,247 L331,202", width: 9 }, // dropper post
    { d: "M532,173 L528,163", width: 10 }, // steerer
    { d: "M528,164 L552,160", width: 9 }, // stem
    { d: "M516,156 L588,164", width: 8 }, // flat bar
    { d: "M380,382 L331,362", width: 8 }, // far crank arm
    { d: "M380,382 L431,404", width: 9 }, // drive crank arm
    { d: "M419,407 L447,407", width: 7 }, // pedal
    { d: "M380,382 m-19,0 a19,19 0 1,0 38,0 a19,19 0 1,0 -38,0", width: 4 }, // chainring
    { d: "M233,372 m-14,0 a14,14 0 1,0 28,0 a14,14 0 1,0 -28,0", width: 5 }, // cassette
    { d: "M376,363 L235,358", width: 2.5 }, // chain top run
    { d: "M378,401 L250,400", width: 2.5 }, // chain bottom run
    { d: "M240,386 L248,406", width: 4 }, // derailleur cage
    { d: "M248,406 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0", width: 3 }, // pulley
    { d: "M233,372 m-28,0 a28,28 0 1,0 56,0 a28,28 0 1,0 -56,0", width: 3.5 }, // rear rotor
    { d: "M619,372 m-28,0 a28,28 0 1,0 56,0 a28,28 0 1,0 -56,0", width: 3.5 }, // front rotor
  ],
  solids: [
    // saddle
    "M291,201 Q293,193 309,191 L347,191 Q360,193 366,200 Q351,206 324,206 Q302,206 291,201 Z",
  ],
};

export function bikeGeometry(shape: BikeShape): BikeGeometry {
  return shape === "road" ? road : mountain;
}
