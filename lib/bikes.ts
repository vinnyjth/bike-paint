import { BikeShape, FrameParams } from "./types";

export const VIEW_W = 800;
export const VIEW_H = 520;

/** px per mm of the original hand-drawn art; also the max render scale */
const BASE_SCALE = 0.334;

export interface Tube {
  id: string;
  label: string;
  d: string;
  width: number;
}

export interface BikeGeometry {
  tubes: Tube[];
  /** r is the tire centerline radius; tire is the tire stroke width */
  wheels: { cx: number; cy: number; r: number; tire: number; rimR: number }[];
  /** Non-painted stroked parts: steerer, drivetrain, etc. */
  accessories: { d: string; width: number }[];
  /** Render scale relative to the stock drawings (1 = same size) */
  k: number;
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

// Both default sets are reverse-engineered from the original hand-drawn art
// at 0.334 px/mm, so the stock bikes render the same as before.
export const ROAD_PARAMS: FrameParams = {
  stack: 566,
  reach: 389,
  seatTubeLength: 559,
  headTubeLength: 156,
  seatTubeAngle: 73.5,
  headTubeAngle: 73,
  chainstayLength: 430,
  bbDrop: 69,
  forkLength: 400,
  forkOffset: 50,
  rimBsd: 622,
  tireWidth: 28,
  topTubeDia: 39,
  downTubeDia: 51,
  seatTubeDia: 42,
  headTubeDia: 57,
};

export const MTB_PARAMS: FrameParams = {
  stack: 626,
  reach: 455,
  seatTubeLength: 421,
  headTubeLength: 105,
  seatTubeAngle: 74,
  headTubeAngle: 65,
  chainstayLength: 441,
  bbDrop: 30,
  forkLength: 545,
  forkOffset: 45,
  rimBsd: 622,
  tireWidth: 57,
  topTubeDia: 45,
  downTubeDia: 54,
  seatTubeDia: 45,
  headTubeDia: 63,
};

export function defaultParams(shape: BikeShape): FrameParams {
  return { ...(shape === "road" ? ROAD_PARAMS : MTB_PARAMS) };
}

type Pt = [number, number];

const rad = (deg: number) => (deg * Math.PI) / 180;
const r1 = (n: number) => Math.round(n * 10) / 10;

export function bikeGeometry(shape: BikeShape, params?: FrameParams): BikeGeometry {
  const p = params ?? defaultParams(shape);

  // Frame points in mm: BB at the origin, +x toward the front, +y up.
  const sta = rad(p.seatTubeAngle);
  const hta = rad(p.headTubeAngle);
  const steer: Pt = [Math.cos(hta), -Math.sin(hta)]; // down the steering axis
  const stayReach = Math.sqrt(
    Math.max(p.chainstayLength ** 2 - p.bbDrop ** 2, 100 ** 2)
  );
  const bb: Pt = [0, 0];
  const rearAxle: Pt = [-stayReach, p.bbDrop];
  const headTop: Pt = [p.reach, p.stack];
  const headBot: Pt = [
    headTop[0] + steer[0] * p.headTubeLength,
    headTop[1] + steer[1] * p.headTubeLength,
  ];
  const seatTop: Pt = [
    -Math.cos(sta) * p.seatTubeLength,
    Math.sin(sta) * p.seatTubeLength,
  ];
  const frontAxle: Pt = [
    headBot[0] + steer[0] * p.forkLength + Math.sin(hta) * p.forkOffset,
    headBot[1] + steer[1] * p.forkLength + Math.cos(hta) * p.forkOffset,
  ];
  // Top/down tubes attach inboard of the head tube ends so it pokes past both
  const topInset = Math.min(p.topTubeDia / 2 + 9, p.headTubeLength * 0.35);
  const botInset = Math.min(p.downTubeDia / 2 + 7, p.headTubeLength * 0.35);
  const topAttach: Pt = [
    headTop[0] + steer[0] * topInset,
    headTop[1] + steer[1] * topInset,
  ];
  const downAttach: Pt = [
    headBot[0] - steer[0] * botInset,
    headBot[1] - steer[1] * botInset,
  ];

  // Level the bike: rotate about the rear axle so both wheels sit on the ground.
  const tilt = Math.atan2(frontAxle[1] - rearAxle[1], frontAxle[0] - rearAxle[0]);
  const cosT = Math.cos(-tilt);
  const sinT = Math.sin(-tilt);
  const level = ([x, y]: Pt): Pt => [
    rearAxle[0] + (x - rearAxle[0]) * cosT - (y - rearAxle[1]) * sinT,
    rearAxle[1] + (x - rearAxle[0]) * sinT + (y - rearAxle[1]) * cosT,
  ];
  const lBb = level(bb);
  const lSeatTop = level(seatTop);
  const lHeadTop = level(headTop);
  const lHeadBot = level(headBot);
  const lFrontAxle = level(frontAxle);
  const lTopAttach = level(topAttach);
  const lDownAttach = level(downAttach);
  const axleY = rearAxle[1];

  // Fit to the viewbox, never larger than the stock drawings.
  const R = p.rimBsd / 2 + p.tireWidth;
  const minX = rearAxle[0] - R;
  const maxX = lFrontAxle[0] + R;
  const topY = Math.max(lSeatTop[1], lHeadTop[1]) + 60; // headroom for the steerer stub
  const botY = axleY - R - 25;
  const s = Math.min(
    BASE_SCALE,
    (VIEW_W - 70) / (maxX - minX),
    (VIEW_H - 40) / (topY - botY)
  );
  const k = s / BASE_SCALE;
  const tx = VIEW_W / 2 - (s * (minX + maxX)) / 2;
  const groundY = VIEW_H - 31;
  const px = (pt: Pt): Pt => [
    r1(pt[0] * s + tx),
    r1(groundY - (pt[1] - (axleY - R)) * s),
  ];

  const BB = px(lBb);
  const ST = px(lSeatTop);
  const HT = px(lHeadTop);
  const HB = px(lHeadBot);
  const TA = px(lTopAttach);
  const DA = px(lDownAttach);
  const RA = px(rearAxle);
  const FA = px(lFrontAxle);

  const norm = (a: Pt, b: Pt): Pt => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  };
  const seatUp = norm(BB, ST);
  const headUp = norm(HB, HT);
  // Rigid decorations are placed by offsets in original-art px, scaled by k.
  const at = (o: Pt, dx: number, dy: number): Pt => [
    r1(o[0] + dx * k),
    r1(o[1] + dy * k),
  ];
  const along = (o: Pt, dir: Pt, dist: number): Pt => [
    r1(o[0] + dir[0] * dist * k),
    r1(o[1] + dir[1] * dist * k),
  ];
  const lerp = (a: Pt, b: Pt, t: number): Pt => [
    r1(a[0] + (b[0] - a[0]) * t),
    r1(a[1] + (b[1] - a[1]) * t),
  ];
  const P = (pt: Pt) => `${pt[0]},${pt[1]}`;
  const line = (a: Pt, b: Pt) => `M${P(a)} L${P(b)}`;
  const ring = (c: Pt, r: number) =>
    `M${r1(c[0] - r)},${c[1]} a${r},${r} 0 1,0 ${r1(r * 2)},0 a${r},${r} 0 1,0 ${r1(-r * 2)},0`;

  const dia = (mm: number) => r1(mm * s);
  const w = (basePx: number) => r1(basePx * k);

  const forkD =
    shape === "road"
      ? `M${P(HB)} C${P(along(HB, [-headUp[0], -headUp[1]], 40))} ${P(
          lerp(HB, FA, 0.62)
        )} ${P(FA)}`
      : line(lerp(HB, FA, 0.36), FA);

  const tubes: Tube[] = [
    { id: "top", label: "Top tube", d: line(ST, TA), width: dia(p.topTubeDia) },
    { id: "down", label: "Down tube", d: line(DA, BB), width: dia(p.downTubeDia) },
    { id: "seat", label: "Seat tube", d: line(BB, ST), width: dia(p.seatTubeDia) },
    { id: "head", label: "Head tube", d: line(HT, HB), width: dia(p.headTubeDia) },
    {
      id: "seatstay",
      label: "Seat stays",
      d: line(along(ST, [-seatUp[0], -seatUp[1]], shape === "road" ? 16 : 15), RA),
      width: w(shape === "road" ? 7.5 : 9),
    },
    {
      id: "chainstay",
      label: "Chain stays",
      d: line(BB, RA),
      width: w(shape === "road" ? 8 : 10),
    },
    { id: "fork", label: "Fork", d: forkD, width: w(shape === "road" ? 10 : 16) },
  ];

  // Tire stroke is centered on the tire's cross-section centerline
  const tireR = r1((p.rimBsd / 2 + p.tireWidth / 2) * s);
  const tireW = r1(p.tireWidth * s);
  const rimR = r1((p.rimBsd / 2 - 6) * s);
  const wheels = [
    { cx: RA[0], cy: RA[1], r: tireR, tire: tireW, rimR },
    { cx: FA[0], cy: FA[1], r: tireR, tire: tireW, rimR },
  ];

  const accessories =
    shape === "road"
      ? [
          { d: line(BB, at(BB, -46, -18)), width: w(7) }, // far crank arm
          { d: line(BB, at(BB, 53, 20)), width: w(8) }, // drive crank arm
          { d: line(at(BB, 41, 23), at(BB, 69, 23)), width: w(6) }, // pedal
          { d: ring(BB, w(23)), width: w(4) }, // chainring
        ]
      : [
          { d: line(HB, lerp(HB, FA, 0.4)), width: w(12) }, // fork stanchion
          { d: line(BB, at(BB, -49, -20)), width: w(8) }, // far crank arm
          { d: line(BB, at(BB, 51, 22)), width: w(9) }, // drive crank arm
          { d: line(at(BB, 39, 25), at(BB, 67, 25)), width: w(7) }, // pedal
          { d: ring(BB, w(19)), width: w(4) }, // chainring
        ];

  return { tubes, wheels, accessories, k };
}
