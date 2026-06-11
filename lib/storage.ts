import { BikeShape, Design, FrameParams } from "./types";

const KEY = "bike-paint:designs";
const GEO_KEY = "bike-paint:geometry";

export interface StoredGeometry {
  shape: BikeShape;
  custom: FrameParams | null;
  label: string | null;
}

export function loadDesigns(): Design[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Design[]) : [];
  } catch {
    return [];
  }
}

export function persistDesigns(designs: Design[]) {
  window.localStorage.setItem(KEY, JSON.stringify(designs));
}

export function loadGeometry(): StoredGeometry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GEO_KEY);
    return raw ? (JSON.parse(raw) as StoredGeometry) : null;
  } catch {
    return null;
  }
}

export function persistGeometry(geo: StoredGeometry) {
  window.localStorage.setItem(GEO_KEY, JSON.stringify(geo));
}
