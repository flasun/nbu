import { en, type Messages } from "./en.ts";
import { es } from "./es.ts";
import { ht } from "./ht.ts";
import { pt } from "./pt.ts";

export type { Messages };

/** Haitian Creole is "ht"; Portuguese is Brazilian. */
export type Lang = "en" | "es" | "ht" | "pt";

export const LANGS: readonly Lang[] = ["en", "es", "ht", "pt"];

/** Tag for <html lang>, so screen readers pick the right voice. */
export const HTML_LANG: Record<Lang, string> = { en: "en", es: "es", ht: "ht", pt: "pt-BR" };

export const MESSAGES: Record<Lang, Messages> = { en, es, ht, pt };

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

/**
 * First supported language in the phone's list. Phones rarely offer Kreyòl, so a Haiti region
 * tag (for example fr-HT) picks it too.
 */
export function detectLang(tags: readonly string[]): Lang {
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (lower.endsWith("-ht")) return "ht";
    const base = lower.split("-")[0];
    if (isLang(base)) return base;
  }
  return "en";
}

/** `?lang=es`, `?lang=ht`, `?lang=pt` or `?lang=en`, for links shared in group chats. */
export function langFromSearch(search: string): Lang | null {
  const value = new URLSearchParams(search).get("lang")?.trim().toLowerCase();
  if (!value) return null;
  if (value === "kreyol" || value === "kreyòl") return "ht";
  const base = value.split("-")[0];
  return isLang(base) ? base : null;
}
