import { isLang, type Lang } from "@/lib/i18n";
import type { Mode } from "@/lib/shuttle/logic";

export const PREFS_KEY = "bus-up-v1";

export type Prefs = {
  mode: Mode;
  walkMin: number;
  chime: boolean;
  awake: boolean;
  locate: boolean;
  /** Null until the rider picks one; the phone's language is used meanwhile. */
  lang: Lang | null;
};

export const DEFAULT_PREFS: Prefs = {
  mode: "auto",
  walkMin: 3,
  chime: false,
  awake: false,
  locate: false,
  lang: null,
};

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    const mode: Mode =
      parsed.mode === "to-hotel" || parsed.mode === "from-hotel" || parsed.mode === "auto"
        ? parsed.mode
        : "auto";
    const walkMin = Number(parsed.walkMin);
    return {
      mode,
      walkMin: Number.isFinite(walkMin) ? Math.min(15, Math.max(0, Math.round(walkMin))) : 3,
      chime: Boolean(parsed.chime),
      awake: Boolean(parsed.awake),
      locate: Boolean(parsed.locate),
      lang: isLang(parsed.lang) ? parsed.lang : null,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Private mode or full storage: settings just won't stick.
  }
}
