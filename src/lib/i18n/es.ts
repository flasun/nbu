import type { Messages } from "./en.ts";

/** Spanish: neutral Latin American, informal "tú", for US Latino staff in Florida ("autobús", "bus" only in the 26-char from-hotel label, "estacionamiento", "despacho"); "la 1:15" vs "las 7:30" is picked from the time. */
export const es: Messages = {
  languageName: "Español",
  languagePicker: "Idioma",

  header: {
    tagline: "Edición Dream Tree",
    orlandoTime: "hora de Orlando",
    orlando: "Orlando",
    weekdaysShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
    monthsShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
    date: (weekday: string, month: string, day: number) => `${weekday} · ${day} ${month}`,
  },

  directions: {
    "to-hotel": {
      title: "Al hotel",
      detail: "Del estacionamiento",
      stop: "Estacionamiento",
      standAt: "Espera en el estacionamiento",
      leaves: "Sale del estacionamiento",
      column: "Esta es la columna del estacionamiento. La de la entrada está oculta.",
      nextBus: "Próximo autobús al hotel",
      backAt: (time: string) => `Vuelve a ${time.startsWith("1:") ? "la" : "las"} ${time} · Estacionamiento`,
      arrives: (time: string) => `Llegas al hotel cerca de ${time.startsWith("1:") ? "la" : "las"} ${time}`,
      arrivesOn: (time: string, bus: string) =>
        `Llegas al hotel cerca de ${time.startsWith("1:") ? "la" : "las"} ${time} si tomas el de ${bus.startsWith("1:") ? "la" : "las"} ${bus}`,
      mapLabel: "Cómo llegar al estacionamiento en tu app de mapas",
      summaryNext: (time: string, minutes: number) =>
        `Próximo autobús a ${time.startsWith("1:") ? "la" : "las"} ${time} desde el estacionamiento, ${minutes === 1 ? "en 1 minuto" : `en unos ${minutes} minutos`}.`,
      summaryBoarding: (time: string) =>
        `El autobús de ${time.startsWith("1:") ? "la" : "las"} ${time} ya está saliendo del estacionamiento.`,
      summaryGap: (time: string) =>
        `No hay autobús. El servicio vuelve a ${time.startsWith("1:") ? "la" : "las"} ${time} desde el estacionamiento.`,
    },
    "from-hotel": {
      title: "Del hotel",
      detail: "De la entrada",
      stop: "Entrada de empleados",
      standAt: "Espera en la entrada de empleados",
      leaves: "Sale de la entrada de empleados",
      column: "Esta es la columna de la entrada de empleados. La del estacionamiento está oculta.",
      nextBus: "Próximo bus desde el hotel",
      backAt: (time: string) => `Vuelve a ${time.startsWith("1:") ? "la" : "las"} ${time} · Entrada de empleados`,
      arrives: (time: string) => `Llegas al estacionamiento cerca de ${time.startsWith("1:") ? "la" : "las"} ${time}`,
      arrivesOn: (time: string, bus: string) =>
        `Llegas al estacionamiento cerca de ${time.startsWith("1:") ? "la" : "las"} ${time} si tomas el de ${bus.startsWith("1:") ? "la" : "las"} ${bus}`,
      mapLabel: "Cómo llegar a la entrada de empleados en tu app de mapas",
      summaryNext: (time: string, minutes: number) =>
        `Próximo autobús a ${time.startsWith("1:") ? "la" : "las"} ${time} desde la entrada de empleados, ${minutes === 1 ? "en 1 minuto" : `en unos ${minutes} minutos`}.`,
      summaryBoarding: (time: string) =>
        `El autobús de ${time.startsWith("1:") ? "la" : "las"} ${time} ya está saliendo de la entrada de empleados.`,
      summaryGap: (time: string) =>
        `No hay autobús. El servicio vuelve a ${time.startsWith("1:") ? "la" : "las"} ${time} desde la entrada de empleados.`,
    },
  },

  switcher: {
    label: "Qué dirección mostrar",
    hint: "Elige una columna. La otra se queda oculta para que no te confundas.",
    summary: "Elige: Al hotel o Del hotel.",
  },

  mismatch: {
    atHotel: "Estás en la parada del hotel, pero la columna fijada es la del estacionamiento.",
    atLot: "Estás en la parada del estacionamiento, pero la columna fijada es la de la entrada de empleados.",
    notAtHotel: "No estás en la parada del hotel, pero la columna fijada es la de la entrada de empleados.",
  },

  pickSide: {
    title: "¿Qué columna necesitas?",
    body: "Elige Al hotel si vas a tomar el autobús en el estacionamiento, o Del hotel si estás en la entrada de empleados en Dream Tree Blvd.",
  },

  hero: {
    noBus: "No hay autobús",
    leavingNow: "Saliendo ahora",
    now: "AHORA",
    tomorrow: "mañana",
    gapHours: "1:30–3:00 AM",
    map: "Mapa",
    resumesIn: "El servicio vuelve en",
    atStop: "En la parada",
    leavesIn: "Sale en",
    rideNote: (minutes: number) => `unos ${minutes} min, puede tardar más`,
    nextThree: "Las próximas tres salidas",
    lastLeft: (minutesAgo: number, time: string) =>
      minutesAgo <= 1 ? `El último salió hace 1 min · ${time}` : `El último salió hace ${minutesAgo} min · ${time}`,
    stationedTitle:
      "No sale ningún autobús del estacionamiento hasta las 3:00 AM. Los de esta columna siguen saliendo de la entrada de empleados.",
    stationedNext: (time: string) => `El próximo sale a ${time.startsWith("1:") ? "la" : "las"} ${time}.`,
  },

  walk: {
    inGap: "No hay servicio en este horario.",
    boarding: "Ya está en la parada.",
    atStop: "Estás en la parada.",
    plenty: "Tienes tiempo de sobra antes de salir.",
    zero: "El tiempo para llegar está en cero: es como si ya estuvieras en la parada.",
    tooLateCatch: (time: string) =>
      `Este ya no lo alcanzas. Puedes tomar el de ${time.startsWith("1:") ? "la" : "las"} ${time}.`,
    tooLate: "Este ya no lo alcanzas.",
    leaveNowNext: (time: string) =>
      `Sal ahora o lo pierdes. El siguiente sale a ${time.startsWith("1:") ? "la" : "las"} ${time}.`,
    leaveNow: "Sal ahora o lo pierdes.",
    headOut: (time: string, minutes: number) =>
      `Sal a más tardar a ${time.startsWith("1:") ? "la" : "las"} ${time} · ${minutes} min hasta la parada`,
    label: "Minutos para llegar a la parada",
    skipped: "No se usa mientras estás en la parada",
    fewer: "Menos minutos para llegar a la parada",
    more: "Más minutos para llegar a la parada",
  },

  callout: {
    lotTitle: "El autobús debería estar esperando en la entrada de empleados del hotel.",
    lotBody: "Si no lo ves, llama y pide que te recojan en el estacionamiento.",
    gapTitle: (time: string) => `No hay nada programado hasta ${time.startsWith("1:") ? "la" : "las"} ${time}.`,
    gapBody: "Si todavía necesitas transporte, llama al despacho.",
    call: (phone: string) => `Llamar al ${phone}`,
  },

  sheetDate: (date: string) => `Horarios publicados/actualizados al ${date}`,

  place: {
    pending: "Buscando tu ubicación",
    "at-hotel": "En la parada del hotel",
    "at-lot": "En la parada del estacionamiento",
    away: "Camino al estacionamiento",
    fuzzy: "Ubicación imprecisa",
    far: "Vienes al estacionamiento",
    denied: "Ubicación desactivada",
    timeout: "La ubicación tardó demasiado",
    idle: "No se usa la ubicación",
    unavailable: "No se encontró la ubicación",
    unsupported: "Ubicación no disponible",
  },
  placeDetail: {
    locked: (where: string) => `Columna fijada · ${where}`,
    lockedNoPin: "Columna fijada · sin usar tu ubicación",
    fromLink: (where: string) => `Del código QR de la parada · ${where}`,
    fromLinkNoPin: "Del código QR de la parada · solo esta visita",
    ago: (where: string, minutes: number) => `${where} · hace ${minutes} min`,
    pending: "Buscando la parada del hotel y la del estacionamiento",
    entranceColumn: (where: string) => `Columna de la entrada · ${where}`,
    lotColumn: (where: string) => `Columna del estacionamiento · ${where}`,
    showingEntrance: "Mostrando los autobuses que salen de la entrada",
    showingLot: "Mostrando los autobuses que salen del estacionamiento",
    fuzzy: "Tu ubicación es demasiado imprecisa para elegir la columna. Elígela tú.",
    denied: "Activa la ubicación o elige tú la columna. Tu elección se queda guardada.",
    timeout: "La lectura tardó demasiado. Inténtalo de nuevo o elige tú la columna.",
    unavailable: "Este teléfono no pudo obtener tu ubicación. Elige tú la columna.",
    idle: "Activa la ubicación si quieres que la columna se elija sola.",
    other: "Elige tú la columna. Se queda guardada en este teléfono.",
    fromLot: (distance: string) => `a ${distance} de la parada del estacionamiento`,
    fromHotel: (distance: string) => `a ${distance} de la parada del hotel`,
  },
  placeButtons: {
    followMe: "Seguir ubicación",
    tryAgain: "Reintentar",
    useLocation: "Usar ubicación",
    lock: "Fijar",
    stopLocation: "Dejar de usar la ubicación",
  },

  tools: {
    keepScreenOn: "No apagar pantalla",
    screenStaysOn: "Pantalla encendida",
    chime: "Aviso sonoro",
    chimeOn: "Aviso activado",
    rearm: "Toca para activar",
    noWakeLock: "Este navegador no puede mantener la pantalla encendida.",
    noChime: "Este navegador no puede reproducir el aviso sonoro.",
  },

  plan: {
    label: "Ver otra hora",
    inputLabel: "Hora de Orlando a simular",
    checking: (time: string) =>
      `Viendo ${time.startsWith("1:") ? "la" : "las"} ${time} en lugar de la hora actual.`,
    back: "Volver a la hora actual",
  },

  list: {
    title: "Horarios de hoy",
    oneColumn: "Una columna a la vez",
    empty: "La lista completa aparece cuando eliges una columna. Solo esa columna, nunca las dos.",
    parts: {
      "after-midnight": "Después de medianoche",
      "early-morning": "Madrugada",
      morning: "Mañana",
      afternoon: "Tarde",
      evening: "Tarde-noche",
      night: "Noche",
    },
    now: "Ahora",
    next: "Próximo",
    left: "Salió",
  },

  how: {
    title: "Cómo se elige la columna",
    withLocation: "Con la ubicación activada, la columna depende de dónde estés:",
    atEntrance: "En la entrada de empleados → Del hotel",
    atLot: "En el estacionamiento → Al hotel",
    elsewhere: "En cualquier otro lugar → Al hotel, hasta que fijes una columna",
    rough: "Si tu ubicación es demasiado imprecisa para saberlo, te pide que elijas.",
    locationOff:
      "Con la ubicación desactivada, toca una columna y se queda guardada en este teléfono. El código QR de una parada muestra esa columna solo durante esa visita.",
    privacy: "Esta app nunca envía tu ubicación a ningún lado. El enlace del mapa solo lleva la posición de la parada.",
    screenChime:
      "“No apagar pantalla” mantiene la pantalla encendida mientras esperas en la parada. “Aviso sonoro” reproduce un tono corto cuando faltan 5 minutos, 2 minutos y 30 segundos para que salga el autobús, y solo mientras esta página esté abierta.",
    orlando: (rideMin: number) =>
      `Todo se muestra en hora de Orlando, aunque tu teléfono tenga otra zona horaria. No hay servicio de 1:30 a 3:00 AM. Después de las 11:50 PM no sale nada del estacionamiento hasta las 3:00 AM. El viaje dura unos ${rideMin} ${rideMin === 1 ? "minuto" : "minutos"} y puede tardar más.`,
  },

  contact: {
    title: "Contacto",
    dispatch: "Despacho",
    shoutout: "Felicitaciones y comentarios",
    shoutoutBody:
      "Formulario de Skyline en el código QR del autobús. Escribe tu nombre, la hora del autobús y lo que pasó. Se envía a P&C.",
    appFeedback: "Comentarios sobre la app",
    appFeedbackBody: "Sobre esta app, no sobre el autobús. Errores, ideas o un comentario.",
  },

  install: {
    title: "Agrégala a tu teléfono",
    intro:
      "Se abre en pantalla completa, como una app. La cuenta regresiva queda a un toque, y la app sigue funcionando aunque haya poca señal en el estacionamiento.",
    apple: "Abre esta página en Safari. Toca Compartir y luego Agregar a inicio. En iPhone, Chrome no puede poner el ícono.",
    android: "En Chrome: menú y luego Instalar app.",
  },

  poster: {
    title: "Carteles QR",
    intro:
      "Imprímelos y pon cada uno donde dice. El código de una parada abre la app en la columna de esa parada, solo durante esa visita.",
    print: "Imprimir",
    printThis: "Imprimir este",
    paper: "Carta o A4, vertical. Cada cartel sale en su propia hoja.",
    temporary: (host: string) =>
      `Estos códigos abren ${host}, una dirección temporal. Imprímelos cuando la dirección final esté lista, para no tener que imprimirlos de nuevo.`,
    check: "Cuando el cartel esté puesto, escanéalo ahí mismo. La app debe abrir en la columna que dice el cartel.",
    putUp: {
      "to-hotel": "Pon este en la parada del estacionamiento.",
      "from-hotel": "Pon este en la entrada de empleados.",
      anywhere: "Pon este en un tablero de anuncios o junto al reloj de marcar. Su código abre la app sin elegir una columna.",
    },
    anywhereTitle: "Horarios",
    anywhereDetail: "Autobús al hotel y del hotel",
    scan: "Escanea para ver el próximo autobús",
    codeLabel: (url: string) => `Código QR que abre ${url}`,
  },

  error: {
    title: "Algo salió mal",
    unknown: "Error desconocido",
    reload: "Recargar",
  },
};
