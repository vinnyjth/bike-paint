import { NextRequest } from "next/server";
import { BikeShape, FrameParams } from "@/lib/types";

const ALLOWED_HOSTS = new Set(["bikeinsights.com", "www.bikeinsights.com"]);

/* eslint-disable @typescript-eslint/no-explicit-any */
type StateMap = Record<string, any>;

const deref = (state: StateMap, v: any): any =>
  v && typeof v === "object" && "__ref" in v ? state[v.__ref] : v;

/** Read a measurement field, normalizing to mm via its sibling `<key>_unit` */
function mm(obj: any, key: string): number | undefined {
  const v = obj?.[key];
  if (typeof v !== "number") return undefined;
  const unit = obj[`${key}_unit`];
  if (unit === "cm") return v * 10;
  if (unit === "in") return v * 25.4;
  return v;
}

function firstMm(objs: any[], keys: string[]): number | undefined {
  for (const key of keys) {
    for (const obj of objs) {
      const v = mm(obj, key);
      if (v !== undefined) return v;
    }
  }
  return undefined;
}

function geometryParams(g: any): Partial<FrameParams> {
  // calculated.frame is Bike Insights' normalized view; raw frame is the fallback
  const frames = [g.calculated?.frame, g.frame].filter(Boolean);
  const forks = [g.calculated?.fork, g.fork].filter(Boolean);
  const builds = [g.base_build].filter(Boolean);
  const tireWidth = firstMm(builds, ["tire_width"]);
  const tireOd = firstMm(builds, ["tire_outer_diameter"]);
  const params: Partial<FrameParams> = {
    stack: firstMm(frames, ["stack"]),
    reach: firstMm(frames, ["reach"]),
    seatTubeLength: firstMm(frames, [
      "seat_tube_length_center_st_top",
      "seat_tube_length_unknown",
      "seat_tube_length_center_tt_top",
      "seat_tube_length_center_center",
      "effective_seat_tube_length_unknown",
    ]),
    headTubeLength: firstMm(frames, ["head_tube_length"]),
    seatTubeAngle: firstMm(frames, [
      "seat_tube_angle",
      "seat_tube_angle_unknown",
      "effective_seat_tube_angle_st_top",
      "effective_seat_tube_angle_unknown",
    ]),
    headTubeAngle: firstMm(frames, ["head_tube_angle"]),
    chainstayLength: firstMm(frames, ["chainstay_length"]),
    bbDrop: firstMm(frames, ["bottom_bracket_drop"]),
    forkLength: firstMm(forks, [
      "length",
      "length_unknown",
      "axle_to_crown_distance",
    ]),
    forkOffset: firstMm(forks, ["offset"]),
    rimBsd:
      firstMm(builds, ["wheel_bsd"]) ??
      (tireOd !== undefined && tireWidth !== undefined
        ? tireOd - 2 * tireWidth
        : undefined),
    tireWidth,
  };
  for (const key of Object.keys(params) as (keyof FrameParams)[]) {
    const v = params[key];
    if (v === undefined) delete params[key];
    else params[key] = Math.round(v * 10) / 10;
  }
  return params;
}

const fail = (status: number, error: string) =>
  Response.json({ error }, { status });

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return fail(400, "Missing url parameter");

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return fail(400, "That doesn't look like a valid URL");
  }
  if (
    !ALLOWED_HOSTS.has(target.hostname) ||
    !(
      target.pathname.startsWith("/bikes/") ||
      target.pathname.startsWith("/bike-geometries/")
    )
  ) {
    return fail(400, "Expected a bikeinsights.com bike or bike-geometry link");
  }

  let html: string;
  try {
    const res = await fetch(target, {
      headers: { "user-agent": "bike-paint-lab (geometry import)" },
    });
    if (!res.ok) return fail(502, `Bike Insights responded with ${res.status}`);
    html = await res.text();
  } catch {
    return fail(502, "Could not reach Bike Insights");
  }

  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!match) return fail(422, "No bike data found on that page");

  let state: StateMap;
  try {
    state = JSON.parse(match[1]).props.apolloState;
  } catch {
    return fail(422, "Could not parse the bike data on that page");
  }

  const root = state?.ROOT_QUERY ?? {};
  let build: any, version: any, bike: any, brand: any;
  let geometries: any[];

  // /bike-geometries/... pages query a single geometry (one specific size)
  const geoKey = Object.keys(root).find((k) => k.startsWith("bikeGeometry("));
  const profileKey = Object.keys(root).find((k) => k.startsWith("bikeProfile("));
  if (geoKey) {
    const g = deref(state, root[geoKey]);
    if (!g) return fail(422, "That page doesn't contain a bike geometry");
    build = deref(state, g.bike_build);
    version = deref(state, g.bike_version);
    bike = deref(state, g.bike);
    brand = deref(state, g.brand) ?? deref(state, bike?.brand);
    geometries = [g];
  } else if (profileKey) {
    const profile = root[profileKey];
    build = deref(state, profile.bike_build);
    version = deref(state, profile.bike_version);
    bike = state[`Bike:${profile.bike_id}`];
    brand = deref(state, bike?.brand);
    geometries = (profile.bike_geometries ?? [])
      .map((ref: any) => deref(state, ref))
      .filter(Boolean);
  } else {
    return fail(422, "That page doesn't contain a bike profile");
  }

  const sizes = geometries
    .map((g: any) => ({
      size: String(g.size ?? "One size"),
      params: geometryParams(g),
    }))
    .filter((s: { params: Partial<FrameParams> }) => Object.keys(s.params).length > 0);
  if (sizes.length === 0) {
    return fail(422, "No geometry numbers found for that bike");
  }

  const suspended =
    typeof build?.suspension_type === "string" &&
    !build.suspension_type.startsWith("rigid");
  const suggestedShape: BikeShape =
    (build?.bar_type && build.bar_type !== "drop") || suspended
      ? "mountain"
      : "road";

  return Response.json({
    name: [brand?.name, bike?.name].filter(Boolean).join(" ") || "Unknown bike",
    version: version?.name ?? null,
    build: build?.name ?? null,
    suggestedShape,
    sizes,
  });
}
