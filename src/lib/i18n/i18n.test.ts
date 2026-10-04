import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { en } from "./en.ts";
import { HTML_LANG, LANGS, MESSAGES, detectLang, langFromSearch, type Lang } from "./index.ts";

type Leaf = { path: string; value: unknown };

function leaves(node: unknown, path = ""): Leaf[] {
  if (Array.isArray(node)) return node.flatMap((item, i) => leaves(item, `${path}[${i}]`));
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([key, value]) => leaves(value, path ? `${path}.${key}` : key));
  }
  return [{ path, value: node }];
}

/**
 * Argument sets for every message function, by parameter name. Several sets so that branches
 * (singular, "la 1:10" vs "las 7:30", after midnight) are all exercised.
 */
const SAMPLES: Record<string, unknown>[] = [
  { time: "7:30 AM", bus: "7:45 AM", minutes: 4, minutesAgo: 3, rideMin: 9, day: 3 },
  { time: "1:10 AM", bus: "1:25 AM", minutes: 1, minutesAgo: 1, rideMin: 7, day: 28 },
  { time: "12:15 AM", bus: "12:30 AM", minutes: 12, minutesAgo: 12, rideMin: 11, day: 14 },
  { time: "11:50 PM", bus: "3:00 AM", minutes: 2, minutesAgo: 2, rideMin: 8, day: 1 },
].map((set) => ({
  ...set,
  date: "4.28.26",
  phone: "407.313.6990",
  where: "120 ft from the lot pickup",
  distance: "120 ft",
  weekday: "Sat",
  month: "Oct",
  host: "next-bus-up.example.workers.dev",
  url: "https://next-bus-up.example.workers.dev/?dir=to",
}));

type Fn = (...args: unknown[]) => unknown;

function params(fn: Fn): string[] {
  const list = /^\(([^)]*)\)/.exec(fn.toString())?.[1] ?? "";
  return list.split(",").map((name) => name.trim()).filter(Boolean);
}

/** Rendered text of every message for one argument set, with the arguments each function got. */
function rendered(lang: Lang, set: Record<string, unknown>): Map<string, { text: string; args: Record<string, unknown> }> {
  const out = new Map<string, { text: string; args: Record<string, unknown> }>();
  for (const { path, value } of leaves(MESSAGES[lang])) {
    if (typeof value !== "function") {
      out.set(path, { text: String(value), args: {} });
      continue;
    }
    const names = params(value as Fn);
    const args = Object.fromEntries(
      names.map((name) => {
        assert.ok(name in set, `no sample value for parameter "${name}" (${path})`);
        return [name, set[name]];
      }),
    );
    out.set(path, { text: String((value as Fn)(...names.map((name) => set[name]))), args });
  }
  return out;
}

const englishShape = leaves(en).map((leaf) => `${leaf.path}:${typeof leaf.value}`);

/** Lines that may read the same as English in a given language: names, printed times. */
const SAME_AS_ENGLISH: Record<Lang, string[]> = {
  en: [],
  es: ["header.orlando", "hero.gapHours"],
  ht: ["header.orlando", "hero.gapHours", "contact.dispatch"],
  pt: ["header.orlando", "hero.gapHours"],
};

describe("every language", () => {
  for (const lang of LANGS) {
    describe(lang, () => {
      it("has exactly the English set of messages", () => {
        const shape = leaves(MESSAGES[lang]).map((leaf) => `${leaf.path}:${typeof leaf.value}`);
        assert.deepEqual(shape, englishShape);
      });

      it("has no empty text", () => {
        for (const set of SAMPLES) {
          for (const [path, { text }] of rendered(lang, set)) assert.ok(text.trim(), `${lang} ${path} is empty`);
        }
      });

      it("keeps every value it is given: times, numbers, places, the phone number", () => {
        for (const set of SAMPLES) {
          for (const [path, { text, args }] of rendered(lang, set)) {
            for (const [name, value] of Object.entries(args)) {
              // "Last one left 1 min ago" covers 0 and 1 the same way.
              const expected = name === "minutesAgo" && Number(value) <= 1 ? "1" : String(value);
              assert.ok(text.includes(expected), `${lang} ${path} drops ${name}=${expected}: "${text}"`);
            }
          }
        }
        assert.ok(MESSAGES[lang].hero.gapHours.includes("1:30") && MESSAGES[lang].hero.gapHours.includes("3:00"));
      });

      it("fits the tight spots in the layout", () => {
        const limits: Record<string, number> = {
          "directions.to-hotel.title": 11,
          "directions.from-hotel.title": 11,
          "directions.to-hotel.detail": 22,
          "directions.from-hotel.detail": 22,
          "directions.to-hotel.nextBus": 26,
          "directions.from-hotel.nextBus": 26,
          "header.date": 14,
          "hero.now": 7,
          "hero.map": 8,
          "list.now": 8,
          "list.next": 8,
          "list.left": 8,
          "placeButtons.followMe": 16,
          "placeButtons.tryAgain": 16,
          "placeButtons.useLocation": 16,
          "placeButtons.lock": 16,
          "tools.keepScreenOn": 18,
          "tools.screenStaysOn": 18,
          "tools.chime": 18,
          "tools.chimeOn": 18,
          "tools.rearm": 18,
          "poster.printAll": 18,
          "poster.printThis": 18,
          "poster.anywhereTitle": 11,
          "poster.anywhereDetail": 32,
          "poster.scan": 40,
        };
        const t = MESSAGES[lang];
        const longestDate = Math.max(
          ...t.header.weekdaysShort.flatMap((weekday) => t.header.monthsShort.map((month) => t.header.date(weekday, month, 28).length)),
        );
        assert.ok(longestDate <= limits["header.date"], `${lang} header.date can reach ${longestDate} characters`);
        const text = rendered(lang, SAMPLES[0]);
        for (const [path, max] of Object.entries(limits)) {
          if (path === "header.date") continue;
          const value = text.get(path)!.text;
          assert.ok(value.length <= max, `${lang} ${path} is ${value.length} characters (max ${max}): "${value}"`);
        }
      });

      it("has a full week and year", () => {
        assert.equal(MESSAGES[lang].header.weekdaysShort.length, 7);
        assert.equal(MESSAGES[lang].header.monthsShort.length, 12);
      });

      if (lang !== "en") {
        it("is actually translated, in every branch", () => {
          const allowed = new Set(SAME_AS_ENGLISH[lang]);
          for (const set of SAMPLES) {
            const english = rendered("en", set);
            for (const [path, { text }] of rendered(lang, set)) {
              if (allowed.has(path) || path.startsWith("header.monthsShort")) continue;
              assert.notEqual(text, english.get(path)!.text, `${lang} ${path} is still English: "${text}"`);
            }
          }
        });
      }
    });
  }
});

describe("picking a language", () => {
  it("follows the phone", () => {
    assert.equal(detectLang(["es-US", "en-US"]), "es");
    assert.equal(detectLang(["pt-BR"]), "pt");
    assert.equal(detectLang(["ht"]), "ht");
    assert.equal(detectLang(["fr-HT", "en"]), "ht");
    assert.equal(detectLang(["en-HT"]), "en");
    assert.equal(detectLang(["es-HT", "fr"]), "es");
    assert.equal(detectLang(["fr-FR", "en-US"]), "en");
    assert.equal(detectLang(["de-DE"]), "en");
    assert.equal(detectLang([]), "en");
  });

  it("reads a shared ?lang= link", () => {
    assert.equal(langFromSearch("?lang=es"), "es");
    assert.equal(langFromSearch("?lang=pt-BR"), "pt");
    assert.equal(langFromSearch("?lang=HT"), "ht");
    assert.equal(langFromSearch("?dir=to&lang=kreyol"), "ht");
    assert.equal(langFromSearch("?lang=fr"), null);
    assert.equal(langFromSearch(""), null);
  });

  it("tags the page for screen readers", () => {
    assert.deepEqual(HTML_LANG, { en: "en", es: "es", ht: "ht", pt: "pt-BR" });
  });
});
