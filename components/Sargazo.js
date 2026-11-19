'use client';
import { useEffect, useState } from 'react';
import { VIAJE } from '@/lib/config';

// Nivel de sargazo del día en la playa del viaje.
// Datos: Veabird (veabird.com), feed público y gratuito que combina satélite + deriva por
// corrientes y viento. Se actualiza cada 6 horas; piden mostrar el crédito "Datos: Veabird".
const FEED = `https://veabird.com/data/feed/resorts/${VIAJE.sargazoPlaya}.json`;
const PAGINA = `https://veabird.com/resort/${VIAJE.sargazoPlaya}/`;
const CACHE_MS = 3 * 60 * 60 * 1000;
const CLAVE = 'sargazo';

const NIVELES = {
  'Very low': ['Muy bajo', '#2bb673'],
  Low: ['Bajo', '#7cc242'],
  Moderate: ['Moderado', '#f2c230'],
  High: ['Alto', '#e0772b'],
  'Very high': ['Muy alto', '#d83a3a'],
};

function leer() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch { return null; }
}

async function traer() {
  const c = leer();
  if (c && Date.now() - c.t < CACHE_MS) return c;
  const r = await fetch(FEED);
  if (!r.ok) throw new Error('sargazo');
  const { days } = await r.json();
  // El día de hoy en Puerto Plata (no en el celular)
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: VIAJE.zonaHoraria });
  const d = days.find((x) => x.date === hoy) || days[0];
  const n = { nivel: d.sargassum.label, puntaje: d.sargassum.score, fecha: d.date, t: Date.now() };
  try { localStorage.setItem(CLAVE, JSON.stringify(n)); } catch {}
  return n;
}

export default function Sargazo() {
  const [dato, setDato] = useState(null);

  useEffect(() => {
    let vivo = true;
    setDato(leer()); // lo último guardado, por si no hay señal
    traer().then((d) => vivo && setDato(d)).catch(() => {});
    return () => { vivo = false; };
  }, []);

  if (!dato) return null;
  const [texto, color] = NIVELES[dato.nivel] || [dato.nivel, '#999'];

  return (
    <a
      className="clima-chip sargazo"
      href={PAGINA}
      target="_blank"
      rel="noreferrer"
      title={`Sargazo hoy en ${VIAJE.destino.split(',')[0]}: ${texto} (${dato.puntaje}/100). Datos: Veabird`}
    >
      <span className="sargazo-punto" style={{ background: color }} />
      Sargazo <b>{texto}</b>
      <span className="clima-dif">Datos: Veabird</span>
    </a>
  );
}
