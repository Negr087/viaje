// Desafíos diarios del viaje. Cada día salen 3 distintos, siempre los mismos para todos
// (se sortean una sola vez con una semilla fija, así nadie ve otros y no se repiten).
// Podés agregar, sacar o cambiar desafíos: el `id` tiene que ser único y no cambiar
// una vez que alguien lo cumplió (los puntos quedan guardados con ese id).
import { diasDelViaje } from './config';

export const DESAFIOS = [
  { id: 'otro-pais', emoji: '🌎', texto: 'Foto con alguien de otro país', puntos: 20 },
  { id: 'fruta-nueva', emoji: '🥭', texto: 'Probar una fruta que nunca comiste', puntos: 10 },
  { id: 'salto-pileta', emoji: '🤸', texto: 'Foto saltando a la pileta (en el aire)', puntos: 20 },
  { id: 'atardecer', emoji: '🌅', texto: 'Foto del atardecer', puntos: 10 },
  { id: 'castillo', emoji: '🏰', texto: 'Castillo de arena con al menos 3 torres', puntos: 20 },
  { id: 'bachata', emoji: '💃', texto: 'Bailar bachata o merengue con alguien', puntos: 30 },
  { id: 'coco', emoji: '🥥', texto: 'Tomar agua de coco directo del coco', puntos: 10 },
  { id: 'piramide', emoji: '🔺', texto: 'Pirámide humana de al menos 4 personas', puntos: 30 },
  { id: 'tres-generaciones', emoji: '👵', texto: 'Foto de tres generaciones juntas', puntos: 20 },
  { id: 'pelicano', emoji: '🦤', texto: 'Foto de un pelícano o un ave rara', puntos: 20 },
  { id: 'iguana', emoji: '🦎', texto: 'Foto de una lagartija o iguana', puntos: 10 },
  { id: 'cangrejo', emoji: '🦀', texto: 'Foto de un cangrejo', puntos: 10 },
  { id: 'trago-colores', emoji: '🍹', texto: 'El trago o jugo más colorido del bar', puntos: 10 },
  { id: 'ola', emoji: '🌊', texto: 'Foto saltando una ola', puntos: 10 },
  { id: 'disfraz', emoji: '🎭', texto: 'Disfrazarse con lo que haya en la habitación', puntos: 20 },
  { id: 'empleado', emoji: '🤝', texto: 'Foto con alguien que trabaja en el hotel', puntos: 20 },
  { id: 'palabra-local', emoji: '🗣️', texto: 'Aprender una frase dominicana y usarla con alguien del hotel (foto con esa persona)', puntos: 20 },
  { id: 'caracol', emoji: '🐚', texto: 'Encontrar el caracol más lindo', puntos: 10 },
  { id: 'todos-saltando', emoji: '🦘', texto: 'Foto de la familia entera saltando', puntos: 30 },
  { id: 'copiar-foto', emoji: '📸', texto: 'Recrear una foto vieja de la familia', puntos: 30 },
  { id: 'palmera', emoji: '🌴', texto: 'Encontrar la palmera más torcida', puntos: 10 },
  { id: 'abuela-pileta', emoji: '🏊', texto: 'Que la abuela o el abuelo se meta a la pileta', puntos: 30 },
  { id: 'show', emoji: '🎤', texto: 'Subir al escenario en el show de la noche', puntos: 30 },
  { id: 'helado', emoji: '🍦', texto: 'Comer un helado en la playa', puntos: 10 },
  { id: 'pez', emoji: '🐠', texto: 'Ver un pez de colores (foto del agua vale)', puntos: 20 },
  { id: 'sombra', emoji: '👥', texto: 'Foto artística con las sombras de todos', puntos: 20 },
  { id: 'brindis', emoji: '🥂', texto: 'Brindis con toda la mesa en la cena', puntos: 10 },
];

export const POR_DIA = 3;
const SEMILLA = 2027;

// Mezcla con semilla fija (mulberry32): mismo orden en todos los celulares
function mezclar(lista, semilla) {
  let a = semilla;
  const rnd = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const ORDEN = mezclar(DESAFIOS, SEMILLA);
export const PORID = Object.fromEntries(DESAFIOS.map((d) => [d.id, d]));

// Los 3 desafíos de un día del viaje (AAAA-MM-DD). Si hay más días que desafíos, vuelve a empezar.
export function desafiosDelDia(iso) {
  const i = diasDelViaje().indexOf(iso);
  if (i === -1) return [];
  return Array.from({ length: POR_DIA }, (_, k) => ORDEN[(i * POR_DIA + k) % ORDEN.length]);
}
