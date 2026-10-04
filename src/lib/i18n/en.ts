/**
 * English source text. Every other language must match this shape exactly; TypeScript checks it.
 *
 * Notes for translators
 * - Readers are hotel staff checking the employee shuttle on a phone, often in a hurry, often outside.
 *   Keep it short, plain and friendly. Address the reader informally (tú / ou / você).
 * - Times are passed in already formatted ("7:30 AM"). Keep them exactly as given: they match the
 *   printed sheet and the bus. Don't add "h", don't switch to 24-hour time.
 * - "To hotel" = the bus leaves the off-site parking lot and goes to the hotel.
 *   "From hotel" = the bus leaves the hotel's employee entrance and goes to the lot.
 *   Never mix the two up; riders must not misread the column.
 * - Keep the brand "Next Bus Up", the street "Dream Tree Blvd", "Skyline", "P&C", "Safari", "Chrome",
 *   "Apple" and "Android" as they are.
 * - Length limits marked "max N" are in characters and come from tight spots in the layout.
 */
export const en = {
  /** Language name in its own language, shown in the language picker. */
  languageName: "English",
  /** Screen-reader label for the language picker. */
  languagePicker: "Language",

  header: {
    /** Under the "Next Bus Up" title. */
    tagline: "Dream Tree edition",
    /** After the date under the clock, e.g. "Sat · Oct 3 · Orlando time". */
    orlandoTime: "Orlando time",
    /** Shown before the clock is ready. */
    orlando: "Orlando",
    weekdaysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    /** Short date under the clock. Max 14. */
    date: (weekday: string, month: string, day: number) => `${weekday} · ${month} ${day}`,
  },

  /** Text for each column. */
  directions: {
    "to-hotel": {
      /** Big button title, half the phone's width. Max 11. */
      title: "To hotel",
      /** Small line under the button title. Max 22. */
      detail: "Leaves the lot",
      /** Name of the stop, used on its own. */
      stop: "Parking lot",
      /** Under the next departure time. */
      standAt: "Stand at the parking lot",
      /** Small heading over the full list of times. */
      leaves: "Leaves the parking lot",
      /** Under the column switch. */
      column: "This is the parking-lot column. The entrance column is hidden.",
      /** Small uppercase label over the next departure. Max 26. */
      nextBus: "Next bus to hotel",
      /** During the overnight break: when service comes back, and from where. */
      backAt: (time: string) => `Back at ${time} · Parking lot`,
      /** Estimated arrival, about 7 minutes after departure. */
      arrives: (time: string) => `Gets to the hotel around ${time}`,
      /** Same, when the rider can only make a later bus. */
      arrivesOn: (time: string, bus: string) => `Gets to the hotel around ${time} on the ${bus} bus`,
      /** Screen-reader label for the "Map" link. */
      mapLabel: "Directions to the parking lot in your maps app",
      /** Announced to screen readers when it changes. */
      summaryNext: (time: string, minutes: number) =>
        `Next bus ${time} from the parking lot, about ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
      summaryBoarding: (time: string) => `The ${time} is leaving the parking lot now.`,
      summaryGap: (time: string) => `No bus. Service resumes at ${time} from the parking lot.`,
    },
    "from-hotel": {
      title: "From hotel",
      detail: "Leaves the entrance",
      stop: "Employee entrance",
      standAt: "Stand at the employee entrance",
      leaves: "Leaves the employee entrance",
      column: "This is the employee-entrance column. The lot column is hidden.",
      nextBus: "Next bus from hotel",
      backAt: (time: string) => `Back at ${time} · Employee entrance`,
      arrives: (time: string) => `Gets to the lot around ${time}`,
      arrivesOn: (time: string, bus: string) => `Gets to the lot around ${time} on the ${bus} bus`,
      mapLabel: "Directions to the employee entrance in your maps app",
      summaryNext: (time: string, minutes: number) =>
        `Next bus ${time} from the employee entrance, about ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
      summaryBoarding: (time: string) => `The ${time} is leaving the employee entrance now.`,
      summaryGap: (time: string) => `No bus. Service resumes at ${time} from the employee entrance.`,
    },
  },

  switcher: {
    /** Screen-reader label for the two column buttons. */
    label: "Which direction to show",
    /** Under the switch before a column is picked. */
    hint: "Pick one column. The other stays hidden so it can't be misread.",
    /** Screen-reader announcement before a column is picked. */
    summary: "Choose to hotel or from hotel.",
  },

  /** Red warning when a locked column doesn't match where the rider is. */
  mismatch: {
    atHotel: "You're at the hotel stop, but this column is locked to the parking lot.",
    atLot: "You're at the lot pickup, but this column is locked to the employee entrance.",
    notAtHotel: "You're not at the hotel stop, but this column is locked to the employee entrance.",
  },

  /** Shown before a column is picked. */
  pickSide: {
    title: "Pick a side",
    body: "To hotel if you're heading to the shuttle lot. From hotel if you're at the employee entrance on Dream Tree Blvd.",
  },

  hero: {
    /** Small uppercase labels over the time. */
    noBus: "No bus",
    leavingNow: "Leaving now",
    /** Huge text in place of the countdown while the bus is at the stop. Max 7. */
    now: "NOW",
    /** Next to a departure time that falls on the next calendar day. */
    tomorrow: "tomorrow",
    /** During the overnight break, in place of a departure time. Keep the times as they are. */
    gapHours: "1:30–3:00 AM",
    /** Short link text that opens the phone's maps app. Max 8. */
    map: "Map",
    /** Small labels over the countdown. */
    resumesIn: "Service resumes in",
    atStop: "At the stop",
    leavesIn: "Leaves in",
    /** After the arrival estimate. */
    rideNote: (minutes: number) => `about ${minutes} min, can run longer`,
    /** Screen-reader label for the next three departure times. */
    nextThree: "Next three departures",
    /** Under the times: when the previous bus left. */
    lastLeft: (minutesAgo: number, time: string) =>
      minutesAgo <= 1 ? `Last one left 1 min ago · ${time}` : `Last one left ${minutesAgo} min ago · ${time}`,
    /** From midnight to 1:30 AM on the entrance column. */
    stationedTitle: "The lot has no bus until 3:00 AM. This column still leaves from the employee entrance.",
    stationedNext: (time: string) => `Next one is ${time}.`,
  },

  /** One line under the countdown about when to leave. */
  walk: {
    inGap: "Nothing is running in this window.",
    boarding: "It's at the stop.",
    atStop: "You're at the stop.",
    plenty: "Plenty of time before you need to head out.",
    zero: "Walk time is zero — you're counting from the stop.",
    tooLateCatch: (time: string) => `Too late for this one. Next you can catch is ${time}.`,
    tooLate: "Too late for this one.",
    leaveNowNext: (time: string) => `Leave now or you'll miss it. Next is ${time}.`,
    leaveNow: "Leave now or you'll miss it.",
    headOut: (time: string, minutes: number) => `Head out by ${time} · ${minutes} min to the stop`,
    /** Label for the walk-time stepper. */
    label: "Minutes to reach the stop",
    skipped: "Skipped while you're at the stop",
    fewer: "Fewer minutes to the stop",
    more: "More minutes to the stop",
  },

  /** Red boxes with a call button. */
  callout: {
    lotTitle: "The shuttle should be waiting at the resort employee entrance.",
    lotBody: "If you don't see it, call for an employee pickup from the lot.",
    gapTitle: (time: string) => `Nothing is scheduled until ${time}.`,
    gapBody: "If you still need a ride, call dispatch.",
    call: (phone: string) => `Call ${phone}`,
  },

  /** Quiet line under the countdown card. The date is passed in as "4.28.26". */
  sheetDate: (date: string) => `Times published/updated as of ${date}`,

  /** Location card. */
  place: {
    pending: "Checking where you are",
    "at-hotel": "At the hotel stop",
    "at-lot": "At the lot pickup",
    away: "Heading to the lot",
    fuzzy: "Location is fuzzy",
    far: "Coming in to the lot",
    denied: "Location is off",
    timeout: "Location timed out",
    idle: "Not using location",
    unavailable: "No location fix",
    unsupported: "Location unavailable",
  },
  placeDetail: {
    locked: (where: string) => `Column locked · ${where}`,
    lockedNoPin: "Column locked · not using your pin",
    /** The column came from a stop's QR code and lasts for this visit only. */
    fromLink: (where: string) => `From the stop's QR code · ${where}`,
    fromLinkNoPin: "From the stop's QR code · this visit only",
    /** A location reading that is a few minutes old, e.g. "120 ft from the lot pickup · 4 min ago". */
    ago: (where: string, minutes: number) => `${where} · ${minutes} min ago`,
    pending: "Looking for the hotel stop and the lot pickup",
    entranceColumn: (where: string) => `${where} · entrance column`,
    lotColumn: (where: string) => `${where} · parking-lot column`,
    showingEntrance: "Showing buses that leave the entrance",
    showingLot: "Showing buses that leave the lot",
    fuzzy: "Too uncertain to pick a column. Use the switch.",
    denied: "Allow location, or use the switch. It will stick.",
    timeout: "That reading was too slow. Try again, or use the switch.",
    unavailable: "This phone couldn't get a position. Use the switch.",
    idle: "Turn location on if you want the column picked for you.",
    other: "Use the switch. It will stick on this phone.",
    /** Distance is passed in as "120 ft" or "2.4 mi". */
    fromLot: (distance: string) => `${distance} from the lot pickup`,
    fromHotel: (distance: string) => `${distance} from the hotel stop`,
  },
  /** Buttons on the location card. Max 16. */
  placeButtons: {
    followMe: "Follow me",
    tryAgain: "Try again",
    useLocation: "Use my location",
    lock: "Lock",
    /** Small text button under the location card. */
    stopLocation: "Stop using location",
  },

  /** Two buttons side by side. Max 18. */
  tools: {
    keepScreenOn: "Keep screen on",
    screenStaysOn: "Screen stays on",
    chime: "Chime",
    chimeOn: "Chime on",
    rearm: "Tap to re-arm",
    noWakeLock: "This browser won't keep the screen on.",
    noChime: "This browser won't play a chime.",
  },

  plan: {
    label: "Check a different time",
    /** Screen-reader label for the time input. */
    inputLabel: "Pretend the Orlando time is",
    checking: (time: string) => `Checking ${time} instead of now.`,
    back: "Back to now",
  },

  list: {
    title: "Today's times",
    oneColumn: "One column",
    empty: "The full board shows up once a column is selected. Only that column — never both.",
    /** Small uppercase group headings in the list. */
    parts: {
      "after-midnight": "After midnight",
      "early-morning": "Early morning",
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
      night: "Night",
    },
    /** Small uppercase tags at the end of a row. Max 8. */
    now: "Now",
    next: "Next",
    left: "Left",
  },

  how: {
    title: "How the column gets picked",
    withLocation: "With location on, the column follows where you are:",
    atEntrance: "At the employee entrance → From hotel",
    atLot: "At the lot → To hotel",
    elsewhere: "Anywhere else → To hotel, until you lock a column",
    rough: "If your location is too rough to tell, it asks you to pick.",
    locationOff:
      "With location off, tap a column and it sticks on this phone. A stop's QR code shows that column for that visit.",
    privacy: "This board never sends your location anywhere. The map link only carries the stop's position.",
    screenChime:
      "Keep screen on holds the display while you wait at the stop. Chime plays a short tone when a bus is 5 minutes, 2 minutes, and 30 seconds out, and only while this page is open.",
    orlando: (rideMin: number) =>
      `Shown in Orlando time even if your phone is set somewhere else. Nothing runs 1:30–3:00 AM. After 11:50 PM the lot has no departure until 3:00 AM. The ride takes about ${rideMin} minutes and can run longer.`,
  },

  contact: {
    title: "Contact",
    /** Followed by the phone number. */
    dispatch: "Dispatch",
    shoutout: "Shoutout and feedback",
    shoutoutBody: "Skyline form from the bus QR. Put your name, the shuttle time, and what happened. It goes to P&C.",
    appFeedback: "App feedback",
    appFeedbackBody: "About this board, not the bus. Bugs, ideas, or a comment.",
  },

  install: {
    title: "Add it to your phone",
    intro: "Opens full screen, like an app. The countdown is one tap away, and it still works when the lot has a weak signal.",
    apple: "Open this page in Safari. Share, then Add to Home Screen. Chrome on an iPhone cannot set the icon.",
    android: "In Chrome: menu, then Install app.",
  },

  error: {
    title: "Something went wrong",
    unknown: "Unknown error",
    reload: "Reload",
  },
};

export type Messages = typeof en;
