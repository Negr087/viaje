// =========================================================
// Datos del hotel (Iberostar Waves Costa Dorada)
// Fuentes: Oyster, sitio de reservas del hotel y agencias (iberostar.com no se
// pudo leer). Los horarios pueden cambiar: confirmalos en recepción al llegar.
// =========================================================

export const HOTEL = {
  nombre: 'Iberostar Waves Costa Dorada',
  direccion: 'Carretera Luperón Km 2.5, Marapica, Costa Dorada, Puerto Plata',
  telefono: '+1 809 320 1000',
  web: 'https://www.iberostar.com/en/hotels/puerto-plata/iberostar-waves-costa-dorada/',
  app: 'https://play.google.com/store/apps/details?id=com.mo2o.iberostar',
  appIos: 'https://apps.apple.com/app/id922530529',
  checkin: 'desde las 15:00',
  checkout: 'hasta las 11:00 (12:00 según el día; consultá late check-out)',
};

export const DATOS_RAPIDOS = [
  ['🛬', 'Aeropuerto (POP)', '≈ 20–25 min en auto (15 km)'],
  ['🏙️', 'Centro de Puerto Plata', '≈ 10 min en auto'],
  ['📶', 'Wifi', 'Gratis en todo el hotel'],
  ['🍹', 'Todo incluido', 'Comidas, bebidas, snacks y actividades'],
  ['🛏️', 'Habitaciones', '516, en edificios coloniales de pocos pisos'],
  ['🏖️', 'Playa', 'Arena dorada, frente al hotel'],
];

export const RESTAURANTES = [
  { id: 'mercado', emoji: '🍽️', nombre: 'El Mercado', tipo: 'Buffet internacional con comida dominicana',
    horario: 'Desayuno, almuerzo y cena · 7:00–15:00 y 18:30–22:00', reserva: 'No hace falta',
    nota: 'Al lado del lobby. Noches temáticas y rincón de comida para chicos.' },
  { id: 'mare', emoji: '🍝', nombre: 'Mare Nostrum', tipo: 'Italiano / mediterráneo (a la carta)',
    horario: 'Cena · 18:30–22:00', reserva: 'Sí, con anticipación',
    nota: 'Incluido 1 cena por semana por habitación (confirmar en recepción).' },
  { id: 'hacienda', emoji: '🌮', nombre: 'La Hacienda', tipo: 'Mexicano (a la carta)',
    horario: 'Cena · 18:30–22:00 (por turnos)', reserva: 'Sí, se elige turno',
    nota: 'Incluido 1 cena por semana por habitación.' },
  { id: 'sakura', emoji: '🍣', nombre: 'Sakura', tipo: 'Japonés, sushi (a la carta)',
    horario: 'Cena · 18:30–22:00 (2 turnos)', reserva: 'Sí, se elige turno',
    nota: 'Incluido 1 cena por semana por habitación. A los chicos les suele encantar.' },
  { id: 'bohio', emoji: '🍔', nombre: 'El Bohío', tipo: 'Snack bar junto a la pileta',
    horario: 'Mediodía y tarde', reserva: 'No',
    nota: 'Pizza, hamburguesas, panchos, nachos, pescado frito y ensaladas.' },
];

export const BARES = [
  { id: 'fuente', emoji: '🍸', nombre: 'La Fuente', donde: 'Lobby' },
  { id: 'mojado', emoji: '🏊', nombre: 'Mojado', donde: 'Swim-up bar, adentro de la pileta' },
  { id: 'bohio', emoji: '🍺', nombre: 'El Bohío', donde: 'Al lado de la pileta' },
  { id: 'chiringuito', emoji: '🌴', nombre: 'El Chiringuito', donde: 'En la playa' },
  { id: 'plaza', emoji: '🎭', nombre: 'La Plaza', donde: 'Teatro, durante los shows' },
  { id: 'route66', emoji: '🪩', nombre: 'Route 66', donde: 'Disco (de noche)' },
];

export const SECCIONES_INFO = [
  { titulo: '🏊 Piletas', items: [
    'Una pileta grande a pocos metros de la playa, que da vueltas alrededor de un jardín central: parecen 3 o 4 piletas.',
    'Jacuzzi entre columnas griegas y swim-up bar (Mojado).',
    '2 piletitas para bebés y chicos chicos, al lado del parque de juegos.',
  ] },
  { titulo: '🧒 Para los chicos', items: [
    'Star Camp: club de chicos con actividades por edad (4 a 12 aprox., con grupos para más grandes). Horario de referencia 10:00–17:00.',
    'Parque de juegos (los chicos tienen que ir con un adulto).',
    'Mini disco y shows infantiles a la noche, antes del show principal.',
    'Hay servicio de niñera con costo extra (pedir en recepción).',
  ] },
  { titulo: '🎾 Deportes y actividades', items: [
    'Canchas de tenis con luz, minigolf, básquet, fútbol, vóley y vóley playa.',
    'Ping-pong, billar, tiro con arco, aquagym, clases de baile y bingo.',
    'Deportes acuáticos y buceo con costo extra (centro de buceo).',
  ] },
  { titulo: '💆 Spa y gimnasio', items: [
    'Spa con masajes, sauna, hidroterapia, peluquería y manicura (con costo).',
    'Gimnasio con máquinas de cardio y pesas (incluido).',
  ] },
  { titulo: '🌙 De noche', items: [
    'Show en el teatro todas las noches (alrededor de las 21:30).',
    'Después, disco Route 66 para los grandes.',
  ] },
  { titulo: '📌 Bueno saber', items: [
    'Pulsera de todo incluido: llevarla siempre puesta.',
    'Toallas de playa: se retiran con la tarjeta de toalla; si se pierde, se cobra.',
    'En los restaurantes a la carta los hombres suelen tener que ir con pantalón largo y calzado cerrado.',
    'Las reservas a la carta se hacen en la app de Iberostar (o en recepción): conviene reservar el primer día.',
    'Enchufes tipo americano (110 V).',
    'Pedí en recepción el mapa impreso del hotel para corregir el de acá.',
  ] },
];

// ---------- Mapa ----------
// Es un esquema aproximado armado con descripciones de huéspedes, no el plano
// oficial. x/y en un lienzo de 360 x 540.
export const LUGARES = [
  { id: 'entrada', emoji: '🚗', nombre: 'Entrada', x: 180, y: 32, texto: 'Acceso desde la Carretera Luperón. Acá paran los taxis y los transfers.' },
  { id: 'lobby', emoji: '🛎️', nombre: 'Lobby y recepción', x: 180, y: 105, texto: 'Recepción, reservas a la carta, cambio de dinero y bar La Fuente. Wifi más fuerte.' },
  { id: 'mercado', emoji: '🍽️', nombre: 'El Mercado (buffet)', x: 82, y: 118, texto: 'Buffet de desayuno, almuerzo y cena. Al lado del lobby.' },
  { id: 'alacarta', emoji: '🍝', nombre: 'Restaurantes a la carta', x: 282, y: 118, texto: 'Mare Nostrum (italiano), La Hacienda (mexicano) y Sakura (japonés). Cerca del lobby.' },
  { id: 'teatro', emoji: '🎭', nombre: 'Teatro y bar La Plaza', x: 180, y: 185, texto: 'Shows todas las noches. Atrás, la disco Route 66.' },
  { id: 'hab-o', emoji: '🛏️', nombre: 'Habitaciones (lado oeste)', x: 40, y: 270, texto: 'Edificios coloniales de pocos pisos. Algunas habitaciones dan a la laguna o al jardín.' },
  { id: 'hab-e', emoji: '🛏️', nombre: 'Habitaciones (lado este)', x: 320, y: 270, texto: 'Edificios coloniales. Los más cerca del mar tienen vista al mar.' },
  { id: 'pileta', emoji: '🏊', nombre: 'Pileta principal', x: 180, y: 300, texto: 'Pileta grande alrededor de un jardín, con jacuzzi y swim-up bar Mojado.' },
  { id: 'ninos', emoji: '🧒', nombre: 'Star Camp y piletita', x: 92, y: 360, texto: 'Club de chicos, parque de juegos y las piletitas para los más chicos.' },
  { id: 'bohio', emoji: '🍔', nombre: 'Snack bar El Bohío', x: 268, y: 365, texto: 'Snacks y bebidas al mediodía y a la tarde, entre la pileta y la playa.' },
  { id: 'deportes', emoji: '🎾', nombre: 'Tenis y deportes', x: 330, y: 190, texto: 'Canchas de tenis, básquet, minigolf. Gimnasio y spa cerca.' },
  { id: 'chiringuito', emoji: '🌴', nombre: 'Bar El Chiringuito', x: 290, y: 432, texto: 'Bar de playa.' },
  { id: 'playa', emoji: '🏖️', nombre: 'Playa', x: 150, y: 440, texto: 'Playa pública de arena dorada con reposeras y sombrillas. Toallas en la caseta.' },
];
