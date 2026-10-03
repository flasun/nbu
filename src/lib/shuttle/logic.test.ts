import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEPARTURES, HOTEL, LOT } from "./schedule.ts";
import {
  AT_STOP_M,
  boardAt,
  directionFromSearch,
  directionsUrl,
  formatClock,
  formatCountdown,
  formatSheetDate,
  geoFailure,
  haversineMeters,
  isAtStop,
  isDeparturePast,
  resolveDirection,
  serviceRank,
  stopDistance,
  zoneFor,
  zonedWallToUtc,
} from "./logic.ts";

const min = (clock: string) => {
  const match = /^(\d{1,2}):(\d{2})(AM|PM)$/.exec(clock);
  if (!match) throw new Error(clock);
  let hour = Number(match[1]) % 12;
  if (match[3] === "PM") hour += 12;
  return hour * 60 + Number(match[2]);
};

describe("printed sheet", () => {
  it("keeps the two columns independent, including the blacked-out lot cell", () => {
    assert.ok(DEPARTURES["to-hotel"].length > 100);
    assert.ok(DEPARTURES["from-hotel"].length > 100);
    assert.equal(new Set(DEPARTURES["to-hotel"]).size, DEPARTURES["to-hotel"].length);
    assert.equal(new Set(DEPARTURES["from-hotel"]).size, DEPARTURES["from-hotel"].length);
    assert.ok(DEPARTURES["from-hotel"].includes(min("11:35AM")));
    assert.equal(DEPARTURES["to-hotel"].includes(min("11:35AM")), false);
    assert.ok(DEPARTURES["from-hotel"].includes(min("1:30AM")));
    assert.equal(DEPARTURES["to-hotel"].includes(min("1:30AM")), false);
    assert.ok(DEPARTURES["to-hotel"].includes(min("3:00AM")));
    assert.ok(DEPARTURES["from-hotel"].includes(min("3:15AM")));
    assert.equal(DEPARTURES["from-hotel"].includes(min("3:00AM")), false);
  });
});

describe("boardAt", () => {
  it("picks the next lot bus and a walk-out time", () => {
    const board = boardAt("to-hotel", min("7:22AM") * 60, 3);
    assert.equal(board.next.minutes, min("7:30AM"));
    assert.equal(board.inGap, false);
    assert.equal(board.next.boarding, false);
    assert.equal(board.leaveInSec, 5 * 60);
    assert.equal(formatClock(board.next.minutes), "7:30 AM");
  });

  it("holds a bus that left within the grace window", () => {
    const board = boardAt("to-hotel", min("7:20AM") * 60 + 20, 3);
    assert.equal(board.next.boarding, true);
    assert.equal(board.next.minutes, min("7:20AM"));
  });

  it("rolls forward once the grace window ends", () => {
    const board = boardAt("to-hotel", min("7:20AM") * 60 + 50, 3);
    assert.equal(board.next.minutes, min("7:30AM"));
    assert.ok(board.last);
    assert.equal(board.last?.minutes, min("7:20AM"));
  });

  it("treats 1:30–3:00 AM as no service, then resumes on the right column", () => {
    const mid = boardAt("from-hotel", min("2:00AM") * 60, 3);
    assert.equal(mid.inGap, true);
    assert.equal(mid.next.minutes, min("3:15AM"));
    const lot = boardAt("to-hotel", min("2:00AM") * 60, 3);
    assert.equal(lot.inGap, true);
    assert.equal(lot.next.minutes, min("3:00AM"));
    assert.equal(lot.lotCallout, false);
    assert.equal(mid.entranceStationed, false);
  });

  it("still runs the entrance through the stationed window", () => {
    const board = boardAt("from-hotel", min("12:10AM") * 60, 3);
    assert.equal(board.inGap, false);
    assert.equal(board.entranceStationed, true);
    assert.equal(board.next.minutes, min("12:15AM"));
  });

  it("sends the lot to the callout after 11:50 PM", () => {
    const boarding = boardAt("to-hotel", min("11:50PM") * 60 + 10, 3);
    assert.equal(boarding.next.boarding, true);
    const after = boardAt("to-hotel", min("11:55PM") * 60, 3);
    assert.equal(after.next.minutes, min("3:00AM"));
    assert.equal(after.next.tomorrow, true);
    assert.equal(after.lotCallout, true);
    assert.equal(after.inGap, false);
  });

  it("wraps from the last early bus to the 5:00 AM start", () => {
    const board = boardAt("to-hotel", min("4:50AM") * 60, 0);
    assert.equal(board.next.minutes, min("5:00AM"));
    assert.equal(formatCountdown(board.next.waitSec), "10:00");
  });

  it("keeps after-midnight entrance buses ahead of an 11:45 PM rider", () => {
    const now = min("11:45PM") * 60;
    const board = boardAt("from-hotel", now, 3);
    assert.equal(board.next.minutes, min("11:50PM"));
    assert.equal(isDeparturePast(min("12:00AM"), now, board.next.minutes), false);
    assert.equal(isDeparturePast(min("12:15AM"), now, board.next.minutes), false);
    assert.equal(isDeparturePast(min("1:30AM"), now, board.next.minutes), false);
    assert.equal(isDeparturePast(min("5:00AM"), now, board.next.minutes), true);
    assert.ok(serviceRank(min("3:15AM")) < serviceRank(min("12:00AM")));
    assert.equal(board.lotCallout, false);
  });

  it("dims a 12:00 AM entrance bus once it has actually left", () => {
    const now = min("12:05AM") * 60;
    const board = boardAt("from-hotel", now, 3);
    assert.equal(board.next.minutes, min("12:15AM"));
    assert.equal(board.lotCallout, false);
    assert.equal(board.entranceStationed, true);
    assert.equal(isDeparturePast(min("12:00AM"), now, board.next.minutes), true);
    assert.equal(isDeparturePast(min("12:15AM"), now, board.next.minutes), false);
    assert.equal(isDeparturePast(min("5:00AM"), now, board.next.minutes), true);
  });

  it("does not mark tomorrow's lot buses as left after the 11:50 PM departure", () => {
    const now = min("11:55PM") * 60;
    const board = boardAt("to-hotel", now, 3);
    assert.equal(board.next.minutes, min("3:00AM"));
    for (const clock of ["3:00AM", "3:30AM", "4:00AM", "4:40AM", "5:00AM", "11:50PM"]) {
      assert.equal(isDeparturePast(min(clock), now, board.next.minutes), false, clock);
    }
  });

  it("still dims a lot bus that has already left in the morning", () => {
    const now = min("7:22AM") * 60;
    const board = boardAt("to-hotel", now, 3);
    assert.equal(isDeparturePast(min("7:20AM"), now, board.next.minutes), true);
    assert.equal(isDeparturePast(min("7:30AM"), now, board.next.minutes), false);
  });

  it("keeps the entrance's after-midnight buses ahead at 11:45 PM", () => {
    const now = min("11:45PM") * 60;
    const board = boardAt("from-hotel", now, 3);
    for (const clock of ["12:00AM", "12:15AM", "12:30AM", "12:50AM", "1:10AM", "1:30AM"]) {
      assert.equal(isDeparturePast(min(clock), now, board.next.minutes), false, clock);
    }
  });

  it("dims an entrance bus only after it has left, just after midnight", () => {
    const now = min("12:40AM") * 60;
    const board = boardAt("from-hotel", now, 3);
    assert.equal(board.next.minutes, min("12:50AM"));
    assert.equal(isDeparturePast(min("12:30AM"), now, board.next.minutes), true);
    assert.equal(isDeparturePast(min("12:50AM"), now, board.next.minutes), false);
  });

  it("hides the lot callout during the overnight gap", () => {
    const gap = boardAt("to-hotel", min("2:00AM") * 60, 3);
    assert.equal(gap.inGap, true);
    assert.equal(gap.lotCallout, false);
    const stationed = boardAt("to-hotel", min("12:30AM") * 60, 3);
    assert.equal(stationed.inGap, false);
    assert.equal(stationed.lotCallout, true);
    const entrance = boardAt("from-hotel", min("2:00AM") * 60, 3);
    assert.equal(entrance.inGap, true);
    assert.equal(entrance.entranceStationed, false);
  });

  it("points a missed walk at the next bus you can still catch", () => {
    const board = boardAt("to-hotel", min("7:22AM") * 60, 15);
    assert.ok(board.leaveInSec < 0);
    assert.notEqual(board.catchMinutes, min("7:30AM"));
    assert.equal(board.catchMinutes, min("7:45AM"));
  });

  it("shortens the overnight countdown when the clocks spring forward", () => {
    const nowMs = zonedWallToUtc(2026, 3, 7, 23, 55, 0);
    const board = boardAt("to-hotel", min("11:55PM") * 60, 0, nowMs);
    assert.equal(board.next.minutes, min("3:00AM"));
    assert.equal(board.next.tomorrow, true);
    assert.equal(board.next.waitSec, 2 * 3600 + 5 * 60);
  });

  it("lengthens the overnight countdown when the clocks fall back", () => {
    const nowMs = zonedWallToUtc(2026, 10, 31, 23, 55, 0);
    const board = boardAt("to-hotel", min("11:55PM") * 60, 0, nowMs);
    assert.equal(board.next.minutes, min("3:00AM"));
    assert.equal(board.next.waitSec, 4 * 3600 + 5 * 60);
  });
});

describe("location", () => {
  it("uses the hotel stop and the lot pickup as separate pins", () => {
    const apart = haversineMeters(HOTEL.lat, HOTEL.lon, LOT.lat, LOT.lon);
    assert.ok(apart > HOTEL.radiusM + LOT.radiusM);
    assert.equal(zoneFor(80, apart, 15), "at-hotel");
    assert.equal(zoneFor(apart, 40, 15), "at-lot");
    assert.equal(zoneFor(1800, 1200, 30), "away");
    assert.equal(zoneFor(400, 2000, 200), "fuzzy");
    assert.equal(zoneFor(20_000, 21_000, 40), "far");
    assert.equal(resolveDirection("auto", "at-hotel"), "from-hotel");
    assert.equal(resolveDirection("auto", "at-lot"), "to-hotel");
    assert.equal(resolveDirection("auto", "away"), "to-hotel");
    assert.equal(resolveDirection("auto", "far"), "to-hotel");
    assert.equal(resolveDirection("to-hotel", "at-hotel"), "to-hotel");
    assert.equal(geoFailure(1), "denied");
    assert.equal(geoFailure(2), "unavailable");
    assert.equal(geoFailure(3), "timeout");
    const here = haversineMeters(HOTEL.lat, HOTEL.lon, HOTEL.lat, HOTEL.lon);
    assert.equal(here < 1, true);
  });
});

describe("at the stop", () => {
  it("measures from the stop the shown column leaves from", () => {
    assert.equal(stopDistance("to-hotel", 900, 20), 20);
    assert.equal(stopDistance("from-hotel", 30, 900), 30);
  });

  it("zeroes the walk only when the fix, error included, is close to the stop", () => {
    assert.equal(isAtStop(9, 15), true);
    assert.equal(isAtStop(AT_STOP_M, 0), true);
    assert.equal(isAtStop(40, 50), false);
    assert.equal(isAtStop(5, 200), false);
    assert.equal(isAtStop(30, -1), true);
  });
});

describe("sheet date", () => {
  it("reads like the printed sheet", () => {
    assert.equal(formatSheetDate("2026-04-28"), "4.28.26");
    assert.equal(formatSheetDate("2027-11-05"), "11.5.27");
    assert.equal(formatSheetDate(), "4.28.26");
    assert.equal(formatSheetDate("soon"), "soon");
  });
});

describe("map links", () => {
  it("carries only the stop's coordinates", () => {
    const lot = directionsUrl("to-hotel", "google");
    assert.ok(lot.startsWith("https://www.google.com/maps/dir/?api=1&"));
    assert.ok(lot.includes(`destination=${LOT.lat},${LOT.lon}`));
    assert.ok(lot.includes("travelmode=driving"));
    const entrance = directionsUrl("from-hotel", "apple");
    assert.ok(entrance.startsWith("https://maps.apple.com/?"));
    assert.ok(entrance.includes(`daddr=${HOTEL.lat},${HOTEL.lon}`));
    assert.ok(entrance.includes("dirflg=w"));
    for (const url of [lot, entrance, directionsUrl("to-hotel", "apple"), directionsUrl("from-hotel", "google")]) {
      const params = [...new URL(url).searchParams.keys()].sort();
      assert.ok(params.every((key) => ["api", "daddr", "destination", "dirflg", "travelmode"].includes(key)), url);
      assert.equal(/hotel|resort|season|lot|entrance/i.test(new URL(url).search), false, url);
    }
  });
});

describe("deep links", () => {
  it("reads the column from a QR code or shortcut", () => {
    assert.equal(directionFromSearch("?dir=to"), "to-hotel");
    assert.equal(directionFromSearch("?dir=FROM"), "from-hotel");
    assert.equal(directionFromSearch("?x=1&dir=lot"), "to-hotel");
    assert.equal(directionFromSearch("dir=entrance"), "from-hotel");
    assert.equal(directionFromSearch("?dir=from-hotel"), "from-hotel");
    assert.equal(directionFromSearch(""), null);
    assert.equal(directionFromSearch("?dir=sideways"), null);
  });
});
