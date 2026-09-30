import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as MapPin, c as Hotel, d as Bell, f as BellOff, i as Minus, l as Clock, n as Plus, o as Lock, r as Phone, s as LockOpen, u as BusFront } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D89ttpRL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Printed employee-shuttle times from the April 28, 2026 sheet.
*  Columns are independent. A blacked-out lot cell at 11:35 AM is omitted
*  on purpose — only the employee entrance has that departure.
*  After 11:50 PM the lot column stops until 3:00 AM (shuttle stationed at
*  the resort employee entrance). Entrance keeps running until 1:30 AM.
*  Neither side runs 1:30–3:00 AM.
*/
var SHEET_LABEL = "April 28, 2026";
var DISPATCH_PHONE = "4073136990";
var DISPATCH_DISPLAY = "407.313.6990";
var TZ = "America/New_York";
/** Employee bus stop at the hotel on Dream Tree Blvd. */
var HOTEL = {
	lat: 28.4009498,
	lon: -81.5452239,
	/** Covers the grounds around the hotel stop, not the off-site lot. */
	radiusM: 450,
	/** Beyond this from both stops, treat them as coming in to the lot. */
	farM: 9e3
};
/** Parking-lot bus pickup. Plus Code 9FX7+8F8, Lake Buena Vista. */
var LOT = {
	lat: 28.3982875,
	lon: -81.536296875,
	radiusM: 300
};
function parse(list) {
	return list.trim().split(/\s+/).filter(Boolean).map((token) => {
		const match = /^(\d{1,2}):(\d{2})(AM|PM)$/.exec(token);
		if (!match) throw new Error(`Bad shuttle time: ${token}`);
		let hour = Number(match[1]) % 12;
		if (match[3] === "PM") hour += 12;
		return hour * 60 + Number(match[2]);
	});
}
/** Departure from the parking lot — bus is going to the hotel. */
var TO_HOTEL = [
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
  `)
];
/** Departure from the FS employee entrance — bus is leaving the hotel. */
var FROM_HOTEL = [
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
  `)
];
function uniqSorted(times, label) {
	const sorted = [...times].sort((a, b) => a - b);
	for (let i = 1; i < sorted.length; i++) if (sorted[i] === sorted[i - 1]) throw new Error(`Duplicate ${label} departure at minute ${sorted[i]}`);
	return sorted;
}
var DEPARTURES = {
	"to-hotel": uniqSorted(TO_HOTEL, "lot"),
	"from-hotel": uniqSorted(FROM_HOTEL, "entrance")
};
var DIRECTION_COPY = {
	"to-hotel": {
		title: "To hotel",
		stop: "Parking lot",
		leaves: "Leaves the parking lot",
		column: "This is the parking-lot column. The entrance column is hidden."
	},
	"from-hotel": {
		title: "From hotel",
		stop: "Employee entrance",
		leaves: "Leaves the employee entrance",
		column: "This is the employee-entrance column. The lot column is hidden."
	}
};
var LONG_WAIT_SEC = 2400;
function readOrlando(date) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: TZ,
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
		weekday: "long",
		month: "short",
		day: "numeric"
	}).formatToParts(date);
	const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
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
		clock: `${h12}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")} ${ap}`
	};
}
function formatClock(minutes) {
	const wrapped = (minutes % 1440 + 1440) % 1440;
	const hour24 = Math.floor(wrapped / 60);
	const minute = wrapped % 60;
	const h12 = hour24 % 12 || 12;
	const ap = hour24 >= 12 ? "PM" : "AM";
	return `${h12}:${String(minute).padStart(2, "0")} ${ap}`;
}
function formatCountdown(waitSec) {
	const total = Math.max(0, Math.floor(waitSec));
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor(total % 3600 / 60);
	const seconds = total % 60;
	const mm = String(minutes).padStart(2, "0");
	const ss = String(seconds).padStart(2, "0");
	if (hours > 0) return `${hours}:${mm}:${ss}`;
	return `${mm}:${ss}`;
}
function formatDistance(meters) {
	const feet = meters * 3.280839895;
	if (feet < 5280) return `${Math.max(30, Math.round(feet / 10) * 10)} ft`;
	const miles = meters / 1609.344;
	return `${miles >= 10 ? Math.round(miles) : miles.toFixed(1)} mi`;
}
function haversineMeters(lat1, lon1, lat2, lon2) {
	const R = 6371e3;
	const p1 = lat1 * Math.PI / 180;
	const p2 = lat2 * Math.PI / 180;
	const dp = (lat2 - lat1) * Math.PI / 180;
	const dl = (lon2 - lon1) * Math.PI / 180;
	const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
	return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
function ring(distanceM, accuracyM, radiusM) {
	const nearest = Math.max(0, distanceM - accuracyM);
	if (distanceM + accuracyM < radiusM) return "inside";
	if (nearest > radiusM) return "outside";
	return "fuzzy";
}
function zoneFor(hotelM, lotM, accuracyM) {
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
function resolveDirection(mode, place) {
	if (mode === "to-hotel" || mode === "from-hotel") return mode;
	if (place === "at-hotel") return "from-hotel";
	if (place === "at-lot" || place === "away" || place === "far") return "to-hotel";
	return null;
}
function hitsAround(times, nowSec) {
	const hits = [];
	for (const day of [0, 1]) for (const minutes of times) {
		const waitSec = day * 86400 + minutes * 60 - nowSec;
		if (waitSec < -45) continue;
		if (waitSec > 86400) continue;
		hits.push({
			minutes,
			waitSec,
			boarding: waitSec < 0,
			tomorrow: day === 1 && minutes * 60 <= nowSec
		});
	}
	hits.sort((a, b) => a.waitSec - b.waitSec);
	return hits;
}
function boardAt(direction, nowSec, walkMin) {
	const now = (nowSec % 86400 + 86400) % 86400;
	const times = DEPARTURES[direction];
	const hits = hitsAround(times, now);
	const next = hits[0];
	if (!next) throw new Error("Schedule has no departures");
	const following = hits.slice(1, 4);
	let last = null;
	for (const day of [-1, 0]) for (const minutes of times) {
		const ago = now - (day * 86400 + minutes * 60);
		if (ago > 45 && (last === null || ago < last.agoSec)) last = {
			minutes,
			agoSec: ago
		};
	}
	if (last && last.agoSec > 2700) last = null;
	const inGap = now >= (direction === "from-hotel" ? 5445 : 5400) && now < 10800;
	const lotCallout = direction === "to-hotel" && !next.boarding && next.minutes === 180 && next.waitSec >= LONG_WAIT_SEC;
	const entranceStationed = direction === "from-hotel" && now < 5400;
	let progress = null;
	if (!next.boarding && next.waitSec < LONG_WAIT_SEC && last) {
		const span = last.agoSec + next.waitSec;
		if (span > 0 && span < LONG_WAIT_SEC) progress = Math.min(1, Math.max(0, last.agoSec / span));
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
		leaveInSec: next.boarding ? 0 : next.waitSec - walkMin * 60
	};
}
function daypart(minutes) {
	if (minutes < 300) return "Early morning";
	if (minutes < 720) return "Morning";
	if (minutes < 1020) return "Afternoon";
	if (minutes < 1260) return "Evening";
	return "Night";
}
var PREFS_KEY = "bus-up-v1";
var DEFAULT_PREFS = {
	mode: "auto",
	walkMin: 3,
	chime: false,
	awake: false
};
var focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-ink";
function loadPrefs() {
	try {
		const raw = localStorage.getItem(PREFS_KEY);
		if (!raw) return DEFAULT_PREFS;
		const parsed = JSON.parse(raw);
		const mode = parsed.mode === "to-hotel" || parsed.mode === "from-hotel" || parsed.mode === "auto" ? parsed.mode : "auto";
		const walkMin = Number(parsed.walkMin);
		return {
			mode,
			walkMin: Number.isFinite(walkMin) ? Math.min(15, Math.max(0, Math.round(walkMin))) : 3,
			chime: Boolean(parsed.chime),
			awake: Boolean(parsed.awake)
		};
	} catch {
		return DEFAULT_PREFS;
	}
}
function useOrlandoNow() {
	const [now, setNow] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const tick = () => setNow(readOrlando(/* @__PURE__ */ new Date()));
		tick();
		const id = window.setInterval(tick, 1e3);
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
function beep(ctx) {
	const start = ctx.currentTime;
	const gain = ctx.createGain();
	gain.gain.setValueAtTime(1e-4, start);
	gain.gain.exponentialRampToValueAtTime(.05, start + .02);
	gain.gain.exponentialRampToValueAtTime(1e-4, start + .22);
	gain.connect(ctx.destination);
	for (const [freq, at] of [[740, 0], [980, .12]]) {
		const osc = ctx.createOscillator();
		osc.type = "sine";
		osc.frequency.value = freq;
		osc.connect(gain);
		osc.start(start + at);
		osc.stop(start + at + .12);
	}
}
function agoLabel(seconds) {
	const minutes = Math.round(seconds / 60);
	if (minutes <= 1) return "1 min ago";
	return `${minutes} min ago`;
}
function walkLine(board) {
	if (board.inGap) return {
		late: false,
		text: "Nothing is running in this window."
	};
	if (board.next.boarding) return {
		late: false,
		text: "It's at the stop."
	};
	if (board.next.waitSec > 1800) return {
		late: false,
		text: "Plenty of time before you need to head out."
	};
	if (board.walkMin === 0) return {
		late: false,
		text: "Walk time is zero — you're counting from the stop."
	};
	if (board.leaveInSec < 60) {
		const after = board.following[0];
		return {
			late: true,
			text: after ? `Leave now or you'll miss it. Next is ${formatClock(after.minutes)}.` : "Leave now or you'll miss it."
		};
	}
	return {
		late: false,
		text: `Head out by ${formatClock(board.next.minutes - board.walkMin)} · ${board.walkMin} min to the stop`
	};
}
function placeTitle(place) {
	switch (place) {
		case "pending": return "Checking where you are";
		case "at-hotel": return "At the hotel stop";
		case "at-lot": return "At the lot pickup";
		case "away": return "Heading to the lot";
		case "fuzzy": return "Location is fuzzy";
		case "far": return "Coming in to the lot";
		case "denied": return "Location is off";
		default: return "Location unavailable";
	}
}
function ShuttleBoard() {
	const live = useOrlandoNow();
	const [prefs, setPrefs] = (0, import_react.useState)(DEFAULT_PREFS);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [place, setPlace] = (0, import_react.useState)("pending");
	const [fix, setFix] = (0, import_react.useState)(null);
	const [plan, setPlan] = (0, import_react.useState)("");
	const [wakeNote, setWakeNote] = (0, import_react.useState)(null);
	const nextRow = (0, import_react.useRef)(null);
	const listRef = (0, import_react.useRef)(null);
	const audioRef = (0, import_react.useRef)(null);
	const prevWait = (0, import_react.useRef)(null);
	const wakeLock = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		setPrefs(loadPrefs());
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
	}, [prefs, hydrated]);
	(0, import_react.useEffect)(() => {
		if (!("geolocation" in navigator)) {
			setPlace("unsupported");
			return;
		}
		const id = navigator.geolocation.watchPosition((pos) => {
			const hotelM = haversineMeters(pos.coords.latitude, pos.coords.longitude, HOTEL.lat, HOTEL.lon);
			const lotM = haversineMeters(pos.coords.latitude, pos.coords.longitude, LOT.lat, LOT.lon);
			const accuracyM = pos.coords.accuracy;
			const zone = zoneFor(hotelM, lotM, accuracyM);
			setFix({
				zone,
				hotelM,
				lotM,
				accuracyM
			});
			setPlace(zone);
		}, () => {
			setFix(null);
			setPlace("denied");
		}, {
			enableHighAccuracy: true,
			maximumAge: 1e4,
			timeout: 15e3
		});
		return () => navigator.geolocation.clearWatch(id);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!prefs.awake || !("wakeLock" in navigator)) {
			wakeLock.current?.release();
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
		acquire();
		const onVis = () => {
			if (document.visibilityState === "visible") acquire();
		};
		document.addEventListener("visibilitychange", onVis);
		return () => {
			cancelled = true;
			document.removeEventListener("visibilitychange", onVis);
			wakeLock.current?.release();
			wakeLock.current = null;
		};
	}, [prefs.awake]);
	const direction = resolveDirection(prefs.mode, place);
	const planMin = /^(\d{2}):(\d{2})$/.exec(plan);
	const viewSec = planMin ? Number(planMin[1]) * 3600 + Number(planMin[2]) * 60 : live?.seconds ?? null;
	const board = direction !== null && viewSec !== null ? boardAt(direction, viewSec, prefs.walkMin) : null;
	(0, import_react.useEffect)(() => {
		if (!board || plan || !prefs.chime || !audioRef.current) {
			prevWait.current = board?.next.waitSec ?? null;
			return;
		}
		const wait = board.next.waitSec;
		const prev = prevWait.current;
		prevWait.current = wait;
		if (prev == null || board.next.boarding) return;
		if ([
			300,
			120,
			30
		].filter((mark) => prev > mark && wait <= mark).length) beep(audioRef.current);
	}, [
		board,
		plan,
		prefs.chime
	]);
	(0, import_react.useEffect)(() => {
		const row = nextRow.current;
		const list = listRef.current;
		if (!row || !list) return;
		const top = row.offsetTop - list.clientHeight / 2 + row.clientHeight / 2;
		list.scrollTo({ top: Math.max(0, top) });
	}, [
		direction,
		board?.next.minutes,
		board?.next.boarding,
		plan
	]);
	const summary = summaryText(direction, board);
	const copy = direction ? DIRECTION_COPY[direction] : null;
	const mismatch = prefs.mode !== "auto" && (place === "at-hotel" && direction === "to-hotel" || place === "at-lot" && direction === "from-hotel" || place === "away" && direction === "from-hotel" || place === "far" && direction === "from-hotel");
	function choose(next) {
		setPrefs((prev) => ({
			...prev,
			mode: next
		}));
	}
	function followMe() {
		setPrefs((prev) => ({
			...prev,
			mode: "auto"
		}));
	}
	function armChime() {
		const AudioCtx = window.AudioContext;
		if (!audioRef.current) audioRef.current = new AudioCtx();
		audioRef.current.resume();
		setPrefs((prev) => ({
			...prev,
			chime: !prev.chime
		}));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-dvh w-full max-w-5xl px-4 pt-5 pb-12 md:px-8 md:pt-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "sr-only",
				children: "Next Bus Up, Dream Tree shuttle countdown"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "sr-only",
				"aria-live": "polite",
				children: summary
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-5 flex items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-4xl leading-none font-semibold tracking-wide text-ivory",
					children: "NBU"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-mute",
					children: "Dream Tree shuttle"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-right text-sm text-mute",
					children: [SHEET_LABEL, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-0.5 block",
						children: "printed sheet"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-4 rounded-card border border-line bg-panel px-5 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-5xl leading-none font-semibold tracking-wide text-ivory tabular-nums md:text-6xl",
						"data-testid": "clock",
						children: live ? live.clock : "––:––:––"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 flex items-center gap-2 text-sm text-mute",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "live-dot inline-block size-2 rounded-full bg-signal",
								"aria-hidden": "true"
							}),
							live ? `${live.weekday} · ${live.dateLabel}` : "Orlando",
							" · Orlando time"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm text-pretty text-ivory",
						children: [
							"Schedule as of Apr 28, 2026 — not a live tracker.",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: `tel:+1${DISPATCH_PHONE}`,
								className: `underline ${focusRing}`,
								children: "Call dispatch"
							}),
							" ",
							"if this looks wrong."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid items-start gap-4 lg:grid-cols-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							role: "radiogroup",
							"aria-label": "Which direction to show",
							className: "grid grid-cols-2 gap-1 rounded-card bg-panel-2 p-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DirectionButton, {
								active: direction === "to-hotel",
								tone: "lot",
								onClick: () => choose("to-hotel"),
								title: "To hotel",
								detail: "Leaves the lot",
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hotel, {
									className: "size-5",
									"aria-hidden": "true"
								}),
								testId: "direction-to"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DirectionButton, {
								active: direction === "from-hotel",
								tone: "gate",
								onClick: () => choose("from-hotel"),
								title: "From hotel",
								detail: "Leaves the entrance",
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BusFront, {
									className: "size-5",
									"aria-hidden": "true"
								}),
								testId: "direction-from"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 px-1 text-sm text-mute",
							children: copy ? copy.column : "Pick one column. The other stays hidden so it can't be misread."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-3 space-y-1 px-1 text-sm text-ivory",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "At the employee entrance → From hotel" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "At the lot → To hotel" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Anywhere else → assumes lot until you lock it" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex items-start justify-between gap-3 rounded-card border border-line bg-panel px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
									className: "mt-0.5 size-5 shrink-0 text-signal",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium text-ivory",
										children: placeTitle(place)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-mute",
										children: placeDetail(place, prefs.mode, fix)
									})]
								})]
							}), prefs.mode === "auto" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: !direction,
								onClick: () => direction && choose(direction),
								className: `inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-sm text-ivory disabled:opacity-40 ${focusRing}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
									className: "size-4",
									"aria-hidden": "true"
								}), "Lock"]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: followMe,
								className: `inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-signal px-3 text-sm font-semibold text-signal-ink ${focusRing}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockOpen, {
									className: "size-4",
									"aria-hidden": "true"
								}), "Follow me"]
							})]
						}),
						mismatch ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 px-1 text-sm text-alert",
							children: place === "at-hotel" ? "You're at the hotel stop, but this column is locked to the parking lot." : place === "at-lot" ? "You're at the lot pickup, but this column is locked to the employee entrance." : "You're not at the hotel stop, but this column is locked to the employee entrance."
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-4 rounded-card border border-line bg-panel px-5 py-5",
							"aria-live": "off",
							children: [
								plan ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-panel-2 px-3 py-2 text-sm text-ivory",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"Checking ",
										formatPlan(plan),
										" instead of now."
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setPlan(""),
										className: `min-h-11 rounded-full px-3 font-medium text-signal ${focusRing}`,
										children: "Back to now"
									})]
								}) : null,
								!board || !copy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-3xl leading-none font-semibold tracking-wide text-ivory",
									children: "Pick a side"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 max-w-sm text-pretty text-mute",
									children: "To hotel if you're heading to the shuttle lot. From hotel if you're at the employee entrance on Dream Tree Blvd."
								})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hero, {
									board,
									copy
								}),
								board ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-5 flex items-center justify-between gap-3 border-t border-line pt-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-mute",
										children: "Minutes to reach the stop"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepButton, {
												label: "Fewer minutes to the stop",
												onClick: () => setPrefs((prev) => ({
													...prev,
													walkMin: Math.max(0, prev.walkMin - 1)
												})),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
													className: "size-4",
													"aria-hidden": "true"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "w-8 text-center font-display text-2xl leading-none font-semibold tabular-nums",
												children: prefs.walkMin
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepButton, {
												label: "More minutes to the stop",
												onClick: () => setPrefs((prev) => ({
													...prev,
													walkMin: Math.min(15, prev.walkMin + 1)
												})),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
													className: "size-4",
													"aria-hidden": "true"
												})
											})
										]
									})]
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToolButton, {
								pressed: prefs.awake,
								onClick: () => {
									if (!("wakeLock" in navigator)) {
										setWakeNote("This browser won't keep the screen on.");
										return;
									}
									setPrefs((prev) => ({
										...prev,
										awake: !prev.awake
									}));
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
									className: "size-4",
									"aria-hidden": "true"
								}), prefs.awake ? "Screen stays on" : "Keep screen on"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToolButton, {
								pressed: prefs.chime,
								onClick: armChime,
								children: [prefs.chime ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, {
									className: "size-4",
									"aria-hidden": "true"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, {
									className: "size-4",
									"aria-hidden": "true"
								}), prefs.chime ? "Chime on" : "Chime"]
							})]
						}),
						wakeNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-mute",
							children: wakeNote
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-3 flex min-h-11 items-center justify-between gap-3 rounded-card border border-line bg-panel px-4 py-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-mute",
								children: "Check a different time"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "time",
								value: plan,
								onChange: (event) => setPlan(event.target.value),
								className: `min-h-11 bg-transparent text-ivory ${focusRing}`,
								"aria-label": "Pretend the Orlando time is"
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "lg:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-baseline justify-between px-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-medium text-ivory",
							children: copy ? copy.stop : "Today's board"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-mute",
							children: copy ? copy.leaves : "One column"
						})]
					}), direction && board ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoardList, {
						direction,
						nowSec: viewSec ?? 0,
						next: board.next,
						listRef,
						nextRow
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-card border border-line bg-panel px-4 py-6 text-sm text-mute",
						children: "The full board shows up once a column is selected. Only that column — never both."
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "mt-6 rounded-card border border-line bg-panel px-4 py-3 text-sm text-mute",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: `cursor-pointer font-medium text-ivory ${focusRing}`,
					children: "How the column gets picked"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 space-y-2 text-pretty",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "At the employee entrance, this shows From hotel. At the lot, To hotel. Anywhere else assumes the lot until you lock a column." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Keep screen on holds the display while you wait at the stop. Chime plays a short tone when a bus is 5 minutes, 2 minutes, and 30 seconds out, and only while this page is open." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"Times are the ",
							SHEET_LABEL,
							" sheet, shown in Orlando time even if your phone is set somewhere else. This is not a live tracker of the bus itself. Nothing runs 1:30–3:00 AM. After 11:50 PM the lot has no departure until 3:00 AM."
						] })
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-sm text-mute",
				children: [
					"Dispatch",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: `tel:+1${DISPATCH_PHONE}`,
						className: `text-ivory underline ${focusRing}`,
						children: DISPATCH_DISPLAY
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-xs text-mute",
				children: "Built with Grok"
			})
		]
	});
}
function columnTone(direction) {
	if (direction === "to-hotel") return {
		text: "text-lot",
		bg: "bg-lot",
		ink: "text-lot-ink",
		dot: "bg-lot"
	};
	return {
		text: "text-gate",
		bg: "bg-gate",
		ink: "text-gate-ink",
		dot: "bg-gate"
	};
}
function DirectionButton({ active, tone, onClick, title, detail, icon, testId }) {
	const filled = tone === "lot" ? "bg-lot text-lot-ink" : "bg-gate text-gate-ink";
	const detailOn = tone === "lot" ? "text-lot-ink" : "text-gate-ink";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		role: "radio",
		"aria-checked": active,
		"data-testid": testId,
		onClick,
		className: `flex min-h-16 flex-col items-start justify-center rounded-xl px-3 py-2 text-left ${focusRing} ${active ? filled : "text-ivory"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center gap-2 font-display text-2xl leading-none font-semibold tracking-wide",
			children: [icon, title]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `mt-1 text-xs ${active ? detailOn : "text-mute"}`,
			children: detail
		})]
	});
}
function Hero({ board, copy }) {
	const late = walkLine(board);
	const hot = !board.next.boarding && board.next.waitSec < 60 && !board.inGap;
	const tone = columnTone(board.direction);
	const eyebrow = board.inGap ? "No bus" : board.next.boarding ? "Leaving now" : `Next bus ${copy.title.toLowerCase()}`;
	const countdown = board.next.boarding ? "NOW" : formatCountdown(board.next.waitSec);
	const countLabel = board.inGap ? "Service resumes in" : board.next.boarding ? "At the stop" : "Leaves in";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: `flex items-center gap-2 text-sm font-medium tracking-wide uppercase ${tone.text}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `live-dot inline-block size-2 rounded-full ${tone.dot}`,
				"aria-hidden": "true"
			}), eyebrow]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 font-display text-5xl leading-none font-semibold tracking-wide text-ivory",
			children: board.inGap ? "1:30–3:00 AM" : formatClock(board.next.minutes)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-mute",
			children: board.inGap ? `Back at ${formatClock(board.next.minutes)} · ${copy.stop}` : `Stand at the ${copy.stop.toLowerCase()}`
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-5 text-sm text-mute",
			children: countLabel
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			"data-testid": "countdown",
			className: `font-display leading-none font-semibold tracking-wide tabular-nums ${countdown.length > 5 ? "text-6xl" : "text-7xl"} ${hot || board.next.boarding ? tone.text : "text-ivory"}`,
			children: countdown
		}),
		board.progress !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 h-1.5 overflow-hidden rounded-full bg-panel-2",
			"aria-hidden": "true",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `h-full w-full origin-left ${tone.bg}`,
				style: { transform: `scaleX(${board.progress})` }
			})
		}) : null,
		(board.inGap || board.lotCallout || board.entranceStationed) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Callout, {
			gap: board.inGap,
			resume: formatClock(board.next.minutes)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: `mt-4 text-sm ${late.late ? "text-alert" : "text-ivory"}`,
			children: late.text
		}),
		board.following.length > 0 && !board.inGap ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 flex flex-wrap gap-2",
			"aria-label": "Next three departures",
			children: board.following.map((hit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "rounded-full border border-line px-3 py-1 font-display text-xl leading-none font-semibold tracking-wide text-ivory",
				children: formatClock(hit.minutes)
			}, `${hit.minutes}-${hit.waitSec}`))
		}) : null,
		board.last && !board.next.boarding && !board.inGap ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-sm text-mute",
			children: [
				"Last one left ",
				agoLabel(board.last.agoSec),
				" · ",
				formatClock(board.last.minutes)
			]
		}) : null
	] });
}
function Callout({ gap, resume }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "mt-4 rounded-2xl border border-alert px-4 py-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium text-ivory",
				children: gap ? `Nothing is scheduled until ${resume}.` : "The shuttle should be waiting at the resort employee entrance."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-pretty text-mute",
				children: "If you don't see it, call for an employee pickup from the lot."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: `tel:+1${DISPATCH_PHONE}`,
				className: `mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-signal px-4 text-sm font-semibold text-signal-ink ${focusRing}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
						className: "size-4",
						"aria-hidden": "true"
					}),
					"Call ",
					DISPATCH_DISPLAY
				]
			})
		]
	});
}
function BoardList({ direction, nowSec, next, listRef, nextRow }) {
	const times = DEPARTURES[direction];
	const tone = columnTone(direction);
	const groups = [];
	for (const time of times) {
		const label = daypart(time);
		const last = groups[groups.length - 1];
		if (!last || last.label !== label) groups.push({
			label,
			times: [time]
		});
		else last.times.push(time);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		ref: listRef,
		className: "relative max-h-96 overflow-auto rounded-card border border-line bg-panel",
		children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "list-none",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "sticky top-0 bg-panel-2 px-4 py-2 text-xs tracking-wide text-mute uppercase",
				children: group.label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: group.times.map((time) => {
				const isNext = time === next.minutes;
				const past = time * 60 + 45 < nowSec && !isNext;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					ref: isNext ? nextRow : void 0,
					className: `flex items-center justify-between border-t border-line px-4 py-2 ${isNext ? `${tone.bg} ${tone.ink}` : past ? "text-mute" : "text-ivory"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-2xl leading-none font-semibold tracking-wide tabular-nums",
						children: formatClock(time)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs tracking-wide uppercase",
						children: isNext ? next.boarding ? "Now" : "Next" : past ? "Left" : ""
					})]
				}, time);
			}) })]
		}, group.label))
	});
}
function ToolButton({ pressed, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-pressed": pressed,
		onClick,
		className: `inline-flex min-h-11 items-center justify-center gap-2 rounded-card border px-3 text-sm ${focusRing} ${pressed ? "border-signal bg-signal text-signal-ink" : "border-line bg-panel text-ivory"}`,
		children
	});
}
function StepButton({ label, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		onClick,
		className: `inline-flex size-11 items-center justify-center rounded-full border border-line text-ivory ${focusRing}`,
		children
	});
}
function placeDetail(place, mode, fix) {
	const where = fix ? pinDistance(fix) : null;
	if (mode !== "auto") return where ? `Column locked · ${where}` : "Column locked · not using your pin";
	switch (place) {
		case "pending": return "Looking for the hotel stop and the lot pickup";
		case "at-hotel": return where ? `${where} · entrance column` : "Showing buses that leave the entrance";
		case "at-lot": return where ? `${where} · parking-lot column` : "Showing buses that leave the lot";
		case "away": return where ? `${where} · parking-lot column` : "Showing buses that leave the lot";
		case "fuzzy": return "Too uncertain to pick a column. Use the switch.";
		case "far": return where ? `${where} · parking-lot column` : "Showing buses that leave the lot";
		case "denied": return "Allow location, or use the switch. It will stick.";
		default: return "Use the switch. It will stick on this phone.";
	}
}
function pinDistance(fix) {
	if (fix.zone === "at-lot" || fix.zone === "away" || fix.zone === "far") return `${formatDistance(fix.lotM)} from the lot pickup`;
	if (fix.zone === "at-hotel") return `${formatDistance(fix.hotelM)} from the hotel stop`;
	return fix.lotM <= fix.hotelM ? `${formatDistance(fix.lotM)} from the lot pickup` : `${formatDistance(fix.hotelM)} from the hotel stop`;
}
function summaryText(direction, board) {
	if (!direction || !board) return "Choose to hotel or from hotel.";
	const stop = DIRECTION_COPY[direction].stop;
	if (board.inGap) return `No bus. Service resumes at ${formatClock(board.next.minutes)} from the ${stop}.`;
	if (board.next.boarding) return `${formatClock(board.next.minutes)} is leaving now from the ${stop}.`;
	const minutes = Math.max(0, Math.ceil(board.next.waitSec / 60));
	return `Next bus ${formatClock(board.next.minutes)} from the ${stop}, about ${minutes} minutes.`;
}
function formatPlan(value) {
	const match = /^(\d{2}):(\d{2})$/.exec(value);
	if (!match) return value;
	return formatClock(Number(match[1]) * 60 + Number(match[2]));
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShuttleBoard, {});
}
//#endregion
export { Home as component };
