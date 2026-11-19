// =========================================================
// Configuración del viaje — editá esto a gusto
// =========================================================

export const VIAJE = {
  nombre: 'Puerto Plata 2027',
  destino: 'Puerto Plata, República Dominicana',
  // Fechas del viaje (formato AAAA-MM-DD): vuelo CM252 sale de Córdoba el 31/3
  // y la vuelta sale de Puerto Plata el 7/4 (llega a Córdoba el 8/4 a las 02:40)
  inicio: '2027-03-31',
  fin: '2027-04-07',
  // Hora de salida del vuelo (para la cuenta regresiva), hora Argentina
  horaSalida: '01:45',
  hotel: 'Nombre del resort',
  moneda: 'USD',
  // A quién va dedicado el recuerdo final
  homenajeada: 'la Abuela',
  // Para el clima y la hora de allá en la portada
  lat: 19.7934,
  lon: -70.6884,
  zonaHoraria: 'America/Santo_Domingo',
};

export const TIPOS = {
  adulto: 'Adulto',
  nino: 'Niño/a',
  bebe: 'Bebé',
};

export const CHECKLIST_BASE = {
  adulto: [
    'Pasaporte vigente (mínimo 6 meses)',
    'Formulario e-Ticket de República Dominicana (entrada y salida)',
    'Seguro de viaje',
    'Pasajes / tarjeta de embarque',
    'Tarjeta de crédito y algo de efectivo en USD',
    'Adaptador de enchufe (allá se usa el tipo americano)',
    'Protector solar y after sun',
    'Repelente',
    'Mallas',
    'Ojotas',
    'Gorra o sombrero',
    'Anteojos de sol',
    'Cargador y power bank',
    'Medicamentos personales',
    'Ropa para la noche (algunos restaurantes piden pantalón largo)',
  ],
  nino: [
    'Pasaporte',
    'Autorización de viaje (si no viaja con ambos padres)',
    'Mallas y antiparras',
    'Remera UV',
    'Protector solar factor alto',
    'Gorro',
    'Juguetes de playa',
    'Tablet y auriculares para el vuelo',
    'Snacks para el vuelo',
  ],
  bebe: [
    'Pasaporte del bebé',
    'Autorización de viaje (si corresponde)',
    'Pañales para los primeros días',
    'Pañales de agua',
    'Toallitas',
    'Cochecito liviano o mochila portabebé',
    'Protector solar apto bebés',
    'Sombrero con cubre nuca',
    'Mamaderas / lo necesario para alimentarlo',
    'Botiquín y termómetro',
    'Muda extra en el equipaje de mano',
    'Mosquitero para cuna o cochecito',
  ],
};

// 25 casillas: la del medio (índice 12) es libre
export const BINGO = [
  'Ver un cangrejo',
  'Tomar agua de coco',
  'Alguien quemado por el sol',
  'Foto con un loro',
  'Ver un barco',
  'Pileta antes del desayuno',
  'Ver un pelícano',
  'Probar una fruta nueva',
  'Encontrar un caracol',
  'Escuchar bachata',
  'Castillo de arena',
  'Ver una lagartija',
  '⭐ ¡Llegamos!',
  'Pedir un jugo de colores',
  'Palmera torcida',
  'Saltar una ola',
  'Ver el atardecer',
  'Ver un pez de colores',
  'Bailar en el show',
  'Ver una iguana',
  'Subir al teleférico',
  'Abuela en la pileta',
  'Siesta en la reposera',
  'Comer helado en la playa',
  'Foto de toda la familia',
];

export const PREMIOS = [
  { id: 'quemado', emoji: '🦞', titulo: 'El más quemado' },
  { id: 'dormilon', emoji: '😴', titulo: 'El que más durmió' },
  { id: 'buffet', emoji: '🍽️', titulo: 'Rey/Reina del buffet' },
  { id: 'fiesta', emoji: '🎉', titulo: 'El alma de la fiesta' },
  { id: 'perdido', emoji: '🧭', titulo: 'El más perdido' },
  { id: 'pileta', emoji: '🏊', titulo: 'Primero en la pileta' },
  { id: 'bailarin', emoji: '💃', titulo: 'Mejor bailarín/a' },
  { id: 'fotografo', emoji: '📸', titulo: 'Mejor fotógrafo/a' },
];

// ---------- helpers de fechas ----------

export function hoyISO() {
  return new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD en hora local
}

export function diasDelViaje() {
  const dias = [];
  const d = new Date(VIAJE.inicio + 'T12:00:00');
  const fin = new Date(VIAJE.fin + 'T12:00:00');
  while (d <= fin) {
    dias.push(d.toLocaleDateString('en-CA'));
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

export function fmtDia(iso, largo = false) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-AR', largo
    ? { weekday: 'long', day: 'numeric', month: 'long' }
    : { weekday: 'short', day: 'numeric', month: 'numeric' });
}

export function numeroDeDia(iso) {
  const i = diasDelViaje().indexOf(iso);
  return i === -1 ? null : i + 1;
}

export function estadoViaje() {
  const hoy = hoyISO();
  // La cuenta regresiva sigue hasta el despegue (el 31/3 sale a la 01:45)
  if (Date.now() < new Date(`${VIAJE.inicio}T${VIAJE.horaSalida}:00-03:00`).getTime()) return 'antes';
  if (hoy > VIAJE.fin) return 'despues';
  return 'durante';
}
