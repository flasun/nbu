import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { BusFront, Clock, Hotel, Phone, Printer, TriangleAlert } from "lucide-react";
import QRCode from "qrcode";
import { HTML_LANG, LANGS, MESSAGES, type Lang } from "@/lib/i18n";
import {
  POSTER_KINDS,
  QUIET_ZONE,
  isTemporaryHost,
  posterUrl,
  printedUrl,
  qrPath,
  type PosterKind,
} from "@/lib/poster";
import { DISPATCH_DISPLAY } from "@/lib/shuttle/schedule";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

const ICONS = { "to-hotel": Hotel, "from-hotel": BusFront, anywhere: Clock } as const;

/**
 * Printable posters for the stops. The codes open the address this page is on, so open it on
 * the final address before printing. The page around the posters is in the reader's language;
 * the posters themselves are in all four.
 */
export function QrPosters({ lang }: { lang: Lang }) {
  const t = MESSAGES[lang].poster;
  const { origin, host, hostname } = window.location;
  /** Print just this poster, or all of them. */
  const [only, setOnly] = useState<PosterKind | null>(null);
  const printed = only ? [only] : POSTER_KINDS;

  useEffect(() => {
    const reset = () => setOnly(null);
    window.addEventListener("afterprint", reset);
    return () => window.removeEventListener("afterprint", reset);
  }, []);

  const print = (kind: PosterKind | null) => {
    // The page has to show the right posters before the print dialog lays it out.
    flushSync(() => setOnly(kind));
    window.print();
  };

  return (
    <main className="pb-12 print:pb-0">
      <header className="mx-auto w-full max-w-3xl px-4 pt-5 pb-6 md:px-8 md:pt-8 print:hidden">
        <p className="font-display text-[1.85rem] leading-none font-semibold tracking-wide text-ivory">Next Bus Up</p>
        <h1 className="mt-4 font-display text-3xl leading-none font-semibold tracking-wide text-signal">{t.title}</h1>
        <p className="mt-2 text-sm text-mute">{t.intro}</p>
        {isTemporaryHost(hostname) ? (
          <p
            className="mt-3 flex items-start gap-2 rounded-xl border border-alert/60 bg-alert/10 p-3 text-sm text-ivory"
            data-testid="temporary"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-alert" aria-hidden="true" />
            {t.temporary(host)}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => print(null)}
            data-testid="print-all"
            className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-signal px-4 text-sm font-semibold text-signal-ink ${focusRing}`}
          >
            <Printer className="size-4" aria-hidden="true" />
            {t.printAll}
          </button>
          <span className="text-sm text-mute">{t.paper}</span>
        </div>
      </header>

      <div className="poster-list">
        {POSTER_KINDS.map((kind) => {
          const url = posterUrl(origin, kind);
          const skipped = !printed.includes(kind);
          const breaks = printed.indexOf(kind) > 0;
          return (
            <figure
              key={kind}
              data-testid={`poster-${kind}`}
              className={`poster-figure${skipped ? " poster-skip" : ""}${breaks ? " poster-break" : ""}`}
            >
              <Poster kind={kind} url={url} label={t.codeLabel(url)} />
              <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-mute print:hidden">
                <span>{t.putUp[kind]}</span>
                <button
                  type="button"
                  onClick={() => print(kind)}
                  data-testid={`print-${kind}`}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-3 text-sm text-ivory ${focusRing}`}
                >
                  <Printer className="size-4" aria-hidden="true" />
                  {t.printThis}
                </button>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </main>
  );
}

/** One printed page: the column's color, its name in four languages, the code, and dispatch. */
function Poster({ kind, url, label }: { kind: PosterKind; url: string; label: string }) {
  const Icon = ICONS[kind];
  const dispatch = [...new Map(LANGS.map((lang) => [MESSAGES[lang].contact.dispatch, lang])).entries()];
  return (
    <div className="poster-sheet" data-kind={kind}>
      <div className="poster-inner">
        <div className="poster-band">
          <span className="poster-brand">Next Bus Up</span>
          <Icon className="poster-icon" aria-hidden="true" />
        </div>

        <div className="poster-titles">
          {LANGS.map((lang) => {
            const m = MESSAGES[lang];
            const title = kind === "anywhere" ? m.poster.anywhereTitle : m.directions[kind].title;
            const detail = kind === "anywhere" ? m.poster.anywhereDetail : m.directions[kind].leaves;
            return (
              <div key={lang} lang={HTML_LANG[lang]}>
                <p className="poster-title">{title}</p>
                <p className="poster-detail">{detail}</p>
              </div>
            );
          })}
        </div>

        <div className="poster-code">
          <QrCode text={url} label={label} />
        </div>

        <div className="poster-scan">
          {LANGS.map((lang) => (
            <p key={lang} lang={HTML_LANG[lang]}>
              {MESSAGES[lang].poster.scan}
            </p>
          ))}
        </div>

        <div className="poster-foot">
          <p className="poster-url" data-testid="poster-url">
            {printedUrl(url)}
          </p>
          <p className="poster-phone">
            <Phone className="poster-phone-icon" aria-hidden="true" />
            {dispatch.map(([word, lang], i) => (
              <span key={lang} lang={HTML_LANG[lang]}>
                {i > 0 ? " · " : ""}
                {word}
              </span>
            ))}{" "}
            <span className="poster-number">{DISPATCH_DISPLAY}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/** Black-on-white vector code that prints sharp at any size. Level Q survives scuffs and glare. */
function QrCode({ text, label }: { text: string; label: string }) {
  const { size, path } = useMemo(() => {
    const { modules } = QRCode.create(text, { errorCorrectionLevel: "Q" });
    return {
      size: modules.size + 2 * QUIET_ZONE,
      path: qrPath(modules.size, (row, col) => modules.get(row, col) === 1),
    };
  }, [text]);
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className="poster-qr"
      data-testid="qr"
    >
      <rect width={size} height={size} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
}
