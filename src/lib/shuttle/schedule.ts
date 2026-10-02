/** Printed employee-shuttle times from the April 28, 2026 sheet.
 *  Columns are independent. A blacked-out lot cell at 11:35 AM is omitted
 *  on purpose — only the employee entrance has that departure.
 *  After 11:50 PM the lot column stops until 3:00 AM (shuttle stationed at
 *  the resort employee entrance). Entrance keeps running until 1:30 AM.
 *  Neither side runs 1:30–3:00 AM.
 */

export const SHEET_LABEL = "April 28, 2026";
/** Calendar date of SHEET_LABEL. Used to warn when the sheet is old. */
export const SHEET_ISO = "2026-04-28";
/** Show a warning once the sheet is at least this many days old. */
export const SHEET_STALE_DAYS = 45;
export const DISPATCH_PHONE = "4073136990";
export const DISPATCH_DISPLAY = "407.313.6990";

/** Shoutout and feedback form printed on the bus. One QR. */
export const FEEDBACK_FORM =
  "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=fRDAONGBn0GLcopJHclgPALwRnbt23dBmi9vnjK6eRNUN0wxM09FUFREVjEzQ1IwU1dDSllOTEFBVC4u";

/** Questions about this board. Not the Skyline bus form. */
export const CONTACT_FORM = "https://forms.gle/qV3n5Md74r2ovDji9";

export const TZ = "America/New_York";

/** Employee bus stop at the hotel on Dream Tree Blvd. */
export const HOTEL = {
  lat: 28.4009498,
  lon: -81.5452239,
  /** Covers the grounds around the hotel stop, not the off-site lot. */
  radiusM: 450,
  /** Beyond this from both stops, treat them as coming in to the lot. */
  farM: 9000,
} as const;

/** Parking-lot bus pickup. Plus Code 9FX7+8F8, Lake Buena Vista. */
export const LOT = {
  lat: 28.3982875,
  lon: -81.536296875,
  radiusM: 300,
} as const;

export type Direction = "to-hotel" | "from-hotel";

function parse(list: string): number[] {
  return list
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const match = /^(\d{1,2}):(\d{2})(AM|PM)$/.exec(token);
      if (!match) throw new Error(`Bad shuttle time: ${token}`);
      let hour = Number(match[1]) % 12;
      if (match[3] === "PM") hour += 12;
      return hour * 60 + Number(match[2]);
    });
}

/** Departure from the parking lot — bus is going to the hotel. */
const TO_HOTEL = [
  ...parse(`
    5:00AM 5:15AM 5:20AM 5:30AM 5:45AM 5:50AM
    6:00AM 6:15AM 6:20AM 6:30AM 6:45AM 6:50AM
    7:00AM 7:15AM 7:20AM 7:30AM 7:45AM 7:50AM
    8:00AM 8:15AM 8:20AM 8:30AM 8:45AM
  `),
  ...parse(`
    8:50AM 9:00AM 9:15AM 9:20AM 9:30AM 9:45AM 9:50AM
    10:00AM 10:20AM 10:40AM
    11:00AM 11:20AM 11:40AM 11:45AM
    12:00PM 12:05PM 12:20PM 12:25PM 12:40PM 12:45PM
    1:00PM
  `),
  ...parse(`
    1:05PM 1:15PM 1:30PM 1:35PM 1:45PM
    2:00PM 2:05PM 2:15PM 2:30PM 2:35PM 2:45PM
    3:00PM 3:05PM 3:15PM 3:30PM 3:35PM 3:45PM
    4:00PM 4:05PM
  `),
  ...parse(`
    4:15PM 4:30PM 4:35PM 4:45PM
    5:00PM 5:05PM 5:15PM 5:30PM 5:35PM 5:45PM
    6:00PM 6:05PM 6:15PM 6:30PM 6:35PM 6:45PM
    7:00PM 7:05PM 7:20PM 7:40PM
    8:00PM 8:20PM 8:40PM
  `),
  ...parse(`
    8:45PM 9:00PM 9:05PM 9:20PM 9:25PM 9:40PM 9:45PM
    10:00PM 10:10PM 10:15PM 10:20PM 10:30PM 10:35PM 10:40PM 10:50PM 10:55PM
    11:00PM 11:10PM 11:15PM 11:20PM 11:30PM 11:35PM
  `),
  ...parse(`
    11:40PM 11:50PM
    3:00AM 3:30AM 4:00AM 4:40AM
  `),
];

/** Departure from the FS employee entrance — bus is leaving the hotel. */
const FROM_HOTEL = [
  ...parse(`
    5:00AM 5:05AM 5:15AM 5:30AM 5:35AM 5:45AM
    6:00AM 6:05AM 6:15AM 6:30AM 6:35AM 6:45AM
    7:00AM 7:05AM 7:15AM 7:30AM 7:35AM 7:45AM
    8:00AM 8:05AM 8:15AM 8:30AM 8:35AM
  `),
  ...parse(`
    8:45AM 9:00AM 9:05AM 9:15AM 9:30AM 9:35AM 9:45AM
    10:10AM 10:30AM 10:50AM
    11:10AM 11:30AM 11:35AM 11:50AM 11:55AM
    12:10PM 12:15PM 12:30PM 12:35PM 12:50PM 12:55PM
    1:00PM
  `),
  ...parse(`
    1:15PM 1:20PM 1:30PM 1:45PM 1:50PM
    2:00PM 2:15PM 2:20PM 2:30PM 2:45PM 2:50PM
    3:00PM 3:15PM 3:20PM 3:35PM 3:45PM 3:50PM
    4:00PM 4:15PM
  `),
  ...parse(`
    4:20PM 4:30PM 4:45PM 4:50PM
    5:00PM 5:15PM 5:20PM 5:30PM 5:45PM 5:50PM
    6:00PM 6:15PM 6:20PM 6:30PM 6:45PM 6:50PM
    7:10PM 7:30PM 7:50PM
    8:10PM 8:30PM 8:35PM 8:50PM
  `),
  ...parse(`
    8:55PM 9:10PM 9:15PM 9:30PM 9:35PM 9:50PM
    10:00PM 10:05PM 10:10PM 10:20PM 10:25PM 10:30PM 10:40PM 10:45PM 10:50PM
    11:00PM 11:05PM 11:10PM 11:20PM 11:25PM 11:30PM 11:40PM
  `),
  ...parse(`
    11:50PM
    12:00AM 12:15AM 12:30AM 12:50AM
    1:10AM 1:30AM
    3:15AM 3:45AM 4:15AM 4:50AM
  `),
];

function uniqSorted(times: number[], label: string): number[] {
  const sorted = [...times].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1]) {
      throw new Error(`Duplicate ${label} departure at minute ${sorted[i]}`);
    }
  }
  return sorted;
}

export const DEPARTURES: Record<Direction, number[]> = {
  "to-hotel": uniqSorted(TO_HOTEL, "lot"),
  "from-hotel": uniqSorted(FROM_HOTEL, "entrance"),
};

export const DIRECTION_COPY: Record<
  Direction,
  { title: string; stop: string; leaves: string; column: string }
> = {
  "to-hotel": {
    title: "To hotel",
    stop: "Parking lot",
    leaves: "Leaves the parking lot",
    column: "This is the parking-lot column. The entrance column is hidden.",
  },
  "from-hotel": {
    title: "From hotel",
    stop: "Employee entrance",
    leaves: "Leaves the employee entrance",
    column: "This is the employee-entrance column. The lot column is hidden.",
  },
};
