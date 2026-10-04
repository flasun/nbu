import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  Bell,
  BellOff,
  BusFront,
  Clock,
  Hotel,
  Lock,
  MapPin,
  Minus,
  Navigation,
  Phone,
  Plus,
  Unlock,
} from "lucide-react";
import {
  DEPARTURES,
  CONTACT_FORM,
  DISPATCH_DISPLAY,
  DISPATCH_PHONE,
  FEEDBACK_FORM,
  HOTEL,
  LOT,
  RIDE_MIN,
  type Direction,
} from "@/lib/shuttle/schedule";
import {
  boardAt,
  directionFromSearch,
  directionsUrl,
  formatClock,
  formatCountdown,
  formatDistance,
  formatSheetDate,
  geoFailure,
  haversineMeters,
  isAtStop,
  isDeparturePast,
  listLabel,
  readOrlando,
  resolveDirection,
  rideDeparture,
  serviceRank,
  stopDistance,
  zoneFor,
  atOrlandoTime,
  type BoardSnapshot,
  type DayPart,
  type MapApp,
  type Mode,
  type OrlandoNow,
  type PlaceState,
  type Zone,
} from "@/lib/shuttle/logic";
import {
  HTML_LANG,
  LANGS,
  MESSAGES,
  detectLang,
  langFromSearch,
  phoneLanguages,
  type Lang,
  type Messages,
} from "@/lib/i18n";
import { loadPrefs, savePrefs, type Prefs } from "@/lib/prefs";

type Fix = {
  /** When the phone took the reading, epoch ms. */
  at: number;
  zone: Zone;
  hotelM: number;
  lotM: number;
  accuracyM: number;
};

/** A reading younger than this counts as where you are now. */
const FIX_FRESH_MS = 3 * 60_000;
/** While re-reads fail, the last place still picks the column for this long, labelled with its age. */
const FIX_KEEP_MS = 30 * 60_000;
/** Re-read location this often while the page is on screen. */
const RELOCATE_MS = 60_000;
/** A QR column lasts for the visit: until the page has been away this long. */
const VISIT_GAP_MS = 30 * 60_000;
const ZONES: readonly PlaceState[] = ["at-hotel", "at-lot", "away", "fuzzy", "far"];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

type Note = "noWakeLock" | "noChime";

/** Saved settings, with a `?lang=` link taking over the language (and sticking). */
function initialPrefs(): Prefs {
  const prefs = loadPrefs();
  const fromLink = langFromSearch(window.location.search);
  return fromLink ? { ...prefs, lang: fromLink } : prefs;
}

function isAppleDevice(): boolean {
  const ua = navigator.userAgent;
  return /iP(hone|ad|od)/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function useOrlandoNow(): OrlandoNow | null {
  const [now, setNow] = useState<OrlandoNow | null>(() => readOrlando(new Date()));
  useEffect(() => {
    const tick = () => setNow(readOrlando(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return now;
}

function beep(ctx: AudioContext) {
  const start = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.05, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
  gain.connect(ctx.destination);
  for (const [freq, at] of [
    [740, 0],
    [980, 0.12],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(start + at);
    osc.stop(start + at + 0.12);
  }
}

function walkLine(board: BoardSnapshot, atStop: boolean, t: Messages): { late: boolean; text: string } {
  const w = t.walk;
  if (board.inGap) return { late: false, text: w.inGap };
  if (board.next.boarding) return { late: false, text: w.boarding };
  if (atStop) return { late: false, text: w.atStop };
  if (board.next.waitSec > 30 * 60) return { late: false, text: w.plenty };
  if (board.walkMin === 0) return { late: false, text: w.zero };
  if (board.leaveInSec < 0) {
    const catchMin = board.catchMinutes;
    const catchable = catchMin != null && catchMin !== board.next.minutes;
    return { late: true, text: catchable ? w.tooLateCatch(formatClock(catchMin)) : w.tooLate };
  }
  if (board.leaveInSec < 60) {
    const after = board.following[0];
    return { late: true, text: after ? w.leaveNowNext(formatClock(after.minutes)) : w.leaveNow };
  }
  return { late: false, text: w.headOut(formatClock(board.next.minutes - board.walkMin), board.walkMin) };
}

export function ShuttleBoard() {
  const live = useOrlandoNow();
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs);
  const [place, setPlace] = useState<PlaceState>("idle");
  const [fix, setFix] = useState<Fix | null>(null);
  const [plan, setPlan] = useState<string>("");
  const [wakeNote, setWakeNote] = useState<Note | null>(null);
  const [chimeArmed, setChimeArmed] = useState(false);
  const [locateNonce, setLocateNonce] = useState(0);
  const [mapApp] = useState<MapApp>(() => (isAppleDevice() ? "apple" : "google"));
  const [timesOpen, setTimesOpen] = useState(
    () => window.matchMedia?.("(min-width: 1024px)")?.matches === true,
  );
  /** Column from a stop's QR code or a shortcut. Lasts for this visit and is never saved. */
  const [linked, setLinked] = useState<Direction | null>(() =>
    directionFromSearch(window.location.search),
  );
  const nextRow = useRef<HTMLLIElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const prevWait = useRef<number | null>(null);
  const chimeDirection = useRef<Direction | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const locateGen = useRef(0);
  const fixRef = useRef<Fix | null>(null);
  const hiddenAt = useRef<number | null>(null);

  const lang: Lang = prefs.lang ?? detectLang(phoneLanguages());
  const t = MESSAGES[lang];

  useEffect(() => {
    // ?dir= shows that column for this visit only, so a scan never turns off Follow me for good.
    // ?lang= is already saved. Drop both so they don't stick to a home-screen icon.
    const url = new URL(window.location.href);
    if (!url.searchParams.has("dir") && !url.searchParams.has("lang")) return;
    url.searchParams.delete("dir");
    url.searchParams.delete("lang");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
        return;
      }
      // Back after a long time away: that was another visit, so drop a QR column.
      if (hiddenAt.current !== null && Date.now() - hiddenAt.current > VISIT_GAP_MS) setLinked(null);
      hiddenAt.current = null;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!prefs.locate) {
      locateGen.current += 1;
      fixRef.current = null;
      setPlace("idle");
      setFix(null);
      return;
    }
    // Keep reading while a column is locked too: the walk skip and the wrong-column
    // warning need a current fix. A locked column never changes because of it.
    if (!("geolocation" in navigator)) {
      setPlace("unsupported");
      return;
    }
    // After a "no", stop asking until the rider taps Try again or Follow me.
    let paused = false;
    const keep = (next: Fix | null) => {
      fixRef.current = next;
      setFix(next);
    };
    const ask = () => {
      const gen = ++locateGen.current;
      setPlace((prev) => (prev === "idle" ? "pending" : prev));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (gen !== locateGen.current) return;
          const hotelM = haversineMeters(pos.coords.latitude, pos.coords.longitude, HOTEL.lat, HOTEL.lon);
          const lotM = haversineMeters(pos.coords.latitude, pos.coords.longitude, LOT.lat, LOT.lon);
          const accuracyM = pos.coords.accuracy;
          const zone = zoneFor(hotelM, lotM, accuracyM);
          const prev = fixRef.current;
          // One rough background reading doesn't undo a recent clear one.
          if (zone === "fuzzy" && prev && prev.zone !== "fuzzy" && pos.timestamp - prev.at <= FIX_FRESH_MS) return;
          keep({ at: pos.timestamp, zone, hotelM, lotM, accuracyM });
          setPlace(zone);
        },
        (err) => {
          if (gen !== locateGen.current) return;
          const failure = geoFailure(err.code);
          const prev = fixRef.current;
          if (failure === "denied") paused = true;
          if (failure !== "denied" && prev && Date.now() - prev.at <= FIX_KEEP_MS) return;
          keep(null);
          setPlace(failure);
        },
        { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 },
      );
    };
    ask();
    const onVis = () => {
      if (document.visibilityState === "visible" && !paused) ask();
    };
    document.addEventListener("visibilitychange", onVis);
    const again = window.setInterval(onVis, RELOCATE_MS);
    return () => {
      locateGen.current += 1;
      window.clearInterval(again);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [prefs.locate, locateNonce]);

  useEffect(() => {
    if (!prefs.awake || !("wakeLock" in navigator)) {
      void wakeLock.current?.release();
      wakeLock.current = null;
      return;
    }
    let cancelled = false;
    const acquire = async () => {
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        // Turned off (or unmounted) while the request was pending: let it go at once.
        if (cancelled) {
          void sentinel.release();
          return;
        }
        void wakeLock.current?.release();
        wakeLock.current = sentinel;
        setWakeNote(null);
      } catch {
        if (!cancelled) setWakeNote("noWakeLock");
      }
    };
    void acquire();
    const onVis = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void wakeLock.current?.release();
      wakeLock.current = null;
    };
  }, [prefs.awake]);

  const mode: Mode = linked ?? prefs.mode;
  const direction = resolveDirection(mode, place);
  const fixAgeMs = fix && live ? Math.max(0, live.epochMs - fix.at) : null;
  const fresh = fixAgeMs !== null && fixAgeMs <= FIX_FRESH_MS;
  /** Minutes since the last reading, once it is too old to count as now. */
  const staleMin = fix && !fresh && fixAgeMs !== null ? Math.max(1, Math.round(fixAgeMs / 60_000)) : null;
  const atStop =
    !plan &&
    direction !== null &&
    fix !== null &&
    fresh &&
    isAtStop(stopDistance(direction, fix.hotelM, fix.lotM), fix.accuracyM);
  const walkMin = atStop ? 0 : prefs.walkMin;
  const planMin = /^(\d{2}):(\d{2})$/.exec(plan);
  const viewSec = planMin
    ? Number(planMin[1]) * 3600 + Number(planMin[2]) * 60
    : (live?.seconds ?? null);
  const viewMs =
    live == null
      ? undefined
      : planMin
        ? atOrlandoTime(live.epochMs, Number(planMin[1]), Number(planMin[2]))
        : live.epochMs;
  const board =
    direction !== null && viewSec !== null ? boardAt(direction, viewSec, walkMin, viewMs) : null;

  useEffect(() => {
    if (!board || plan || !prefs.chime || !chimeArmed || !audioRef.current) {
      prevWait.current = null;
      return;
    }
    if (chimeDirection.current !== direction) {
      chimeDirection.current = direction;
      prevWait.current = board.next.waitSec;
      return;
    }
    const wait = board.next.waitSec;
    const prev = prevWait.current;
    prevWait.current = wait;
    if (prev == null || board.next.boarding) return;
    const crossed = [300, 120, 30].filter((mark) => prev > mark && wait <= mark);
    if (crossed.length) beep(audioRef.current);
  }, [board, plan, prefs.chime, chimeArmed, direction]);

  useEffect(() => {
    const row = nextRow.current;
    const list = listRef.current;
    if (!row || !list) return;
    const top = row.offsetTop - list.clientHeight / 2 + row.clientHeight / 2;
    list.scrollTo({ top: Math.max(0, top) });
  }, [direction, board?.next.minutes, board?.next.boarding, plan]);

  const summary = summaryText(direction, board, t);
  const copy = direction ? t.directions[direction] : null;
  const mismatch =
    mode !== "auto" &&
    fresh &&
    ((place === "at-hotel" && direction === "to-hotel") ||
      (place === "at-lot" && direction === "from-hotel") ||
      (place === "away" && direction === "from-hotel") ||
      (place === "far" && direction === "from-hotel"));

  function choose(next: Direction) {
    setLinked(null);
    setPrefs((prev) => ({ ...prev, mode: next }));
  }

  function followMe() {
    setLinked(null);
    setPrefs((prev) => ({ ...prev, mode: "auto", locate: true }));
    setLocateNonce((n) => n + 1);
  }

  function useMyLocation() {
    setPlace((prev) => (ZONES.includes(prev) ? prev : "pending"));
    setPrefs((prev) => ({ ...prev, locate: true }));
    setLocateNonce((n) => n + 1);
  }

  function stopLocation() {
    setPrefs((prev) => ({ ...prev, locate: false }));
  }

  function ensureAudio(): AudioContext | null {
    const w = window as Window & { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    try {
      if (!audioRef.current) audioRef.current = new Ctor();
      return audioRef.current;
    } catch {
      return null;
    }
  }

  function armChime() {
    if (prefs.chime && chimeArmed) {
      setChimeArmed(false);
      chimeDirection.current = null;
      prevWait.current = null;
      setPrefs((prev) => ({ ...prev, chime: false }));
      return;
    }
    const ctx = ensureAudio();
    if (!ctx) {
      setWakeNote("noChime");
      return;
    }
    void ctx.resume().catch(() => {});
    chimeDirection.current = direction;
    prevWait.current = board?.next.waitSec ?? null;
    setChimeArmed(true);
    setPrefs((prev) => ({ ...prev, chime: true }));
  }

  function moveDirection(key: string) {
    const order: Direction[] = ["to-hotel", "from-hotel"];
    let next: Direction;
    if (key === "Home" || (!direction && (key === "ArrowRight" || key === "ArrowDown"))) next = "to-hotel";
    else if (key === "End" || (!direction && (key === "ArrowLeft" || key === "ArrowUp"))) next = "from-hotel";
    else if (!direction) return;
    else {
      const forward = key === "ArrowRight" || key === "ArrowDown";
      const index = order.indexOf(direction);
      next = order[(index + (forward ? 1 : -1) + order.length) % order.length];
    }
    choose(next);
    const id = next === "to-hotel" ? "direction-to" : "direction-from";
    requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)?.focus();
    });
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 pt-5 pb-12 md:px-8 md:pt-8">
      <p className="sr-only" aria-live="polite">
        {summary}
      </p>

      <header className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[1.85rem] leading-none font-semibold tracking-wide text-ivory sm:text-4xl">
            Next Bus Up
          </h1>
          <p className="mt-1 text-sm text-mute">{t.header.tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className="font-display text-2xl leading-none font-semibold tracking-wide text-ivory tabular-nums sm:text-3xl"
            data-testid="clock"
          >
            {live ? live.clock : "––:––:––"}
          </p>
          <p className="mt-1 flex items-center justify-end gap-1.5 text-xs text-mute">
            <span className="live-dot inline-block size-1.5 rounded-full bg-signal" aria-hidden="true" />
            {live
              ? t.header.date(t.header.weekdaysShort[live.weekday], t.header.monthsShort[live.month - 1], live.day)
              : t.header.orlando}{" "}
            · {t.header.orlandoTime}
          </p>
        </div>
      </header>

      <LanguagePicker
        lang={lang}
        label={t.languagePicker}
        onChange={(next) => setPrefs((prev) => ({ ...prev, lang: next }))}
      />

      <div className="grid items-start gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div
            role="radiogroup"
            aria-label={t.switcher.label}
            className="grid grid-cols-2 gap-1 rounded-card bg-panel-2 p-1"
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              moveDirection(event.key);
            }}
          >
            <DirectionButton
              active={direction === "to-hotel"}
              tabIndex={direction === "from-hotel" ? -1 : 0}
              tone="lot"
              onClick={() => choose("to-hotel")}
              title={t.directions["to-hotel"].title}
              detail={t.directions["to-hotel"].detail}
              icon={<Hotel className="size-5" aria-hidden="true" />}
              testId="direction-to"
            />
            <DirectionButton
              active={direction === "from-hotel"}
              tabIndex={direction === "from-hotel" ? 0 : -1}
              tone="gate"
              onClick={() => choose("from-hotel")}
              title={t.directions["from-hotel"].title}
              detail={t.directions["from-hotel"].detail}
              icon={<BusFront className="size-5" aria-hidden="true" />}
              testId="direction-from"
            />
          </div>
          <p className="mt-2 px-1 text-sm text-mute">
            {copy ? copy.column : t.switcher.hint}
          </p>

          {mismatch ? (
            <p className="mt-2 px-1 text-sm text-alert">
              {place === "at-hotel"
                ? t.mismatch.atHotel
                : place === "at-lot"
                  ? t.mismatch.atLot
                  : t.mismatch.notAtHotel}
            </p>
          ) : null}

          <section className="mt-3 rounded-card border border-line bg-panel px-5 py-5" aria-live="off">
            {plan ? (
              <p className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-panel-2 px-3 py-2 text-sm text-ivory">
                <span>{t.plan.checking(formatPlan(plan))}</span>
                <button
                  type="button"
                  onClick={() => setPlan("")}
                  className={`min-h-11 rounded-full px-3 font-medium text-signal ${focusRing}`}
                >
                  {t.plan.back}
                </button>
              </p>
            ) : null}

            {!board || !copy || !direction ? (
              <div>
                <p className="font-display text-3xl leading-none font-semibold tracking-wide text-ivory">
                  {t.pickSide.title}
                </p>
                <p className="mt-3 max-w-sm text-pretty text-mute">{t.pickSide.body}</p>
              </div>
            ) : (
              <Hero
                board={board}
                copy={copy}
                t={t}
                atStop={atStop}
                mapHref={directionsUrl(direction, mapApp)}
              />
            )}

            {board ? (
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                <p className="text-sm text-mute">
                  {t.walk.label}
                  {atStop ? <span className="block text-xs">{t.walk.skipped}</span> : null}
                </p>
                <div className="flex items-center gap-2">
                  <StepButton
                    label={t.walk.fewer}
                    onClick={() =>
                      setPrefs((prev) => ({ ...prev, walkMin: Math.max(0, prev.walkMin - 1) }))
                    }
                  >
                    <Minus className="size-4" aria-hidden="true" />
                  </StepButton>
                  <span className="w-8 text-center font-display text-2xl leading-none font-semibold tabular-nums">
                    {prefs.walkMin}
                  </span>
                  <StepButton
                    label={t.walk.more}
                    onClick={() =>
                      setPrefs((prev) => ({ ...prev, walkMin: Math.min(15, prev.walkMin + 1) }))
                    }
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </StepButton>
                </div>
              </div>
            ) : null}
          </section>
          <p className="mt-2 px-1 text-xs text-mute" data-testid="sheet-date">
            {t.sheetDate(formatSheetDate())}
          </p>

          <div className="mt-4 flex items-start justify-between gap-3 rounded-card border border-line bg-panel px-4 py-3">
            <div className="flex min-w-0 gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-signal" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-medium text-ivory">{t.place[place]}</p>
                <p className="text-sm text-mute">
                  {placeDetail(place, mode, fix, linked !== null, staleMin, t)}
                </p>
                {prefs.locate ? (
                  <button
                    type="button"
                    onClick={stopLocation}
                    className={`mt-1 min-h-11 text-sm text-mute underline underline-offset-4 ${focusRing}`}
                  >
                    {t.placeButtons.stopLocation}
                  </button>
                ) : null}
              </div>
            </div>
            {mode !== "auto" ? (
              <button
                type="button"
                onClick={followMe}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-signal px-3 text-sm font-semibold text-signal-ink ${focusRing}`}
              >
                <Unlock className="size-4" aria-hidden="true" />
                {t.placeButtons.followMe}
              </button>
            ) : !prefs.locate ||
              place === "timeout" ||
              place === "denied" ||
              place === "unavailable" ||
              staleMin !== null ? (
              <button
                type="button"
                onClick={useMyLocation}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-sm text-ivory ${focusRing}`}
              >
                <MapPin className="size-4" aria-hidden="true" />
                {prefs.locate ? t.placeButtons.tryAgain : t.placeButtons.useLocation}
              </button>
            ) : (
              <button
                type="button"
                disabled={!direction}
                onClick={() => direction && choose(direction)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-sm text-ivory disabled:opacity-40 ${focusRing}`}
              >
                <Lock className="size-4" aria-hidden="true" />
                {t.placeButtons.lock}
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <ToolButton
              pressed={prefs.awake}
              onClick={() => {
                if (!("wakeLock" in navigator)) {
                  setWakeNote("noWakeLock");
                  return;
                }
                setPrefs((prev) => ({ ...prev, awake: !prev.awake }));
              }}
            >
              <Clock className="size-4" aria-hidden="true" />
              {prefs.awake ? t.tools.screenStaysOn : t.tools.keepScreenOn}
            </ToolButton>
            <ToolButton pressed={prefs.chime} onClick={armChime}>
              {prefs.chime ? (
                <Bell className="size-4" aria-hidden="true" />
              ) : (
                <BellOff className="size-4" aria-hidden="true" />
              )}
              {prefs.chime ? (chimeArmed ? t.tools.chimeOn : t.tools.rearm) : t.tools.chime}
            </ToolButton>
          </div>
          {wakeNote ? <p className="mt-2 text-sm text-mute">{t.tools[wakeNote]}</p> : null}

          <label className="mt-3 flex min-h-11 items-center justify-between gap-3 rounded-card border border-line bg-panel px-4 py-2 text-sm">
            <span className="text-mute">{t.plan.label}</span>
            <input
              type="time"
              value={plan}
              onChange={(event) => setPlan(event.target.value)}
              className={`min-h-11 bg-transparent text-ivory ${focusRing}`}
              aria-label={t.plan.inputLabel}
            />
          </label>
        </div>

        <section className="lg:col-span-2">
          <details
            open={timesOpen}
            onToggle={(event) => setTimesOpen(event.currentTarget.open)}
            className="rounded-card border border-line bg-panel px-4 py-3 text-sm text-mute"
          >
            <summary className={`cursor-pointer font-medium text-ivory ${focusRing}`}>
              {t.list.title}
            </summary>
            <div className="mt-3">
              <p className="mb-2 text-sm text-mute">{copy ? copy.leaves : t.list.oneColumn}</p>
              {direction && board ? (
                <BoardList
                  direction={direction}
                  nowSec={viewSec ?? 0}
                  next={board.next}
                  listRef={listRef}
                  nextRow={nextRow}
                  t={t}
                />
              ) : (
                <p className="text-sm text-mute">{t.list.empty}</p>
              )}
            </div>
          </details>
        </section>
      </div>

      <details className="mt-6 rounded-card border border-line bg-panel px-4 py-3 text-sm text-mute">
        <summary className={`cursor-pointer font-medium text-ivory ${focusRing}`}>
          {t.how.title}
        </summary>
        <div className="mt-3 space-y-2 text-pretty">
          <p>{t.how.withLocation}</p>
          <ul className="space-y-1 text-ivory">
            <li>{t.how.atEntrance}</li>
            <li>{t.how.atLot}</li>
            <li>{t.how.elsewhere}</li>
          </ul>
          <p>{t.how.rough}</p>
          <p>{t.how.locationOff}</p>
          <p>{t.how.privacy}</p>
          <p>{t.how.screenChime}</p>
          <p>{t.how.orlando(RIDE_MIN)}</p>
        </div>
      </details>
      <details className="mt-3 rounded-card border border-line bg-panel px-4 py-3 text-sm text-mute">
        <summary className={`cursor-pointer font-medium text-ivory ${focusRing}`}>{t.contact.title}</summary>
        <div className="mt-3 space-y-3 text-pretty">
          <p>
            {t.contact.dispatch}{" "}
            <a href={`tel:+1${DISPATCH_PHONE}`} className={`text-ivory underline ${focusRing}`}>
              {DISPATCH_DISPLAY}
            </a>
          </p>
          <p>
            <a
              href={FEEDBACK_FORM}
              target="_blank"
              rel="noreferrer"
              className={`text-ivory underline ${focusRing}`}
            >
              {t.contact.shoutout}
            </a>
            <span className="mt-0.5 block">{t.contact.shoutoutBody}</span>
          </p>
          <p>
            <a
              href={CONTACT_FORM}
              target="_blank"
              rel="noreferrer"
              className={`text-ivory underline ${focusRing}`}
            >
              {t.contact.appFeedback}
            </a>
            <span className="mt-0.5 block">{t.contact.appFeedbackBody}</span>
          </p>
        </div>
      </details>
      <details className="mt-3 rounded-card border border-line bg-panel px-4 py-3 text-sm text-mute">
        <summary className={`cursor-pointer font-medium text-ivory ${focusRing}`}>
          {t.install.title}
        </summary>
        <div className="mt-3 space-y-2 text-pretty">
          <p>{t.install.intro}</p>
          <p>{t.install.existing}</p>
          <details className="rounded-card border border-line bg-panel-2 px-3 py-2">
            <summary className={`cursor-pointer font-medium text-ivory ${focusRing}`}>Apple</summary>
            <p className="mt-2">{t.install.apple}</p>
          </details>
          <details className="rounded-card border border-line bg-panel-2 px-3 py-2">
            <summary className={`cursor-pointer font-medium text-ivory ${focusRing}`}>
              Android
            </summary>
            <p className="mt-2">{t.install.android}</p>
          </details>
        </div>
      </details>
    </main>
  );
}

function LanguagePicker({
  lang,
  label,
  onChange,
}: {
  lang: Lang;
  label: string;
  onChange: (lang: Lang) => void;
}) {
  return (
    <div role="group" aria-label={label} className="mb-3 flex flex-wrap gap-1.5">
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          lang={HTML_LANG[code]}
          aria-pressed={code === lang}
          data-testid={`lang-${code}`}
          onClick={() => onChange(code)}
          className={`inline-flex min-h-10 items-center rounded-full border px-2.5 text-xs font-medium ${focusRing} ${
            code === lang ? "border-signal bg-signal text-signal-ink" : "border-line text-ivory"
          }`}
        >
          {MESSAGES[code].languageName}
        </button>
      ))}
    </div>
  );
}

function columnTone(direction: Direction) {
  if (direction === "to-hotel") {
    return { text: "text-lot", bg: "bg-lot", ink: "text-lot-ink", dot: "bg-lot" };
  }
  return { text: "text-gate", bg: "bg-gate", ink: "text-gate-ink", dot: "bg-gate" };
}

function DirectionButton({
  active,
  tabIndex,
  onClick,
  title,
  detail,
  icon,
  testId,
  tone,
}: {
  active: boolean;
  tabIndex: number;
  onClick: () => void;
  title: string;
  detail: string;
  icon: ReactNode;
  testId: string;
  tone: "lot" | "gate";
}) {
  const filled = tone === "lot" ? "bg-lot text-lot-ink" : "bg-gate text-gate-ink";
  const detailOn = tone === "lot" ? "text-lot-ink" : "text-gate-ink";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={tabIndex}
      data-testid={testId}
      onClick={onClick}
      className={`flex min-h-16 flex-col items-start justify-center rounded-xl px-3 py-2 text-left ${focusRing} ${
        active ? filled : "text-ivory"
      }`}
    >
      <span className="flex items-center gap-2 font-display text-2xl leading-none font-semibold tracking-wide">
        {icon}
        {title}
      </span>
      <span className={`mt-1 text-xs ${active ? detailOn : "text-mute"}`}>{detail}</span>
    </button>
  );
}

function Hero({
  board,
  copy,
  t,
  atStop,
  mapHref,
}: {
  board: BoardSnapshot;
  copy: Messages["directions"][Direction];
  t: Messages;
  atStop: boolean;
  mapHref: string;
}) {
  const late = walkLine(board, atStop, t);
  const rideFrom = rideDeparture(board);
  const hot = !board.next.boarding && board.next.waitSec < 60 && !board.inGap;
  const tone = columnTone(board.direction);
  const eyebrow = board.inGap ? t.hero.noBus : board.next.boarding ? t.hero.leavingNow : copy.nextBus;
  const countdown = board.next.boarding ? t.hero.now : formatCountdown(board.next.waitSec);
  const countLabel = board.inGap ? t.hero.resumesIn : board.next.boarding ? t.hero.atStop : t.hero.leavesIn;

  return (
    <div>
      <p className={`flex items-center gap-2 text-sm font-medium tracking-wide uppercase ${tone.text}`}>
        <span className={`live-dot inline-block size-2 rounded-full ${tone.dot}`} aria-hidden="true" />
        {eyebrow}
      </p>
      <p className="mt-3 font-display text-5xl leading-none font-semibold tracking-wide text-ivory">
        <span className="whitespace-nowrap">
          {board.inGap ? t.hero.gapHours : formatClock(board.next.minutes)}
        </span>
        {board.next.tomorrow && !board.inGap ? (
          <span className="ml-2 align-middle font-sans text-base font-medium tracking-normal text-mute normal-case">
            {t.hero.tomorrow}
          </span>
        ) : null}
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mute">
        <span>
          {board.inGap ? copy.backAt(formatClock(board.next.minutes)) : copy.standAt}
        </span>
        <a
          href={mapHref}
          target="_blank"
          rel="noreferrer"
          aria-label={copy.mapLabel}
          className={`inline-flex min-h-11 items-center gap-1 font-medium text-ivory underline underline-offset-4 ${focusRing}`}
        >
          <Navigation className="size-3.5" aria-hidden="true" />
          {t.hero.map}
        </a>
      </p>
      <p className="mt-5 text-sm text-mute">{countLabel}</p>
      <p
        data-testid="countdown"
        className={`font-display leading-none font-semibold tracking-wide tabular-nums ${
          countdown.length > 5 ? "text-6xl" : "text-7xl"
        } ${hot || board.next.boarding ? tone.text : "text-ivory"}`}
      >
        {countdown}
      </p>
      {board.progress !== null ? (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-panel-2" aria-hidden="true">
          <div
            className={`h-full w-full origin-left ${tone.bg}`}
            style={{ transform: `scaleX(${board.progress})` }}
          />
        </div>
      ) : null}
      {board.inGap ? <Callout kind="gap" resume={formatClock(board.next.minutes)} t={t} /> : null}
      {board.lotCallout ? <Callout kind="lot" resume={formatClock(board.next.minutes)} t={t} /> : null}
      {board.entranceStationed && !board.inGap ? (
        <aside className="mt-4 rounded-2xl border border-line px-4 py-4">
          <p className="font-medium text-ivory">{t.hero.stationedTitle}</p>
          <p className="mt-1 text-sm text-pretty text-mute">{t.hero.stationedNext(formatClock(board.next.minutes))}</p>
        </aside>
      ) : null}
      {board.inGap || board.lotCallout ? null : (
        <p className={`mt-4 text-sm ${late.late ? "text-alert" : "text-ivory"}`}>{late.text}</p>
      )}
      {board.inGap || board.lotCallout || rideFrom === null ? null : (
        <p className="mt-1 text-sm text-mute" data-testid="arrival">
          {rideFrom === board.next.minutes
            ? copy.arrives(formatClock(rideFrom + RIDE_MIN))
            : copy.arrivesOn(formatClock(rideFrom + RIDE_MIN), formatClock(rideFrom))}{" "}
          · {t.hero.rideNote(RIDE_MIN)}
        </p>
      )}
      {board.following.length > 0 && !board.inGap ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label={t.hero.nextThree}>
          {board.following.map((hit) => (
            <li
              key={`${hit.minutes}-${hit.waitSec}`}
              className="rounded-full border border-line px-3 py-1 font-display text-xl leading-none font-semibold tracking-wide text-ivory"
            >
              {formatClock(hit.minutes)}
            </li>
          ))}
        </ul>
      ) : null}
      {board.last && !board.next.boarding && !board.inGap ? (
        <p className="mt-3 text-sm text-mute">
          {t.hero.lastLeft(Math.round(board.last.agoSec / 60), formatClock(board.last.minutes))}
        </p>
      ) : null}
    </div>
  );
}

function Callout({ kind, resume, t }: { kind: "gap" | "lot"; resume: string; t: Messages }) {
  const lot = kind === "lot";
  return (
    <aside className="mt-4 rounded-2xl border border-alert px-4 py-4">
      <p className="font-medium text-ivory">{lot ? t.callout.lotTitle : t.callout.gapTitle(resume)}</p>
      <p className="mt-1 text-sm text-pretty text-mute">{lot ? t.callout.lotBody : t.callout.gapBody}</p>
      <a
        href={`tel:+1${DISPATCH_PHONE}`}
        className={`mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-signal px-4 text-sm font-semibold text-signal-ink ${focusRing}`}
      >
        <Phone className="size-4" aria-hidden="true" />
        {t.callout.call(DISPATCH_DISPLAY)}
      </a>
    </aside>
  );
}

function BoardList({
  direction,
  nowSec,
  next,
  listRef,
  nextRow,
  t,
}: {
  direction: Direction;
  nowSec: number;
  next: BoardSnapshot["next"];
  listRef: RefObject<HTMLUListElement | null>;
  nextRow: RefObject<HTMLLIElement | null>;
  t: Messages;
}) {
  const times = [...DEPARTURES[direction]].sort((a, b) => serviceRank(a) - serviceRank(b));
  const tone = columnTone(direction);
  const groups: { label: DayPart; times: number[] }[] = [];
  for (const time of times) {
    const label = listLabel(time);
    const last = groups[groups.length - 1];
    if (!last || last.label !== label) groups.push({ label, times: [time] });
    else last.times.push(time);
  }

  return (
    <ul
      ref={listRef}
      className="relative max-h-96 overflow-auto rounded-2xl border border-line"
    >
      {groups.map((group) => (
        <li key={group.label} className="list-none">
          <p className="sticky top-0 bg-panel-2 px-4 py-2 text-xs tracking-wide text-mute uppercase">
            {t.list.parts[group.label]}
          </p>
          <ul>
            {group.times.map((time) => {
              const isNext = time === next.minutes;
              const past = isDeparturePast(time, nowSec, next.minutes);
              return (
                <li
                  key={time}
                  ref={isNext ? nextRow : undefined}
                  className={`flex items-center justify-between border-t border-line px-4 py-2 ${
                    isNext ? `${tone.bg} ${tone.ink}` : past ? "text-mute" : "text-ivory"
                  }`}
                >
                  <span className="font-display text-2xl leading-none font-semibold tracking-wide tabular-nums">
                    {formatClock(time)}
                  </span>
                  <span className="text-xs tracking-wide uppercase">
                    {isNext ? (next.boarding ? t.list.now : t.list.next) : past ? t.list.left : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function ToolButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-card border px-3 text-sm ${focusRing} ${
        pressed
          ? "border-signal bg-signal text-signal-ink"
          : "border-line bg-panel text-ivory"
      }`}
    >
      {children}
    </button>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex size-11 items-center justify-center rounded-full border border-line text-ivory ${focusRing}`}
    >
      {children}
    </button>
  );
}

function placeDetail(
  place: PlaceState,
  mode: Mode,
  fix: Fix | null,
  fromLink: boolean,
  staleMin: number | null,
  t: Messages,
): string {
  const d = t.placeDetail;
  const pin = fix ? pinDistance(fix, t) : null;
  const where = pin && staleMin !== null ? d.ago(pin, staleMin) : pin;
  if (fromLink) return where ? d.fromLink(where) : d.fromLinkNoPin;
  if (mode !== "auto") return where ? d.locked(where) : d.lockedNoPin;
  switch (place) {
    case "pending":
      return d.pending;
    case "at-hotel":
      return where ? d.entranceColumn(where) : d.showingEntrance;
    case "at-lot":
    case "away":
    case "far":
      return where ? d.lotColumn(where) : d.showingLot;
    case "fuzzy":
      return d.fuzzy;
    case "denied":
      return d.denied;
    case "timeout":
      return d.timeout;
    case "unavailable":
      return d.unavailable;
    case "idle":
      return d.idle;
    default:
      return d.other;
  }
}

function pinDistance(fix: Fix, t: Messages): string {
  const d = t.placeDetail;
  if (fix.zone === "at-lot" || fix.zone === "away" || fix.zone === "far") return d.fromLot(formatDistance(fix.lotM));
  if (fix.zone === "at-hotel") return d.fromHotel(formatDistance(fix.hotelM));
  return fix.lotM <= fix.hotelM ? d.fromLot(formatDistance(fix.lotM)) : d.fromHotel(formatDistance(fix.hotelM));
}

function summaryText(direction: Direction | null, board: BoardSnapshot | null, t: Messages): string {
  if (!direction || !board) return t.switcher.summary;
  const copy = t.directions[direction];
  const time = formatClock(board.next.minutes);
  if (board.inGap) return copy.summaryGap(time);
  if (board.next.boarding) return copy.summaryBoarding(time);
  return copy.summaryNext(time, Math.max(0, Math.ceil(board.next.waitSec / 60)));
}

function formatPlan(value: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return value;
  return formatClock(Number(match[1]) * 60 + Number(match[2]));
}
