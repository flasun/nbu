import type { Messages } from "./en.ts";

/** Brazilian Portuguese (pt-BR), informal "você", for Brazilian staff in Orlando ("ônibus", "ponto", "estacionamento", "central"); "à 1:15" vs "às 7:30" is picked from the time. */
export const pt: Messages = {
  languageName: "Português",
  languagePicker: "Idioma",

  header: {
    tagline: "Edição Dream Tree",
    orlandoTime: "horário de Orlando",
    orlando: "Orlando",
    weekdaysShort: ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],
    monthsShort: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
    date: (weekday: string, month: string, day: number) => `${weekday} · ${day} ${month}`,
  },

  directions: {
    "to-hotel": {
      title: "Ao hotel",
      detail: "Sai do estacionamento",
      stop: "Estacionamento",
      standAt: "Espere no estacionamento",
      leaves: "Sai do estacionamento",
      column: "Esta é a coluna do estacionamento. A coluna da entrada fica escondida.",
      nextBus: "Próximo indo para o hotel",
      backAt: (time: string) => `Volta ${time.startsWith("1:") ? "à" : "às"} ${time} · Estacionamento`,
      arrives: (time: string) => `Chega ao hotel por volta ${time.startsWith("1:") ? "da" : "das"} ${time}`,
      arrivesOn: (time: string, bus: string) =>
        `Chega ao hotel por volta ${time.startsWith("1:") ? "da" : "das"} ${time} no ônibus ${bus.startsWith("1:") ? "da" : "das"} ${bus}`,
      mapLabel: "Como chegar ao estacionamento no seu app de mapas",
      summaryNext: (time: string, minutes: number) =>
        `Próximo ônibus ${time.startsWith("1:") ? "à" : "às"} ${time} saindo do estacionamento, em cerca de ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`,
      summaryBoarding: (time: string) =>
        `O ônibus ${time.startsWith("1:") ? "da" : "das"} ${time} está saindo do estacionamento agora.`,
      summaryGap: (time: string) =>
        `Não há ônibus. O serviço volta ${time.startsWith("1:") ? "à" : "às"} ${time}, saindo do estacionamento.`,
    },
    "from-hotel": {
      title: "Do hotel",
      detail: "Sai da entrada",
      stop: "Entrada de funcionários",
      standAt: "Espere na entrada de funcionários",
      leaves: "Sai da entrada de funcionários",
      column: "Esta é a coluna da entrada de funcionários. A coluna do estacionamento fica escondida.",
      nextBus: "Próximo saindo do hotel",
      backAt: (time: string) => `Volta ${time.startsWith("1:") ? "à" : "às"} ${time} · Entrada de funcionários`,
      arrives: (time: string) =>
        `Chega ao estacionamento por volta ${time.startsWith("1:") ? "da" : "das"} ${time}`,
      arrivesOn: (time: string, bus: string) =>
        `Chega ao estacionamento por volta ${time.startsWith("1:") ? "da" : "das"} ${time} no ônibus ${bus.startsWith("1:") ? "da" : "das"} ${bus}`,
      mapLabel: "Como chegar à entrada de funcionários no seu app de mapas",
      summaryNext: (time: string, minutes: number) =>
        `Próximo ônibus ${time.startsWith("1:") ? "à" : "às"} ${time} saindo da entrada de funcionários, em cerca de ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`,
      summaryBoarding: (time: string) =>
        `O ônibus ${time.startsWith("1:") ? "da" : "das"} ${time} está saindo da entrada de funcionários agora.`,
      summaryGap: (time: string) =>
        `Não há ônibus. O serviço volta ${time.startsWith("1:") ? "à" : "às"} ${time}, saindo da entrada de funcionários.`,
    },
  },

  switcher: {
    label: "Qual sentido mostrar",
    hint: "Escolha uma coluna. A outra fica escondida para não confundir.",
    summary: "Escolha: Ao hotel ou Do hotel.",
  },

  mismatch: {
    atHotel: "Você está no ponto do hotel, mas a coluna fixada é a do estacionamento.",
    atLot: "Você está no ponto do estacionamento, mas a coluna fixada é a da entrada de funcionários.",
    notAtHotel: "Você não está no ponto do hotel, mas a coluna fixada é a da entrada de funcionários.",
  },

  pickSide: {
    title: "Para onde você vai?",
    body: "“Ao hotel” se você vai pegar o ônibus no estacionamento. “Do hotel” se você está na entrada de funcionários, na Dream Tree Blvd.",
  },

  hero: {
    noBus: "Sem ônibus",
    leavingNow: "Saindo agora",
    now: "AGORA",
    tomorrow: "amanhã",
    gapHours: "1:30–3:00 AM",
    map: "Mapa",
    resumesIn: "O serviço volta em",
    atStop: "No ponto",
    leavesIn: "Sai em",
    rideNote: (minutes: number) => `cerca de ${minutes} min, pode demorar mais`,
    nextThree: "Próximas três saídas",
    lastLeft: (minutesAgo: number, time: string) =>
      minutesAgo <= 1 ? `O último saiu há 1 min · ${time}` : `O último saiu há ${minutesAgo} min · ${time}`,
    stationedTitle:
      "Não sai ônibus do estacionamento até as 3:00 AM. Os ônibus desta coluna continuam saindo da entrada de funcionários.",
    stationedNext: (time: string) => `O próximo sai ${time.startsWith("1:") ? "à" : "às"} ${time}.`,
  },

  walk: {
    inGap: "Não há ônibus neste horário.",
    boarding: "O ônibus já está no ponto.",
    atStop: "Você está no ponto.",
    plenty: "Você tem tempo de sobra antes de sair.",
    zero: "Tempo de caminhada zerado — a contagem é a partir do ponto.",
    tooLateCatch: (time: string) =>
      `Não dá mais tempo de pegar este. Dá para pegar o ${time.startsWith("1:") ? "da" : "das"} ${time}.`,
    tooLate: "Não dá mais tempo de pegar este.",
    leaveNowNext: (time: string) =>
      `Saia agora ou vai perder o ônibus. O próximo sai ${time.startsWith("1:") ? "à" : "às"} ${time}.`,
    leaveNow: "Saia agora ou vai perder o ônibus.",
    headOut: (time: string, minutes: number) =>
      `Saia até ${time.startsWith("1:") ? "a" : "as"} ${time} · ${minutes} min até o ponto`,
    label: "Minutos até o ponto",
    skipped: "Não conta enquanto você está no ponto",
    fewer: "Menos minutos até o ponto",
    more: "Mais minutos até o ponto",
  },

  callout: {
    lotTitle: "O ônibus deve estar esperando na entrada de funcionários do hotel.",
    lotBody: "Se não encontrar o ônibus, ligue e peça para buscarem você no estacionamento.",
    gapTitle: (time: string) =>
      `Não há nenhum ônibus programado até ${time.startsWith("1:") ? "a" : "as"} ${time}.`,
    gapBody: "Se ainda precisar de transporte, ligue para a central.",
    call: (phone: string) => `Ligar para ${phone}`,
  },

  sheetDate: (date: string) => `Horários publicados/atualizados em ${date}`,

  place: {
    pending: "Verificando onde você está",
    "at-hotel": "No ponto do hotel",
    "at-lot": "No ponto do estacionamento",
    away: "Indo para o estacionamento",
    fuzzy: "Localização imprecisa",
    far: "A caminho do estacionamento",
    denied: "Localização desligada",
    timeout: "A localização demorou demais",
    idle: "Localização não está em uso",
    unavailable: "Localização não encontrada",
    unsupported: "Localização indisponível",
  },
  placeDetail: {
    locked: (where: string) => `Coluna fixada · ${where}`,
    lockedNoPin: "Coluna fixada · sem usar sua localização",
    fromLink: (where: string) => `Pelo QR code do ponto · ${where}`,
    fromLinkNoPin: "Pelo QR code do ponto · só nesta visita",
    ago: (where: string, minutes: number) => `${where} · há ${minutes} min`,
    pending: "Procurando o ponto do hotel e o do estacionamento",
    entranceColumn: (where: string) => `Coluna da entrada · ${where}`,
    lotColumn: (where: string) => `Coluna do estacionamento · ${where}`,
    showingEntrance: "Mostrando os ônibus que saem da entrada",
    showingLot: "Mostrando os ônibus que saem do estacionamento",
    fuzzy: "Localização imprecisa demais para escolher a coluna. Toque em uma delas.",
    denied: "Permita a localização ou toque em uma coluna. Ela fica salva.",
    timeout: "A leitura demorou demais. Tente de novo ou toque em uma coluna.",
    unavailable: "Este celular não conseguiu achar sua posição. Toque em uma coluna.",
    idle: "Ligue a localização se quiser que a coluna seja escolhida para você.",
    other: "Toque em uma coluna. Ela fica salva neste celular.",
    fromLot: (distance: string) => `a ${distance} do ponto do estacionamento`,
    fromHotel: (distance: string) => `a ${distance} do ponto do hotel`,
  },
  placeButtons: {
    followMe: "Seguir meu local",
    tryAgain: "Tentar de novo",
    useLocation: "Usar localização",
    lock: "Fixar coluna",
    stopLocation: "Parar de usar a localização",
  },

  tools: {
    keepScreenOn: "Manter tela ligada",
    screenStaysOn: "Tela fica ligada",
    chime: "Aviso sonoro",
    chimeOn: "Aviso ligado",
    rearm: "Toque para ativar",
    noWakeLock: "Este navegador não consegue manter a tela ligada.",
    noChime: "Este navegador não consegue tocar o aviso sonoro.",
  },

  plan: {
    label: "Ver outro horário",
    inputLabel: "Hora de Orlando para simular",
    checking: (time: string) => `Vendo como fica ${time.startsWith("1:") ? "à" : "às"} ${time}, em vez de agora.`,
    back: "Voltar ao horário atual",
  },

  list: {
    title: "Horários de hoje",
    oneColumn: "Uma coluna por vez",
    empty: "A lista completa aparece quando você escolhe uma coluna. Só essa coluna — nunca as duas.",
    parts: {
      "after-midnight": "Depois da meia-noite",
      "early-morning": "Madrugada",
      morning: "Manhã",
      afternoon: "Tarde",
      evening: "Fim de tarde",
      night: "Noite",
    },
    now: "Agora",
    next: "Próximo",
    left: "Saiu",
  },

  how: {
    title: "Como a coluna é escolhida",
    withLocation: "Com a localização ligada, a coluna segue onde você está:",
    atEntrance: "Na entrada de funcionários → Do hotel",
    atLot: "No estacionamento → Ao hotel",
    elsewhere: "Em qualquer outro lugar → Ao hotel, até você fixar uma coluna",
    rough: "Se a localização estiver imprecisa demais, o app pede para você escolher.",
    locationOff:
      "Com a localização desligada, toque em uma coluna e ela fica salva neste celular. O QR code de um ponto abre a coluna daquele ponto, só nessa visita.",
    privacy: "Este app nunca envia sua localização para lugar nenhum. O link do mapa só leva a posição do ponto.",
    screenChime:
      "“Manter tela ligada” deixa a tela acesa enquanto você espera no ponto. “Aviso sonoro” toca um bipe curto quando faltam 5 minutos, 2 minutos e 30 segundos para o ônibus sair, e só enquanto esta página estiver aberta.",
    orlando: (rideMin: number) =>
      `Tudo aparece no horário de Orlando, mesmo que seu celular esteja em outro fuso. Não há ônibus da 1:30 às 3:00 AM. Depois das 11:50 PM, não sai ônibus do estacionamento até as 3:00 AM. A viagem leva cerca de ${rideMin} ${rideMin === 1 ? "minuto" : "minutos"} e pode demorar mais.`,
  },

  contact: {
    title: "Contato",
    dispatch: "Central",
    shoutout: "Elogios e comentários",
    shoutoutBody:
      "Formulário da Skyline no QR code do ônibus. Coloque seu nome, o horário do ônibus e o que aconteceu. Vai direto para o P&C.",
    appFeedback: "Comentários sobre o app",
    appFeedbackBody: "Sobre este app, não sobre o ônibus. Erros, ideias ou um comentário.",
  },

  install: {
    title: "Adicione ao seu celular",
    intro:
      "Abre em tela cheia, como um app. A contagem regressiva fica a um toque, e o app funciona mesmo com sinal fraco no estacionamento.",
    apple:
      "Abra esta página no Safari. Toque em Compartilhar e depois em Adicionar à Tela de Início. No iPhone, o Chrome não consegue colocar o ícone.",
    android: "No Chrome: menu e depois Instalar app.",
  },

  poster: {
    title: "Cartazes com QR code",
    intro:
      "Imprima os cartazes e coloque cada um no lugar indicado. O QR code de um ponto abre o app na coluna desse ponto, só nessa visita.",
    print: "Imprimir",
    printThis: "Imprimir este",
    paper: "Carta ou A4, retrato. Cada cartaz sai em uma página.",
    temporary: (host: string) =>
      `Estes códigos abrem ${host}, um endereço temporário. Imprima os cartazes quando o endereço definitivo estiver pronto, para não precisar imprimir de novo.`,
    check: "Depois de colocar o cartaz, escaneie ali mesmo. O app deve abrir na coluna indicada no cartaz.",
    putUp: {
      "to-hotel": "Coloque este no ponto do estacionamento.",
      "from-hotel": "Coloque este na entrada de funcionários.",
      anywhere: "Coloque este num mural de avisos ou perto do relógio de ponto. Ele abre o app sem escolher uma coluna.",
    },
    anywhereTitle: "Horários",
    anywhereDetail: "Ônibus: estacionamento e entrada",
    scan: "Escaneie para ver o próximo ônibus",
    codeLabel: (url: string) => `Código QR que abre ${url}`,
  },

  error: {
    title: "Algo deu errado",
    unknown: "Erro desconhecido",
    reload: "Recarregar",
  },
};
