const STORAGE_KEY = "basalt_guide_seen_v1";

export function hasSeenBasaltGuide(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markBasaltGuideSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // localStorage puede estar bloqueado (modo privado) — no es crítico, solo
    // significa que la guía podría reaparecer.
  }
}
