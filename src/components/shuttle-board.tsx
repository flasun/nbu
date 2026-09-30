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
  Phone,
  Plus,
  Unlock,
} from "lucide-react";
import {
  DEPARTURES,
  DIRECTION_COPY,
  DISPATCH_DISPLAY,
  DISPATCH_PHONE,
  HOTEL,
  LOT,
  SHEET_LABEL,
  type Direction,
} from "@/lib/shuttle/schedule";
import {
  boardAt,
  daypart,
  formatClock,
  formatCountdown,
  formatDistance,
  haversineMeters,
  readOrlando,
  resolveDirection,
  zoneFor,
  type BoardSnapshot,
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
};

type Fix = {
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
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
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
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function useOrlandoNow(): OrlandoNow | null {
  const [now, setNow] = useState<OrlandoNow | null>(null);
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

function walkLine(board: BoardSnapshot): { late: boolean; text: string } {
  if (board.inGap) return { late: false, text: "Nothing is running in this window." };
  if (board.next.boarding) return { late: false, text: "It's at the stop." };
  if (board.next.waitSec > 30 * 60) {
    return { late: false, text: "Plenty of time before you need to head out." };
  }
  if (board.walkMin === 0) return { late: false, text: "Walk time is zero — you're counting from the stop." };
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
    default:
      return "Location unavailable";
  }
}

export function ShuttleBoard() {
  const live = useOrlandoNow();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);
  const [place, setPlace] = useState<PlaceState>("pending");
  const [fix, setFix] = useState<Fix | null>(null);
  const [plan, setPlan] = useState<string>("");
  const [wakeNote, setWakeNote] = useState<string | null>(null);
  const nextRow = useRef<HTMLLIElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const prevWait = useRef<number | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    setPrefs(loadPrefs());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs, hydrated]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setPlace("unsupported");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const hotelM = haversineMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          HOTEL.lat,
          HOTEL.lon,
        );
        const lotM = haversineMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          LOT.lat,
          LOT.lon,
        );
        const accuracyM = pos.coords.accuracy;
        const zone = zoneFor(hotelM, lotM, accuracyM);
        setFix({ zone, hotelM, lotM, accuracyM });
        setPlace(zone);
      },
      () => {
        setFix(null);
        setPlace("denied");
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

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

  const direction = resolveDirection(prefs.mode, place);
  const planMin = /^(\d{2}):(\d{2})$/.exec(plan);
  const viewSec = planMin
    ? Number(planMin[1]) * 3600 + Number(planMin[2]) * 60
    : (live?.seconds ?? null);
  const board = direction !== null && viewSec !== null ? boardAt(direction, viewSec, prefs.walkMin) : null;

  useEffect(() => {
    if (!board || plan || !prefs.chime || !audioRef.current) {
      prevWait.current = board?.next.waitSec ?? null;
      return;
    }
    const wait = board.next.waitSec;
    const prev = prevWait.current;
    prevWait.current = wait;
    if (prev == null || board.next.boarding) return;
    const crossed = [300, 120, 30].filter((mark) => prev > mark && wait <= mark);
    if (crossed.length) beep(audioRef.current);
  }, [board, plan, prefs.chime]);

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
    prefs.mode !== "auto" &&
    ((place === "at-hotel" && direction === "to-hotel") ||
      (place === "at-lot" && direction === "from-hotel") ||
      (place === "away" && direction === "from-hotel") ||
      (place === "far" && direction === "from-hotel"));

  function choose(next: Direction) {
    setPrefs((prev) => ({ ...prev, mode: next }));
  }

  function followMe() {
    setPrefs((prev) => ({ ...prev, mode: "auto" }));
  }

  function armChime() {
    const AudioCtx = window.AudioContext;
    if (!audioRef.current) audioRef.current = new AudioCtx();
    void audioRef.current.resume();
    setPrefs((prev) => ({ ...prev, chime: !prev.chime }));
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 pt-5 pb-12 md:px-8 md:pt-8">
      <p className="sr-only" aria-live="polite">
        {summary}
      </p>

      <header className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[1.85rem] leading-none font-semibold tracking-wide text-ivory sm:text-4xl">
            Next Bus Up
          </h1>
          <p className="mt-1 text-sm text-mute">Dream Tree edition</p>
        </div>
        <p className="text-right text-sm text-mute">
          {SHEET_LABEL}
          <span className="mt-0.5 block">printed sheet</span>
        </p>
      </header>

      <section className="mb-4 rounded-card border border-line bg-panel px-5 py-4">
        <p className="font-display text-5xl leading-none font-semibold tracking-wide text-ivory tabular-nums md:text-6xl" data-testid="clock">
          {live ? live.clock : "––:––:––"}
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-mute">
          <span className="live-dot inline-block size-2 rounded-full bg-signal" aria-hidden="true" />
          {live ? `${live.weekday} · ${live.dateLabel}` : "Orlando"} · Orlando time
        </p>
        <p className="mt-3 text-sm text-pretty text-ivory">
          Schedule as of Apr 28, 2026 — not a live tracker.
        </p>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div
            role="radiogroup"
            aria-label="Which direction to show"
            className="grid grid-cols-2 gap-1 rounded-card bg-panel-2 p-1"
          >
            <DirectionButton
              active={direction === "to-hotel"}
              tone="lot"
              onClick={() => choose("to-hotel")}
              title="To hotel"
              detail="Leaves the lot"
              icon={<Hotel className="size-5" aria-hidden="true" />}
              testId="direction-to"
            />
            <DirectionButton
              active={direction === "from-hotel"}
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
          <ul className="mt-3 space-y-1 px-1 text-sm text-ivory">
            <li>At the employee entrance → From hotel</li>
            <li>At the lot → To hotel</li>
            <li>Anywhere else → assumes lot until you lock it</li>
          </ul>

          <div className="mt-4 flex items-start justify-between gap-3 rounded-card border border-line bg-panel px-4 py-3">
            <div className="flex min-w-0 gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-signal" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-medium text-ivory">{placeTitle(place)}</p>
                <p className="text-sm text-mute">
                  {placeDetail(place, prefs.mode, fix)}
                </p>
              </div>
            </div>
            {prefs.mode === "auto" ? (
              <button
                type="button"
                disabled={!direction}
                onClick={() => direction && choose(direction)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-sm text-ivory disabled:opacity-40 ${focusRing}`}
              >
                <Lock className="size-4" aria-hidden="true" />
                Lock
              </button>
            ) : (
              <button
                type="button"
                onClick={followMe}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-signal px-3 text-sm font-semibold text-signal-ink ${focusRing}`}
              >
                <Unlock className="size-4" aria-hidden="true" />
                Follow me
              </button>
            )}
          </div>

          {mismatch ? (
            <p className="mt-2 px-1 text-sm text-alert">
              {place === "at-hotel"
                ? "You're at the hotel stop, but this column is locked to the parking lot."
                : place === "at-lot"
                  ? "You're at the lot pickup, but this column is locked to the employee entrance."
                  : "You're not at the hotel stop, but this column is locked to the employee entrance."}
            </p>
          ) : null}

          <section className="mt-4 rounded-card border border-line bg-panel px-5 py-5" aria-live="off">
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

            {!board || !copy ? (
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
              <Hero board={board} copy={copy} />
            )}

            {board ? (
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                <p className="text-sm text-mute">Minutes to reach the stop</p>
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
              {prefs.chime ? "Chime on" : "Chime"}
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
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="font-medium text-ivory">{copy ? copy.stop : "Today's board"}</h2>
            <p className="text-sm text-mute">{copy ? copy.leaves : "One column"}</p>
          </div>
          {direction && board ? (
            <BoardList
              direction={direction}
              nowSec={viewSec ?? 0}
              next={board.next}
              listRef={listRef}
              nextRow={nextRow}
            />
          ) : (
            <p className="rounded-card border border-line bg-panel px-4 py-6 text-sm text-mute">
              The full board shows up once a column is selected. Only that column — never both.
            </p>
          )}
        </section>
      </div>

      <details className="mt-6 rounded-card border border-line bg-panel px-4 py-3 text-sm text-mute">
        <summary className={`cursor-pointer font-medium text-ivory ${focusRing}`}>
          How the column gets picked
        </summary>
        <div className="mt-3 space-y-2 text-pretty">
          <p>
            At the employee entrance, this shows From hotel. At the lot, To hotel. Anywhere else
            assumes the lot until you lock a column.
          </p>
          <p>
            Keep screen on holds the display while you wait at the stop. Chime plays a short tone
            when a bus is 5 minutes, 2 minutes, and 30 seconds out, and only while this page is open.
          </p>
          <p>
            Times are the {SHEET_LABEL} sheet, shown in Orlando time even if your phone is set
            somewhere else. This is not a live tracker of the bus itself. Nothing runs 1:30–3:00 AM.
            After 11:50 PM the lot has no departure until 3:00 AM.
          </p>
        </div>
      </details>
      <p className="mt-4 text-sm text-mute">
        Dispatch{" "}
        <a href={`tel:+1${DISPATCH_PHONE}`} className={`text-ivory underline ${focusRing}`}>
          {DISPATCH_DISPLAY}
        </a>
      </p>
      <p className="mt-6 text-xs text-mute">Built with Grok</p>
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
  tone,
  onClick,
  title,
  detail,
  icon,
  testId,
}: {
  active: boolean;
  tone: "lot" | "gate";
  onClick: () => void;
  title: string;
  detail: string;
  icon: ReactNode;
  testId: string;
}) {
  const filled = tone === "lot" ? "bg-lot text-lot-ink" : "bg-gate text-gate-ink";
  const detailOn = tone === "lot" ? "text-lot-ink" : "text-gate-ink";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
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
}: {
  board: BoardSnapshot;
  copy: (typeof DIRECTION_COPY)[Direction];
}) {
  const late = walkLine(board);
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
        {board.inGap ? "1:30–3:00 AM" : formatClock(board.next.minutes)}
      </p>
      <p className="mt-2 text-sm text-mute">
        {board.inGap
          ? `Back at ${formatClock(board.next.minutes)} · ${copy.stop}`
          : `Stand at the ${copy.stop.toLowerCase()}`}
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
      {(board.inGap || board.lotCallout || board.entranceStationed) && (
        <Callout gap={board.inGap} resume={formatClock(board.next.minutes)} />
      )}
      <p className={`mt-4 text-sm ${late.late ? "text-alert" : "text-ivory"}`}>{late.text}</p>
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

function Callout({ gap, resume }: { gap: boolean; resume: string }) {
  return (
    <aside className="mt-4 rounded-2xl border border-alert px-4 py-4">
      <p className="font-medium text-ivory">
        {gap
          ? `Nothing is scheduled until ${resume}.`
          : "The shuttle should be waiting at the resort employee entrance."}
      </p>
      <p className="mt-1 text-sm text-pretty text-mute">
        If you don't see it, call for an employee pickup from the lot.
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
  const times = DEPARTURES[direction];
  const tone = columnTone(direction);
  const groups: { label: string; times: number[] }[] = [];
  for (const time of times) {
    const label = daypart(time);
    const last = groups[groups.length - 1];
    if (!last || last.label !== label) groups.push({ label, times: [time] });
    else last.times.push(time);
  }

  return (
    <ul
      ref={listRef}
      className="relative max-h-96 overflow-auto rounded-card border border-line bg-panel"
    >
      {groups.map((group) => (
        <li key={group.label} className="list-none">
          <p className="sticky top-0 bg-panel-2 px-4 py-2 text-xs tracking-wide text-mute uppercase">
            {group.label}
          </p>
          <ul>
            {group.times.map((time) => {
              const isNext = time === next.minutes;
              const past = time * 60 + 45 < nowSec && !isNext;
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
