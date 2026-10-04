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
  DIRECTION_COPY,
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
  type MapApp,
  type Mode,
  type OrlandoNow,
  type PlaceState,
  type Zone,
} from "@/lib/shuttle/logic";

const PREFS_KEY = "bus-up-v1";

type Prefs = {
  mode: Mode;
  walkMin: number;
  chime: boolean;
  awake: boolean;
  locate: boolean;
};

type Fix = {
  /** When the phone took the reading, epoch ms. */
  at: number;
  zone: Zone;
  hotelM: number;
  lotM: number;
  accuracyM: number;
};

const DEFAULT_PREFS: Prefs = {
  mode: "auto",
  walkMin: 3,
  chime: false,
  awake: false,
  locate: false,
};

/** A reading older than this no longer counts for "you're at the stop". */
const FIX_FRESH_MS = 3 * 60_000;
/** Re-read location this often while the page is on screen. */
const RELOCATE_MS = 60_000;
const ZONES: readonly PlaceState[] = ["at-hotel", "at-lot", "away", "fuzzy", "far"];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

function loadPrefs(): Prefs {
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
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
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

function agoLabel(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes <= 1) return "1 min ago";
  return `${minutes} min ago`;
}

function walkLine(board: BoardSnapshot, atStop: boolean): { late: boolean; text: string } {
  if (board.inGap) return { late: false, text: "Nothing is running in this window." };
  if (board.next.boarding) return { late: false, text: "It's at the stop." };
  if (atStop) return { late: false, text: "You're at the stop." };
  if (board.next.waitSec > 30 * 60) {
    return { late: false, text: "Plenty of time before you need to head out." };
  }
  if (board.walkMin === 0) return { late: false, text: "Walk time is zero — you're counting from the stop." };
  if (board.leaveInSec < 0) {
    const catchMin = board.catchMinutes;
    const catchable = catchMin != null && catchMin !== board.next.minutes;
    return {
      late: true,
      text: catchable
        ? `Too late for this one. Next you can catch is ${formatClock(catchMin)}.`
        : "Too late for this one.",
    };
  }
  if (board.leaveInSec < 60) {
    const after = board.following[0];
    return {
      late: true,
      text: after
        ? `Leave now or you'll miss it. Next is ${formatClock(after.minutes)}.`
        : "Leave now or you'll miss it.",
    };
  }
  return {
    late: false,
    text: `Head out by ${formatClock(board.next.minutes - board.walkMin)} · ${board.walkMin} min to the stop`,
  };
}

function placeTitle(place: PlaceState): string {
  switch (place) {
    case "pending":
      return "Checking where you are";
    case "at-hotel":
      return "At the hotel stop";
    case "at-lot":
      return "At the lot pickup";
    case "away":
      return "Heading to the lot";
    case "fuzzy":
      return "Location is fuzzy";
    case "far":
      return "Coming in to the lot";
    case "denied":
      return "Location is off";
    case "timeout":
      return "Location timed out";
    case "idle":
      return "Not using location";
    case "unavailable":
      return "No location fix";
    default:
      return "Location unavailable";
  }
}

export function ShuttleBoard() {
  const live = useOrlandoNow();
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [place, setPlace] = useState<PlaceState>("idle");
  const [fix, setFix] = useState<Fix | null>(null);
  const [plan, setPlan] = useState<string>("");
  const [wakeNote, setWakeNote] = useState<string | null>(null);
  const [chimeArmed, setChimeArmed] = useState(false);
  const [locateNonce, setLocateNonce] = useState(0);
  const [mapApp] = useState<MapApp>(() => (isAppleDevice() ? "apple" : "google"));
  const [timesOpen, setTimesOpen] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
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

  useEffect(() => {
    // ?dir= shows that column for this visit only, so a scan never turns off Follow me for good.
    // Drop it from the address so it doesn't stick to a home-screen icon.
    const url = new URL(window.location.href);
    if (!url.searchParams.has("dir")) return;
    url.searchParams.delete("dir");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Private mode or full storage: settings just won't stick.
    }
  }, [prefs]);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!prefs.locate) {
      locateGen.current += 1;
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
          setFix({ at: pos.timestamp, zone, hotelM, lotM, accuracyM });
          setPlace(zone);
        },
        (err) => {
          if (gen !== locateGen.current) return;
          const failure = geoFailure(err.code);
          if (failure === "denied") {
            setFix(null);
            setPlace(failure);
            return;
          }
          // A slow re-read at the lot keeps the last place instead of blanking the column.
          setPlace((prev) => (ZONES.includes(prev) ? prev : failure));
        },
        { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 },
      );
    };
    ask();
    const onVis = () => {
      if (document.visibilityState === "visible") ask();
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
        wakeLock.current = await navigator.wakeLock.request("screen");
        setWakeNote(null);
      } catch {
        if (!cancelled) setWakeNote("This browser won't keep the screen on.");
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
  const atStop =
    !plan &&
    live !== null &&
    direction !== null &&
    fix !== null &&
    live.epochMs - fix.at <= FIX_FRESH_MS &&
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

  const summary = summaryText(direction, board);
  const copy = direction ? DIRECTION_COPY[direction] : null;
  const mismatch =
    mode !== "auto" &&
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
    setPlace("pending");
    setPrefs((prev) => ({ ...prev, locate: true }));
    setLocateNonce((n) => n + 1);
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
      setWakeNote("This browser won't play a chime.");
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

      <header className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[1.85rem] leading-none font-semibold tracking-wide text-ivory sm:text-4xl">
            Next Bus Up
          </h1>
          <p className="mt-1 text-sm text-mute">Dream Tree edition</p>
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
            {live ? `${live.weekday.slice(0, 3)} · ${live.dateLabel}` : "Orlando"} · Orlando time
          </p>
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div
            role="radiogroup"
            aria-label="Which direction to show"
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
              title="To hotel"
              detail="Leaves the lot"
              icon={<Hotel className="size-5" aria-hidden="true" />}
              testId="direction-to"
            />
            <DirectionButton
              active={direction === "from-hotel"}
              tabIndex={direction === "from-hotel" ? 0 : -1}
              tone="gate"
              onClick={() => choose("from-hotel")}
              title="From hotel"
              detail="Leaves the entrance"
              icon={<BusFront className="size-5" aria-hidden="true" />}
              testId="direction-from"
            />
          </div>
          <p className="mt-2 px-1 text-sm text-mute">
            {copy ? copy.column : "Pick one column. The other stays hidden so it can't be misread."}
          </p>

          {mismatch ? (
            <p className="mt-2 px-1 text-sm text-alert">
              {place === "at-hotel"
                ? "You're at the hotel stop, but this column is locked to the parking lot."
                : place === "at-lot"
                  ? "You're at the lot pickup, but this column is locked to the employee entrance."
                  : "You're not at the hotel stop, but this column is locked to the employee entrance."}
            </p>
          ) : null}

          <section className="mt-3 rounded-card border border-line bg-panel px-5 py-5" aria-live="off">
            {plan ? (
              <p className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-panel-2 px-3 py-2 text-sm text-ivory">
                <span>Checking {formatPlan(plan)} instead of now.</span>
                <button
                  type="button"
                  onClick={() => setPlan("")}
                  className={`min-h-11 rounded-full px-3 font-medium text-signal ${focusRing}`}
                >
                  Back to now
                </button>
              </p>
            ) : null}

            {!board || !copy || !direction ? (
              <div>
                <p className="font-display text-3xl leading-none font-semibold tracking-wide text-ivory">
                  Pick a side
                </p>
                <p className="mt-3 max-w-sm text-pretty text-mute">
                  To hotel if you're heading to the shuttle lot. From hotel if you're at the employee
                  entrance on Dream Tree Blvd.
                </p>
              </div>
            ) : (
              <Hero
                board={board}
                copy={copy}
                atStop={atStop}
                mapHref={directionsUrl(direction, mapApp)}
              />
            )}

            {board ? (
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                <p className="text-sm text-mute">
                  Minutes to reach the stop
                  {atStop ? <span className="block text-xs">Skipped while you're at the stop</span> : null}
                </p>
                <div className="flex items-center gap-2">
                  <StepButton
                    label="Fewer minutes to the stop"
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
                    label="More minutes to the stop"
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
            Times published/updated as of {formatSheetDate()}
          </p>

          <div className="mt-4 flex items-start justify-between gap-3 rounded-card border border-line bg-panel px-4 py-3">
            <div className="flex min-w-0 gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-signal" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-medium text-ivory">{placeTitle(place)}</p>
                <p className="text-sm text-mute">
                  {placeDetail(place, mode, fix)}
                </p>
              </div>
            </div>
            {mode !== "auto" ? (
              <button
                type="button"
                onClick={followMe}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-signal px-3 text-sm font-semibold text-signal-ink ${focusRing}`}
              >
                <Unlock className="size-4" aria-hidden="true" />
                Follow me
              </button>
            ) : !prefs.locate || place === "timeout" || place === "denied" || place === "unavailable" ? (
              <button
                type="button"
                onClick={useMyLocation}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-sm text-ivory ${focusRing}`}
              >
                <MapPin className="size-4" aria-hidden="true" />
                {prefs.locate ? "Try again" : "Use my location"}
              </button>
            ) : (
              <button
                type="button"
                disabled={!direction}
                onClick={() => direction && choose(direction)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-sm text-ivory disabled:opacity-40 ${focusRing}`}
              >
                <Lock className="size-4" aria-hidden="true" />
                Lock
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <ToolButton
              pressed={prefs.awake}
              onClick={() => {
                if (!("wakeLock" in navigator)) {
                  setWakeNote("This browser won't keep the screen on.");
                  return;
                }
                setPrefs((prev) => ({ ...prev, awake: !prev.awake }));
              }}
            >
              <Clock className="size-4" aria-hidden="true" />
              {prefs.awake ? "Screen stays on" : "Keep screen on"}
            </ToolButton>
            <ToolButton pressed={prefs.chime} onClick={armChime}>
              {prefs.chime ? (
                <Bell className="size-4" aria-hidden="true" />
              ) : (
                <BellOff className="size-4" aria-hidden="true" />
              )}
              {prefs.chime ? (chimeArmed ? "Chime on" : "Tap to re-arm") : "Chime"}
            </ToolButton>
          </div>
          {wakeNote ? <p className="mt-2 text-sm text-mute">{wakeNote}</p> : null}

          <label className="mt-3 flex min-h-11 items-center justify-between gap-3 rounded-card border border-line bg-panel px-4 py-2 text-sm">
            <span className="text-mute">Check a different time</span>
            <input
              type="time"
              value={plan}
              onChange={(event) => setPlan(event.target.value)}
              className={`min-h-11 bg-transparent text-ivory ${focusRing}`}
              aria-label="Pretend the Orlando time is"
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
              Today's times
            </summary>
            <div className="mt-3">
              <p className="mb-2 text-sm text-mute">{copy ? copy.leaves : "One column"}</p>
              {direction && board ? (
                <BoardList
                  direction={direction}
                  nowSec={viewSec ?? 0}
                  next={board.next}
                  listRef={listRef}
                  nextRow={nextRow}
                />
              ) : (
                <p className="text-sm text-mute">
                  The full board shows up once a column is selected. Only that column — never both.
                </p>
              )}
            </div>
          </details>
        </section>
      </div>

      <details className="mt-6 rounded-card border border-line bg-panel px-4 py-3 text-sm text-mute">
        <summary className={`cursor-pointer font-medium text-ivory ${focusRing}`}>
          How the column gets picked
        </summary>
        <div className="mt-3 space-y-2 text-pretty">
          <p>With location on, the column follows where you are:</p>
          <ul className="space-y-1 text-ivory">
            <li>At the employee entrance → From hotel</li>
            <li>At the lot → To hotel</li>
            <li>Anywhere else → To hotel, until you lock a column</li>
          </ul>
          <p>If your location is too rough to tell, it asks you to pick.</p>
          <p>
            With location off, tap a column and it sticks on this phone. A stop's QR code shows that
            column for that visit.
          </p>
          <p>
            This board never sends your location anywhere. The map link only carries the stop's
            position.
          </p>
          <p>
            Keep screen on holds the display while you wait at the stop. Chime plays a short tone
            when a bus is 5 minutes, 2 minutes, and 30 seconds out, and only while this page is open.
          </p>
          <p>
            Shown in Orlando time even if your phone is set somewhere else. Nothing runs 1:30–3:00 AM.
            After 11:50 PM the lot has no departure until 3:00 AM. The ride takes about {RIDE_MIN}{" "}
            minutes and can run longer.
          </p>
        </div>
      </details>
      <details className="mt-3 rounded-card border border-line bg-panel px-4 py-3 text-sm text-mute">
        <summary className={`cursor-pointer font-medium text-ivory ${focusRing}`}>Contact</summary>
        <div className="mt-3 space-y-3 text-pretty">
          <p>
            Dispatch{" "}
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
              Shoutout and feedback
            </a>
            <span className="mt-0.5 block">
              Skyline form from the bus QR. Put your name, the shuttle time, and what happened. It
              goes to P&C.
            </span>
          </p>
          <p>
            <a
              href={CONTACT_FORM}
              target="_blank"
              rel="noreferrer"
              className={`text-ivory underline ${focusRing}`}
            >
              App feedback
            </a>
            <span className="mt-0.5 block">
              About this board, not the bus. Bugs, ideas, or a comment.
            </span>
          </p>
        </div>
      </details>
      <details className="mt-3 rounded-card border border-line bg-panel px-4 py-3 text-sm text-mute">
        <summary className={`cursor-pointer font-medium text-ivory ${focusRing}`}>
          Add it to your phone
        </summary>
        <div className="mt-3 space-y-2 text-pretty">
          <p>
            Opens full screen, like an app. The countdown is one tap away, and it still works when the
            lot has a weak signal.
          </p>
          <p>An icon already on your home screen will not change. Delete it, then add it again.</p>
          <details className="rounded-card border border-line bg-panel-2 px-3 py-2">
            <summary className={`cursor-pointer font-medium text-ivory ${focusRing}`}>Apple</summary>
            <p className="mt-2">
              Open this page in Safari. Share, then Add to Home Screen. Chrome on an iPhone cannot
              set the icon.
            </p>
          </details>
          <details className="rounded-card border border-line bg-panel-2 px-3 py-2">
            <summary className={`cursor-pointer font-medium text-ivory ${focusRing}`}>
              Android
            </summary>
            <p className="mt-2">In Chrome: menu, then Install app.</p>
          </details>
        </div>
      </details>
    </main>
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
  atStop,
  mapHref,
}: {
  board: BoardSnapshot;
  copy: (typeof DIRECTION_COPY)[Direction];
  atStop: boolean;
  mapHref: string;
}) {
  const late = walkLine(board, atStop);
  const rideFrom = rideDeparture(board);
  const hot = !board.next.boarding && board.next.waitSec < 60 && !board.inGap;
  const tone = columnTone(board.direction);
  const eyebrow = board.inGap ? "No bus" : board.next.boarding ? "Leaving now" : `Next bus ${copy.title.toLowerCase()}`;
  const countdown = board.next.boarding ? "NOW" : formatCountdown(board.next.waitSec);
  const countLabel = board.inGap ? "Service resumes in" : board.next.boarding ? "At the stop" : "Leaves in";

  return (
    <div>
      <p className={`flex items-center gap-2 text-sm font-medium tracking-wide uppercase ${tone.text}`}>
        <span className={`live-dot inline-block size-2 rounded-full ${tone.dot}`} aria-hidden="true" />
        {eyebrow}
      </p>
      <p className="mt-3 font-display text-5xl leading-none font-semibold tracking-wide text-ivory">
        <span className="whitespace-nowrap">
          {board.inGap ? "1:30–3:00 AM" : formatClock(board.next.minutes)}
        </span>
        {board.next.tomorrow && !board.inGap ? (
          <span className="ml-2 align-middle font-sans text-base font-medium tracking-normal text-mute normal-case">
            tomorrow
          </span>
        ) : null}
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mute">
        <span>
          {board.inGap
            ? `Back at ${formatClock(board.next.minutes)} · ${copy.stop}`
            : `Stand at the ${copy.stop.toLowerCase()}`}
        </span>
        <a
          href={mapHref}
          target="_blank"
          rel="noreferrer"
          aria-label={copy.directions}
          className={`inline-flex min-h-11 items-center gap-1 font-medium text-ivory underline underline-offset-4 ${focusRing}`}
        >
          <Navigation className="size-3.5" aria-hidden="true" />
          Map
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
      {board.inGap ? <Callout kind="gap" resume={formatClock(board.next.minutes)} /> : null}
      {board.lotCallout ? <Callout kind="lot" resume={formatClock(board.next.minutes)} /> : null}
      {board.entranceStationed && !board.inGap ? (
        <aside className="mt-4 rounded-2xl border border-line px-4 py-4">
          <p className="font-medium text-ivory">
            The lot has no bus until 3:00 AM. This column still leaves from the employee entrance.
          </p>
          <p className="mt-1 text-sm text-pretty text-mute">Next one is {formatClock(board.next.minutes)}.</p>
        </aside>
      ) : null}
      {board.inGap || board.lotCallout ? null : (
        <p className={`mt-4 text-sm ${late.late ? "text-alert" : "text-ivory"}`}>{late.text}</p>
      )}
      {board.inGap || board.lotCallout || rideFrom === null ? null : (
        <p className="mt-1 text-sm text-mute" data-testid="arrival">
          {copy.arrives} around {formatClock(rideFrom + RIDE_MIN)}
          {rideFrom === board.next.minutes ? "" : ` on the ${formatClock(rideFrom)} bus`} · about {RIDE_MIN}{" "}
          min, can run longer
        </p>
      )}
      {board.following.length > 0 && !board.inGap ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Next three departures">
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
          Last one left {agoLabel(board.last.agoSec)} · {formatClock(board.last.minutes)}
        </p>
      ) : null}
    </div>
  );
}

function Callout({ kind, resume }: { kind: "gap" | "lot"; resume: string }) {
  const lot = kind === "lot";
  return (
    <aside className="mt-4 rounded-2xl border border-alert px-4 py-4">
      <p className="font-medium text-ivory">
        {lot
          ? "The shuttle should be waiting at the resort employee entrance."
          : `Nothing is scheduled until ${resume}.`}
      </p>
      <p className="mt-1 text-sm text-pretty text-mute">
        {lot
          ? "If you don't see it, call for an employee pickup from the lot."
          : "If you still need a ride, call dispatch."}
      </p>
      <a
        href={`tel:+1${DISPATCH_PHONE}`}
        className={`mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-signal px-4 text-sm font-semibold text-signal-ink ${focusRing}`}
      >
        <Phone className="size-4" aria-hidden="true" />
        Call {DISPATCH_DISPLAY}
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
}: {
  direction: Direction;
  nowSec: number;
  next: BoardSnapshot["next"];
  listRef: RefObject<HTMLUListElement | null>;
  nextRow: RefObject<HTMLLIElement | null>;
}) {
  const times = [...DEPARTURES[direction]].sort((a, b) => serviceRank(a) - serviceRank(b));
  const tone = columnTone(direction);
  const groups: { label: string; times: number[] }[] = [];
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
            {group.label}
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
                    {isNext ? (next.boarding ? "Now" : "Next") : past ? "Left" : ""}
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

function placeDetail(place: PlaceState, mode: Mode, fix: Fix | null): string {
  const where = fix ? pinDistance(fix) : null;
  if (mode !== "auto") {
    return where ? `Column locked · ${where}` : "Column locked · not using your pin";
  }
  switch (place) {
    case "pending":
      return "Looking for the hotel stop and the lot pickup";
    case "at-hotel":
      return where ? `${where} · entrance column` : "Showing buses that leave the entrance";
    case "at-lot":
      return where ? `${where} · parking-lot column` : "Showing buses that leave the lot";
    case "away":
      return where ? `${where} · parking-lot column` : "Showing buses that leave the lot";
    case "fuzzy":
      return "Too uncertain to pick a column. Use the switch.";
    case "far":
      return where ? `${where} · parking-lot column` : "Showing buses that leave the lot";
    case "denied":
      return "Allow location, or use the switch. It will stick.";
    case "timeout":
      return "That reading was too slow. Try again, or use the switch.";
    case "unavailable":
      return "This phone couldn't get a position. Use the switch.";
    case "idle":
      return "Turn location on if you want the column picked for you.";
    default:
      return "Use the switch. It will stick on this phone.";
  }
}

function pinDistance(fix: Fix): string {
  if (fix.zone === "at-lot" || fix.zone === "away" || fix.zone === "far") {
    return `${formatDistance(fix.lotM)} from the lot pickup`;
  }
  if (fix.zone === "at-hotel") return `${formatDistance(fix.hotelM)} from the hotel stop`;
  return fix.lotM <= fix.hotelM
    ? `${formatDistance(fix.lotM)} from the lot pickup`
    : `${formatDistance(fix.hotelM)} from the hotel stop`;
}

function summaryText(direction: Direction | null, board: BoardSnapshot | null): string {
  if (!direction || !board) return "Choose to hotel or from hotel.";
  const stop = DIRECTION_COPY[direction].stop;
  if (board.inGap) return `No bus. Service resumes at ${formatClock(board.next.minutes)} from the ${stop}.`;
  if (board.next.boarding) return `${formatClock(board.next.minutes)} is leaving now from the ${stop}.`;
  const minutes = Math.max(0, Math.ceil(board.next.waitSec / 60));
  return `Next bus ${formatClock(board.next.minutes)} from the ${stop}, about ${minutes} minutes.`;
}

function formatPlan(value: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return value;
  return formatClock(Number(match[1]) * 60 + Number(match[2]));
}
