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

/** Sample arguments for every message function, by parameter name. */
const SAMPLE: Record<string, unknown> = {
  time: "7:30 AM",
  bus: "7:45 AM",
  minutes: 4,
  minutesAgo: 3,
  rideMin: 7,
  date: "4.28.26",
  phone: "407.313.6990",
  where: "120 ft from the lot pickup",
  distance: "120 ft",
  weekday: "Sat",
  month: "Oct",
  day: 3,
};

function call(fn: (...args: never[]) => unknown): string {
  const names = /^\(([^)]*)\)/.exec(fn.toString())?.[1].split(",").map((name) => name.trim()) ?? [];
  const args = names.map((name) => {
    assert.ok(name in SAMPLE, `no sample value for parameter "${name}"`);
    return SAMPLE[name];
  });
  return String((fn as (...args: unknown[]) => unknown)(...args));
}

/** Rendered text of every message, with functions called on sample values. */
function rendered(lang: Lang): Map<string, string> {
  const out = new Map<string, string>();
  for (const { path, value } of leaves(MESSAGES[lang])) {
    out.set(path, typeof value === "function" ? call(value as (...args: never[]) => unknown) : String(value));
  }
  return out;
}

const englishShape = leaves(en).map((leaf) => `${leaf.path}:${typeof leaf.value}`);

describe("every language", () => {
  for (const lang of LANGS) {
    describe(lang, () => {
      const text = rendered(lang);

      it("has exactly the English set of messages", () => {
        const shape = leaves(MESSAGES[lang]).map((leaf) => `${leaf.path}:${typeof leaf.value}`);
        assert.deepEqual(shape, englishShape);
      });

      it("has no empty text", () => {
        for (const [path, value] of text) assert.ok(value.trim().length > 0, `${lang} ${path} is empty`);
      });

      it("keeps times, numbers and the phone number exactly as given", () => {
        for (const [path, value] of text) {
          if (path.endsWith("callout.call")) assert.ok(value.includes("407.313.6990"), `${lang} ${path}`);
          if (path.endsWith("sheetDate")) assert.ok(value.includes("4.28.26"), `${lang} ${path}`);
        }
        const withTime = leaves(MESSAGES[lang])
          .filter((leaf) => typeof leaf.value === "function" && /\btime\b/.test(String(leaf.value).split("=>")[0]))
          .map((leaf) => leaf.path);
        for (const path of withTime) assert.ok(text.get(path)!.includes("7:30 AM"), `${lang} ${path} drops the time`);
        assert.ok(text.get("hero.gapHours")!.includes("1:30") && text.get("hero.gapHours")!.includes("3:00"));
        assert.ok(text.get("hero.rideNote")!.includes("4"), `${lang} hero.rideNote drops the minutes`);
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
        };
        for (const [path, max] of Object.entries(limits)) {
          const value = text.get(path)!;
          assert.ok(value.length <= max, `${lang} ${path} is ${value.length} characters (max ${max}): "${value}"`);
        }
      });

      it("has a full week and year", () => {
        assert.equal(MESSAGES[lang].header.weekdaysShort.length, 7);
        assert.equal(MESSAGES[lang].header.monthsShort.length, 12);
      });

      if (lang !== "en") {
        it("is actually translated", () => {
          const english = rendered("en");
          // Names, times and numbers may stay the same; almost nothing else should.
          const same = [...text].filter(([path, value]) => value === english.get(path)).map(([path]) => path);
          const allowed = new Set(["hero.gapHours", "header.monthsShort[]"]);
          const unexpected = same.filter((path) => !allowed.has(path.replace(/\[\d+\]/, "[]")));
          assert.ok(unexpected.length <= 3, `${lang} still matches English at: ${unexpected.join(", ")}`);
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
