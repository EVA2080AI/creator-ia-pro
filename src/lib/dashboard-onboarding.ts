const STORAGE_KEY = "dashboard_onboarded_v1";

export function hasSeenWelcomeOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markWelcomeOnboardingSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // localStorage puede estar bloqueado (modo privado) — no es crítico, solo
    // significa que el onboarding podría reaparecer.
  }
}
