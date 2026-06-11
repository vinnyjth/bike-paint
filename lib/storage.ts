import { Design } from "./types";

const KEY = "bike-paint:designs";

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
