import { DEPARTURES, HOTEL, LOT, TZ, type Direction } from "./schedule.ts";

export const GRACE_SEC = 45;
/** Red banner on the sheet: no bus 1:30 AM–3:00 AM. */
export const GAP_START_MIN = 90;
export const GAP_END_MIN = 180;
const LONG_WAIT_SEC = 40 * 60;

export type Mode = "auto" | Direction;

export type Zone = "at-hotel" | "at-lot" | "away" | "fuzzy" | "far";

export type PlaceState = Zone | "pending" | "denied" | "unsupported";

export type OrlandoNow = {
  seconds: number;
  weekday: string;
  dateLabel: string;
  clock: string;
};

export type BusHit = {
  /** Minute of day the bus is printed for. */
  minutes: number;
  /** Seconds until that departure. Negative during the boarding grace. */
  waitSec: number;
  boarding: boolean;
  tomorrow: boolean;
};

export type BoardSnapshot = {
  direction: Direction;
  inGap: boolean;
  /** Lot side after the 11:50 PM bus, until the 3:00 AM restart. */
  lotCallout: boolean;
  /** Entrance side from midnight until the 1:30 AM bus. */
  entranceStationed: boolean;
  next: BusHit;
  following: BusHit[];
  last: { minutes: number; agoSec: number } | null;
  /** 0–1 progress through the gap since the previous bus. Null on long breaks. */
  progress: number | null;
  walkMin: number;
  /** Seconds until you should leave to make this bus. Negative = too late to walk. */
  leaveInSec: number;
};

export function readOrlando(date: Date): OrlandoNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "long",
    month: "short",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;
  const minute = Number(get("minute"));
  const second = Number(get("second"));
  const h12 = hour % 12 || 12;
  const ap = hour >= 12 ? "PM" : "AM";
  return {
    seconds: hour * 3600 + minute * 60 + second,
    weekday: get("weekday"),
    dateLabel: `${get("month")} ${get("day")}`,
    clock: `${h12}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")} ${ap}`,
  };
}

export function formatClock(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  const h12 = hour24 % 12 || 12;
  const ap = hour24 >= 12 ? "PM" : "AM";
  return `${h12}:${String(minute).padStart(2, "0")} ${ap}`;
}

export function formatCountdown(waitSec: number): string {
  const total = Math.max(0, Math.floor(waitSec));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

export function formatDistance(meters: number): string {
  const feet = meters * 3.280839895;
  if (feet < 5280) {
    const rounded = Math.max(30, Math.round(feet / 10) * 10);
    return `${rounded} ft`;
  }
  const miles = meters / 1609.344;
  return `${miles >= 10 ? Math.round(miles) : miles.toFixed(1)} mi`;
}

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function ring(distanceM: number, accuracyM: number, radiusM: number): "inside" | "outside" | "fuzzy" {
  const nearest = Math.max(0, distanceM - accuracyM);
  const farthest = distanceM + accuracyM;
  if (farthest < radiusM) return "inside";
  if (nearest > radiusM) return "outside";
  return "fuzzy";
}

export function zoneFor(hotelM: number, lotM: number, accuracyM: number): Zone {
  const accuracy = Math.max(0, accuracyM);
  const hotel = ring(hotelM, accuracy, HOTEL.radiusM);
  const lot = ring(lotM, accuracy, LOT.radiusM);
  if (lot === "inside" && hotel !== "inside") return "at-lot";
  if (hotel === "inside" && lot !== "inside") return "at-hotel";
  if (hotel === "inside" && lot === "inside") return hotelM <= lotM ? "at-hotel" : "at-lot";
  if (hotel === "fuzzy" || lot === "fuzzy") return "fuzzy";
  const hotelNear = Math.max(0, hotelM - accuracy);
  const lotNear = Math.max(0, lotM - accuracy);
  if (hotelNear > HOTEL.farM && lotNear > HOTEL.farM) return "far";
  return "away";
}

export function resolveDirection(mode: Mode, place: PlaceState): Direction | null {
  if (mode === "to-hotel" || mode === "from-hotel") return mode;
  if (place === "at-hotel") return "from-hotel";
  if (place === "at-lot" || place === "away" || place === "far") return "to-hotel";
  return null;
}

function hitsAround(times: number[], nowSec: number): BusHit[] {
  const hits: BusHit[] = [];
  for (const day of [0, 1]) {
    for (const minutes of times) {
      const dep = day * 86400 + minutes * 60;
      const waitSec = dep - nowSec;
      if (waitSec < -GRACE_SEC) continue;
      if (waitSec > 86400) continue;
      hits.push({
        minutes,
        waitSec,
        boarding: waitSec < 0,
        tomorrow: day === 1 && minutes * 60 <= nowSec,
      });
    }
  }
  hits.sort((a, b) => a.waitSec - b.waitSec);
  return hits;
}

export function boardAt(
  direction: Direction,
  nowSec: number,
  walkMin: number,
): BoardSnapshot {
  const now = ((nowSec % 86400) + 86400) % 86400;
  const times = DEPARTURES[direction];
  const hits = hitsAround(times, now);
  const next = hits[0];
  if (!next) throw new Error("Schedule has no departures");
  const following = hits.slice(1, 4);

  let last: BoardSnapshot["last"] = null;
  for (const day of [-1, 0]) {
    for (const minutes of times) {
      const dep = day * 86400 + minutes * 60;
      const ago = now - dep;
      if (ago > GRACE_SEC && (last === null || ago < last.agoSec)) {
        last = { minutes, agoSec: ago };
      }
    }
  }
  if (last && last.agoSec > 45 * 60) last = null;

  const gapStart =
    direction === "from-hotel" ? GAP_START_MIN * 60 + GRACE_SEC : GAP_START_MIN * 60;
  const inGap = now >= gapStart && now < GAP_END_MIN * 60;
  const lotCallout =
    direction === "to-hotel" && !next.boarding && next.minutes === GAP_END_MIN && next.waitSec >= LONG_WAIT_SEC;
  const entranceStationed = direction === "from-hotel" && now < GAP_START_MIN * 60;

  let progress: number | null = null;
  if (!next.boarding && next.waitSec < LONG_WAIT_SEC && last) {
    const span = last.agoSec + next.waitSec;
    if (span > 0 && span < LONG_WAIT_SEC) {
      progress = Math.min(1, Math.max(0, last.agoSec / span));
    }
  }

  return {
    direction,
    inGap,
    lotCallout,
    entranceStationed,
    next,
    following,
    last,
    progress,
    walkMin,
    leaveInSec: next.boarding ? 0 : next.waitSec - walkMin * 60,
  };
}

export function daypart(minutes: number): string {
  if (minutes < 5 * 60) return "Early morning";
  if (minutes < 12 * 60) return "Morning";
  if (minutes < 17 * 60) return "Afternoon";
  if (minutes < 21 * 60) return "Evening";
  return "Night";
}
