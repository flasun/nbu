import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEPARTURES, HOTEL, LOT } from "./schedule.ts";
import {
  boardAt,
  formatClock,
  formatCountdown,
  haversineMeters,
  resolveDirection,
  zoneFor,
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
    assert.equal(lot.lotCallout, true);
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
    const here = haversineMeters(HOTEL.lat, HOTEL.lon, HOTEL.lat, HOTEL.lon);
    assert.equal(here < 1, true);
  });
});
