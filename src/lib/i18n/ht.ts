import type { Messages } from "./en.ts";

/** Haitian Creole (Kreyòl ayisyen), standard IPN spelling, informal "ou"; everyday Florida Kreyòl ("bis", "pakin", "dispatch"). */
export const ht: Messages = {
  languageName: "Kreyòl ayisyen",
  languagePicker: "Lang",

  header: {
    tagline: "Edisyon Dream Tree",
    orlandoTime: "lè Orlando",
    orlando: "Orlando",
    weekdaysShort: ["dim", "len", "mad", "mèk", "jed", "van", "sam"],
    monthsShort: ["jan", "fev", "mas", "avr", "me", "jen", "jiy", "out", "sep", "okt", "nov", "des"],
    date: (weekday: string, month: string, day: number) => `${weekday} · ${day} ${month}`,
  },

  directions: {
    "to-hotel": {
      title: "Ale otèl",
      detail: "Pati nan pakin nan",
      stop: "Pakin nan",
      standAt: "Tann nan pakin nan",
      leaves: "Pati nan pakin nan",
      column: "Sa a se kolòn pakin nan. Kolòn antre a kache.",
      nextBus: "Pwochen bis ki ale otèl",
      backAt: (time: string) => `Retounen a ${time} · Pakin nan`,
      arrives: (time: string) => `Rive otèl la vè ${time}`,
      arrivesOn: (time: string, bus: string) => `Rive otèl la vè ${time} si w pran bis ${bus}`,
      mapLabel: "Wout pou ale nan pakin nan, sou aplikasyon kat ou",
      summaryNext: (time: string, minutes: number) =>
        `Pwochen bis la pati a ${time} nan pakin nan. Rete anviwon ${minutes} minit.`,
      summaryBoarding: (time: string) => `Bis ${time} ap pati nan pakin nan kounye a.`,
      summaryGap: (time: string) => `Pa gen bis. Sèvis la rekòmanse a ${time} nan pakin nan.`,
    },
    "from-hotel": {
      title: "Soti otèl",
      detail: "Pati nan antre a",
      stop: "Antre anplwaye yo",
      standAt: "Tann devan antre anplwaye yo",
      leaves: "Pati nan antre anplwaye yo",
      column: "Sa a se kolòn antre anplwaye yo. Kolòn pakin nan kache.",
      nextBus: "Pwochen bis ki soti otèl",
      backAt: (time: string) => `Retounen a ${time} · Antre anplwaye yo`,
      arrives: (time: string) => `Rive nan pakin nan vè ${time}`,
      arrivesOn: (time: string, bus: string) => `Rive nan pakin nan vè ${time} si w pran bis ${bus}`,
      mapLabel: "Wout pou ale nan antre anplwaye yo, sou aplikasyon kat ou",
      summaryNext: (time: string, minutes: number) =>
        `Pwochen bis la pati a ${time} nan antre anplwaye yo. Rete anviwon ${minutes} minit.`,
      summaryBoarding: (time: string) => `Bis ${time} ap pati nan antre anplwaye yo kounye a.`,
      summaryGap: (time: string) => `Pa gen bis. Sèvis la rekòmanse a ${time} nan antre anplwaye yo.`,
    },
  },

  switcher: {
    label: "Ki direksyon pou montre",
    hint: "Chwazi yon sèl kolòn. Lòt la rete kache pou w pa pran youn pou lòt.",
    summary: "Chwazi Ale otèl oswa Soti otèl.",
  },

  mismatch: {
    atHotel: "Ou nan arè otèl la, men kolòn sa a bloke sou pakin nan.",
    atLot: "Ou nan arè pakin nan, men kolòn sa a bloke sou antre anplwaye yo.",
    notAtHotel: "Ou pa nan arè otèl la, men kolòn sa a bloke sou antre anplwaye yo.",
  },

  pickSide: {
    title: "Chwazi yon bò",
    body: "Ale otèl si w ap vin nan pakin nan pou pran bis la. Soti otèl si w nan antre anplwaye yo sou Dream Tree Blvd.",
  },

  hero: {
    noBus: "Pa gen bis",
    leavingNow: "Ap pati kounye a",
    now: "LI LA",
    tomorrow: "demen",
    gapHours: "1:30–3:00 AM",
    map: "Kat",
    resumesIn: "Sèvis la rekòmanse nan",
    atStop: "Nan arè a",
    leavesIn: "Ap pati nan",
    rideNote: (minutes: number) => `anviwon ${minutes} min, ka pran plis tan`,
    nextThree: "Twa pwochen depa yo",
    lastLeft: (minutesAgo: number, time: string) =>
      `Dènye bis la pati sa gen ${minutesAgo <= 1 ? 1 : minutesAgo} min · ${time}`,
    stationedTitle:
      "Pa gen bis nan pakin nan anvan 3:00 AM. Bis ki nan kolòn sa a toujou pati nan antre anplwaye yo.",
    stationedNext: (time: string) => `Pwochen an pati a ${time}.`,
  },

  walk: {
    inGap: "Pa gen bis k ap woule nan lè sa a.",
    boarding: "Li nan arè a.",
    atStop: "Ou nan arè a.",
    plenty: "Ou gen anpil tan anvan ou bezwen pati.",
    zero: "Tan mache a se zewo — n ap konte depi nan arè a.",
    tooLateCatch: (time: string) => `Twò ta pou bis sa a. Pwochen bis ou ka pran an se ${time}.`,
    tooLate: "Twò ta pou bis sa a.",
    leaveNowNext: (time: string) => `Pati kounye a, sinon w ap rate l. Pwochen an se ${time}.`,
    leaveNow: "Pati kounye a, sinon w ap rate l.",
    headOut: (time: string, minutes: number) => `Pati pa pita pase ${time} · ${minutes} min pou rive nan arè a`,
    label: "Minit pou rive nan arè a",
    skipped: "Pa konte pandan ou nan arè a",
    fewer: "Mwens minit pou rive nan arè a",
    more: "Plis minit pou rive nan arè a",
  },

  callout: {
    lotTitle: "Bis la ta dwe ap tann devan antre anplwaye otèl la.",
    lotBody: "Si w pa wè l, rele pou yo vin chèche w nan pakin nan.",
    gapTitle: (time: string) => `Pa gen bis pwograme anvan ${time}.`,
    gapBody: "Si w toujou bezwen yon woulib, rele dispatch la.",
    call: (phone: string) => `Rele ${phone}`,
  },

  sheetDate: (date: string) => `Orè a pibliye/mete ajou nan dat ${date}`,

  place: {
    pending: "N ap chèche kote ou ye",
    "at-hotel": "Nan arè otèl la",
    "at-lot": "Nan arè pakin nan",
    away: "Sou wout pakin nan",
    fuzzy: "Pozisyon an pa klè",
    far: "Ap vin nan pakin nan",
    denied: "Lokalizasyon fèmen",
    timeout: "Lokalizasyon pran twòp tan",
    idle: "Pa sèvi ak lokalizasyon",
    unavailable: "Pa jwenn pozisyon w",
    unsupported: "Lokalizasyon pa disponib",
  },
  placeDetail: {
    locked: (where: string) => `Kolòn bloke · ${where}`,
    lockedNoPin: "Kolòn bloke · pa sèvi ak pozisyon w",
    fromLink: (where: string) => `Dapre kòd QR arè a · ${where}`,
    fromLinkNoPin: "Dapre kòd QR arè a · pou vizit sa a sèlman",
    ago: (where: string, minutes: number) => `${where} · sa gen ${minutes} min`,
    pending: "N ap chèche arè otèl la ak arè pakin nan",
    entranceColumn: (where: string) => `${where} · kolòn antre a`,
    lotColumn: (where: string) => `${where} · kolòn pakin nan`,
    showingEntrance: "N ap montre bis ki pati nan antre a",
    showingLot: "N ap montre bis ki pati nan pakin nan",
    fuzzy: "Pozisyon an pa klè ase pou chwazi yon kolòn. Chwazi ak bouton yo.",
    denied: "Pèmèt lokalizasyon, oswa chwazi ak bouton yo. L ap rete konsa.",
    timeout: "Sa pran twòp tan. Eseye ankò, oswa chwazi ak bouton yo.",
    unavailable: "Telefòn sa a pa t ka jwenn pozisyon w. Chwazi ak bouton yo.",
    idle: "Ouvri lokalizasyon si w vle kolòn nan chwazi pou kont li.",
    other: "Chwazi ak bouton yo. L ap rete konsa sou telefòn sa a.",
    fromLot: (distance: string) => `${distance} lwen arè pakin nan`,
    fromHotel: (distance: string) => `${distance} lwen arè otèl la`,
  },
  placeButtons: {
    followMe: "Swiv mwen",
    tryAgain: "Eseye ankò",
    useLocation: "Jwenn kote m ye",
    lock: "Bloke",
    stopLocation: "Sispann sèvi ak lokalizasyon",
  },

  tools: {
    keepScreenOn: "Kenbe ekran limen",
    screenStaysOn: "Ekran rete limen",
    chime: "Son alèt",
    chimeOn: "Son alèt aktive",
    rearm: "Peze pou reaktive",
    noWakeLock: "Navigatè sa a p ap kenbe ekran an limen.",
    noChime: "Navigatè sa a p ap fè son alèt la.",
  },

  plan: {
    label: "Gade yon lòt lè",
    inputLabel: "Fè kòmsi lè Orlando a se",
    checking: (time: string) => `N ap montre ${time} olye de kounye a.`,
    back: "Tounen nan lè kounye a",
  },

  list: {
    title: "Orè jodi a",
    oneColumn: "Yon sèl kolòn",
    empty: "Tout tablo a ap parèt lè w chwazi yon kolòn. Se kolòn sa a sèlman — pa janm toude.",
    parts: {
      "after-midnight": "Apre minui",
      "early-morning": "Granmaten",
      morning: "Maten",
      afternoon: "Apremidi",
      evening: "Aswè",
      night: "Lannwit",
    },
    now: "Kounye a",
    next: "Pwochen",
    left: "Pati",
  },

  how: {
    title: "Kijan yo chwazi kolòn nan",
    withLocation: "Lè lokalizasyon ouvri, kolòn nan swiv kote ou ye:",
    atEntrance: "Nan antre anplwaye yo → Soti otèl",
    atLot: "Nan pakin nan → Ale otèl",
    elsewhere: "Nenpòt lòt kote → Ale otèl, jiskaske ou bloke yon kolòn",
    rough: "Si pozisyon w pa klè ase, l ap mande w chwazi.",
    locationOff:
      "Lè lokalizasyon fèmen, peze yon kolòn epi l ap rete konsa sou telefòn sa a. Si w eskane kòd QR yon arè, w ap wè kolòn arè sa a pou fwa sa a sèlman.",
    privacy: "Tablo sa a pa janm voye pozisyon w okenn kote. Lyen kat la pote pozisyon arè a sèlman.",
    screenChime:
      "“Kenbe ekran limen” kenbe ekran an limen pandan w ap tann nan arè a. “Son alèt” fè yon ti son lè li rete 5 minit, 2 minit ak 30 segonn anvan bis la pati, epi sèlman lè paj sa a louvri.",
    orlando: (rideMin: number) =>
      `Tout lè yo se lè Orlando, menm si telefòn ou regle sou lè yon lòt kote. Pa gen bis pandan 1:30–3:00 AM. Apre 11:50 PM, pa gen bis ki pati nan pakin nan anvan 3:00 AM. Wout la pran anviwon ${rideMin} minit, li ka pran plis tan.`,
  },

  contact: {
    title: "Kontak",
    dispatch: "Dispatch",
    shoutout: "Felisitasyon ak kòmantè",
    shoutoutBody: "Fòm Skyline nan kòd QR ki nan bis la. Mete non w, lè bis la, ak sa k te pase. Se P&C ki resevwa l.",
    appFeedback: "Kòmantè sou aplikasyon an",
    appFeedbackBody: "Sou tablo sa a, pa sou bis la. Pwoblèm, ide, oswa yon kòmantè.",
  },

  install: {
    title: "Mete l sou telefòn ou",
    intro:
      "Li louvri sou tout ekran an, tankou yon aplikasyon. Ou peze yon fwa epi ou wè konbyen tan ki rete, menm lè siyal la fèb nan pakin nan.",
    existing: "Yon ikòn ki deja sou ekran prensipal ou p ap chanje. Efase l, epi mete l ankò.",
    apple: "Louvri paj sa a nan Safari. Peze “Share”, apre “Add to Home Screen”. Chrome sou iPhone pa ka mete ikòn nan.",
    android: "Nan Chrome: peze meni an, apre “Install app”.",
  },

  error: {
    title: "Gen yon bagay ki pa mache",
    unknown: "Erè nou pa konnen",
    reload: "Rechaje",
  },
};
