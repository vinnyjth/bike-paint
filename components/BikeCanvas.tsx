"use client";

import { useMemo, useRef, useState } from "react";
import { bikeGeometry, VIEW_W, VIEW_H } from "@/lib/bikes";
import { colorHex } from "@/lib/colors";
import { BikeShape, PatternType, Stroke } from "@/lib/types";

interface Props {
  shape: BikeShape;
  pattern: PatternType;
  palette: string[];
  splitAngle: number;
  splatterSize: number;
  splatterCount: number;
  splatterDensity: number;
  stripeWidth: number;
  stripeCount: number;
  dotSize: number;
  seed: number;
  locks: Record<string, string>;
  strokes: Stroke[];
  brushColor: string;
  brushSize: number;
  onStrokesChange: (strokes: Stroke[]) => void;
  onTubeClick?: (id: string) => void;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Splat {
  x: number;
  y: number;
  r: number;
}

function makeSplats(
  seed: number,
  count: number,
  size: number,
  density: number
): Splat[][] {
  const rng = mulberry32(seed);
  const groups: Splat[][] = [];
  const perColor = Math.round((density * 40) / (0.5 + size / 4));
  for (let k = 0; k < count; k++) {
    const splats: Splat[] = [];
    for (let i = 0; i < perColor; i++) {
      splats.push({
        x: 110 + rng() * 580,
        y: 120 + rng() * 310,
        r: size * (0.3 + Math.pow(rng(), 2) * 1.6),
      });
    }
    groups.push(splats);
  }
  return groups;
}

/** Midpoint between a path's first and last coordinate pair (for lock badges) */
function pathMid(d: string): [number, number] {
  const nums = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  return [
    (nums[0] + nums[nums.length - 2]) / 2,
    (nums[1] + nums[nums.length - 1]) / 2,
  ];
}

const FRAME_DARK = "#27272a";
const TIRE = "#1c1c1e";
const RIM = "#3f3f46";

export default function BikeCanvas({
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
  strokes,
  brushColor,
  brushSize,
  onStrokesChange,
  onTubeClick,
}: Props) {
  const geo = bikeGeometry(shape);
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawing, setDrawing] = useState(false);

  const hex = (i: number) => colorHex(palette[i] ?? palette[0] ?? "Shock Black");

  const splats = useMemo(
    () => makeSplats(seed, splatterCount, splatterSize, splatterDensity),
    [seed, splatterCount, splatterSize, splatterDensity]
  );

  // Gradient line through the bike's center, shared by split and fade
  const split = useMemo(() => {
    const rad = ((splitAngle - 90) * Math.PI) / 180;
    const cx = VIEW_W / 2;
    const cy = 280;
    const L = 330;
    return {
      x1: cx - Math.cos(rad) * L,
      y1: cy - Math.sin(rad) * L,
      x2: cx + Math.cos(rad) * L,
      y2: cy + Math.sin(rad) * L,
    };
  }, [splitAngle]);

  const toSvgPoint = (e: React.PointerEvent): [number, number] => {
    const rect = svgRef.current!.getBoundingClientRect();
    return [
      ((e.clientX - rect.left) / rect.width) * VIEW_W,
      ((e.clientY - rect.top) / rect.height) * VIEW_H,
    ];
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (pattern !== "freestyle") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrawing(true);
    onStrokesChange([
      ...strokes,
      { points: [toSvgPoint(e)], color: brushColor, size: brushSize },
    ]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawing || pattern !== "freestyle") return;
    const pt = toSvgPoint(e);
    const last = strokes[strokes.length - 1];
    if (!last) return;
    const prev = last.points[last.points.length - 1];
    if (Math.hypot(pt[0] - prev[0], pt[1] - prev[1]) < 2.5) return;
    onStrokesChange([
      ...strokes.slice(0, -1),
      { ...last, points: [...last.points, pt] },
    ]);
  };

  const tubeStroke = (i: number, id: string): string => {
    const lock = locks[id];
    if (lock) return colorHex(lock);
    switch (pattern) {
      case "two":
        return "url(#split-gradient)";
      case "fade":
        return "url(#fade-gradient)";
      case "stripes":
        return "url(#stripes-pattern)";
      case "tubes":
        return hex(i);
      default:
        return hex(0); // one color, or base coat for freestyle/splatter/dots
    }
  };

  const maskId = `frame-mask-${shape}`;
  const dotCell = dotSize * 2.8;
  const tubesClickable = pattern !== "freestyle" && !!onTubeClick;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={`w-full h-auto select-none ${
        pattern === "freestyle" ? "cursor-crosshair" : ""
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => setDrawing(false)}
      onPointerLeave={() => setDrawing(false)}
    >
      <defs>
        <linearGradient
          id="split-gradient"
          gradientUnits="userSpaceOnUse"
          x1={split.x1}
          y1={split.y1}
          x2={split.x2}
          y2={split.y2}
        >
          <stop offset="0.5" stopColor={hex(0)} />
          <stop offset="0.5" stopColor={hex(1)} />
        </linearGradient>
        <linearGradient
          id="fade-gradient"
          gradientUnits="userSpaceOnUse"
          x1={split.x1}
          y1={split.y1}
          x2={split.x2}
          y2={split.y2}
        >
          <stop offset="0.2" stopColor={hex(0)} />
          <stop offset="0.8" stopColor={hex(1)} />
        </linearGradient>
        <pattern
          id="stripes-pattern"
          patternUnits="userSpaceOnUse"
          width={stripeWidth * stripeCount}
          height={60}
          patternTransform={`rotate(${splitAngle})`}
        >
          {Array.from({ length: stripeCount }, (_, i) => (
            <rect
              key={i}
              x={i * stripeWidth}
              y={0}
              width={stripeWidth}
              height={60}
              fill={hex(i)}
            />
          ))}
        </pattern>
        <pattern
          id="dots-pattern"
          patternUnits="userSpaceOnUse"
          width={dotCell}
          height={dotCell}
        >
          <circle cx={dotCell * 0.25} cy={dotCell * 0.25} r={dotSize / 2} fill={hex(1)} />
          <circle cx={dotCell * 0.75} cy={dotCell * 0.75} r={dotSize / 2} fill={hex(1)} />
        </pattern>
        {/* Locked tubes are left out so overlays can't paint over them */}
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect width={VIEW_W} height={VIEW_H} fill="black" />
          {geo.tubes
            .filter((t) => !locks[t.id])
            .map((t) => (
              <path
                key={t.id}
                d={t.d}
                stroke="white"
                strokeWidth={t.width}
                strokeLinecap="round"
                fill="none"
              />
            ))}
        </mask>
      </defs>

      {/* Wheels */}
      {geo.wheels.map((w, i) => (
        <g key={i}>
          <circle cx={w.cx} cy={w.cy} r={w.r} fill="none" stroke={TIRE} strokeWidth={13} />
          <circle cx={w.cx} cy={w.cy} r={w.r - 11} fill="none" stroke={RIM} strokeWidth={5} />
          <circle cx={w.cx} cy={w.cy} r={7} fill={RIM} />
        </g>
      ))}

      {/* Accessories (not painted) */}
      {geo.accessories.map((a, i) => (
        <path
          key={i}
          d={a.d}
          stroke={FRAME_DARK}
          strokeWidth={a.width}
          strokeLinecap="round"
          fill="none"
        />
      ))}
      {geo.solids.map((d, i) => (
        <path key={i} d={d} fill={FRAME_DARK} />
      ))}

      {/* Frame tubes */}
      {geo.tubes.map((t, i) => (
        <path
          key={t.id}
          d={t.d}
          stroke={tubeStroke(i, t.id)}
          strokeWidth={t.width}
          strokeLinecap="round"
          fill="none"
          pointerEvents={tubesClickable ? "auto" : "none"}
          className={tubesClickable ? "cursor-pointer" : ""}
          onClick={tubesClickable ? () => onTubeClick?.(t.id) : undefined}
        >
          <title>{t.label}</title>
        </path>
      ))}

      {/* Splatter overlay, clipped to the frame */}
      {pattern === "splatter" && (
        <g mask={`url(#${maskId})`} pointerEvents="none">
          {splats.map((group, k) => (
            <g key={k} fill={hex(k + 1)}>
              {group.map((s, i) => (
                <circle key={i} cx={s.x} cy={s.y} r={s.r} />
              ))}
            </g>
          ))}
        </g>
      )}

      {/* Polka dot overlay, clipped to the frame */}
      {pattern === "dots" && (
        <g mask={`url(#${maskId})`} pointerEvents="none">
          <rect width={VIEW_W} height={VIEW_H} fill="url(#dots-pattern)" />
        </g>
      )}

      {/* Freestyle strokes, clipped to the frame */}
      {pattern === "freestyle" && (
        <g mask={`url(#${maskId})`} pointerEvents="none">
          {strokes.map((s, i) => (
            <path
              key={i}
              d={
                s.points.length === 1
                  ? `M${s.points[0][0]},${s.points[0][1]} l0.1,0`
                  : `M${s.points.map((p) => `${p[0]},${p[1]}`).join(" L")}`
              }
              stroke={colorHex(s.color)}
              strokeWidth={s.size}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </g>
      )}

      {/* Lock badges */}
      {geo.tubes
        .filter((t) => locks[t.id])
        .map((t) => {
          const [mx, my] = pathMid(t.d);
          return (
            <g key={t.id} transform={`translate(${mx},${my})`} pointerEvents="none">
              <circle r={11} fill="rgba(24,24,27,0.78)" />
              <rect x={-4.5} y={-1.5} width={9} height={7} rx={1.5} fill="white" />
              <path
                d="M-3,-1.5 v-2.5 a3,3 0 0 1 6,0 v2.5"
                stroke="white"
                strokeWidth={1.8}
                fill="none"
              />
            </g>
          );
        })}
    </svg>
  );
}
