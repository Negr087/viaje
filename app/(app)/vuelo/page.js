'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Cabecera } from '@/components/ui';
import { AEROPUERTOS, VUELOS } from '@/lib/config';
import { PAISES } from '@/lib/mapa-americas';

// ---------- Geometría ----------
// Proyección equirectangular simple: alcanza para una franja de Sudamérica al Caribe.
const LON0 = -92, LON1 = -52, LAT0 = -38, LAT1 = 25, K = 8;
const ANCHO = (LON1 - LON0) * K, ALTO = (LAT1 - LAT0) * K;
const px = (lon, lat) => [(lon - LON0) * K, (LAT1 - lat) * K];

const RAD = Math.PI / 180;
const R_TIERRA = 6371;

function distanciaKm(a, b) {
  const dLat = (b.lat - a.lat) * RAD, dLon = (b.lon - a.lon) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R_TIERRA * Math.asin(Math.sqrt(h));
}

// Punto intermedio sobre el círculo máximo (la ruta "recta" de los aviones).
function intermedio(a, b, f) {
  const φ1 = a.lat * RAD, λ1 = a.lon * RAD, φ2 = b.lat * RAD, λ2 = b.lon * RAD;
  const δ = distanciaKm(a, b) / R_TIERRA;
  if (δ === 0) return { lat: a.lat, lon: a.lon };
  const A = Math.sin((1 - f) * δ) / Math.sin(δ), B = Math.sin(f * δ) / Math.sin(δ);
  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
  const z = A * Math.sin(φ1) + B * Math.sin(φ2);
  return { lat: Math.atan2(z, Math.hypot(x, y)) / RAD, lon: Math.atan2(y, x) / RAD };
}

const PASOS = 120;
function puntosDelTramo(t) {
  const a = AEROPUERTOS[t.desde], b = AEROPUERTOS[t.hasta];
  return Array.from({ length: PASOS + 1 }, (_, i) => intermedio(a, b, i / PASOS));
}

function dentro(lon, lat, anillo) {
  let adentro = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i], [xj, yj] = anillo[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) adentro = !adentro;
  }
  return adentro;
}

function dondeEstamos({ lat, lon }) {
  const p = PAISES.find((pa) => pa.p.some((an) => dentro(lon, lat, an)));
  if (p) return p.n;
  if (lat > 10 && lon > -85) return 'el mar Caribe';
  if (lon < -77) return 'el océano Pacífico';
  return 'el mar';
}

// ---------- Formatos ----------
const ms = (iso) => new Date(iso).getTime();
const fmtHora = (t) => new Date(t).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Cordoba' });
const fmtKm = (km) => `${Math.round(km).toLocaleString('es-AR')} km`;
function fmtDur(min) {
  min = Math.max(0, Math.round(min));
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
}

// ---------- Estado del viaje según el reloj ----------
function estimarPorHorario(tramos, ahora) {
  for (let i = 0; i < tramos.length; i++) {
    const t = tramos[i], s = ms(t.sale), l = ms(t.llega);
    if (ahora < s) return i === 0 ? { fase: 'antes', tramo: 0, f: 0 } : { fase: 'escala', tramo: i - 1, f: 1 };
    if (ahora <= l) return { fase: 'volando', tramo: i, f: (ahora - s) / (l - s) };
  }
  return { fase: 'llegamos', tramo: tramos.length - 1, f: 1 };
}

// Ubica una posición GPS sobre la ruta: tramo más cercano y cuánto se avanzó.
function ubicarEnRuta(rutas, pos) {
  let mejor = null;
  rutas.forEach((pts, tramo) => {
    pts.forEach((p, i) => {
      const d = distanciaKm(p, pos);
      if (!mejor || d < mejor.d) mejor = { d, tramo, f: i / PASOS };
    });
  });
  return mejor;
}

const CLAVE_GPS = 'vuelo_ultimo_gps';

// Contornos de los países ya proyectados (se calculan una sola vez)
const FONDO_PAISES = PAISES.map((pa) => ({
  n: pa.n,
  d: pa.p.map((an) => 'M' + an.map(([lo, la]) => px(lo, la).map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z').join(''),
}));

export default function Vuelo() {
  // Arranca en null para que lo prerenderizado no choque con la hora del celular.
  const [ahora, setAhora] = useState(null);
  const [sentido, setSentido] = useState('ida');
  const [gps, setGps] = useState(null);
  const [siguiendo, setSiguiendo] = useState(false);
  const [error, setError] = useState('');
  const watchId = useRef(null);

  const tramos = VUELOS[sentido];
  const rutas = useMemo(() => tramos.map(puntosDelTramo), [tramos]);
  const largos = useMemo(() => tramos.map((t) => distanciaKm(AEROPUERTOS[t.desde], AEROPUERTOS[t.hasta])), [tramos]);

  useEffect(() => {
    setAhora(Date.now());
    // Pasada la mitad del viaje, mostrar directamente la vuelta
    if (Date.now() > ms(VUELOS.vuelta[0].sale) - 2 * 864e5) setSentido('vuelta');
    const t = setInterval(() => setAhora(Date.now()), 15000);
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE_GPS) || 'null');
      if (guardado && Date.now() - guardado.t < 6 * 3600e3) setGps(guardado);
    } catch {}
    return () => { clearInterval(t); if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current); };
  }, []);

  function alternarGps() {
    if (siguiendo) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setSiguiendo(false);
      return;
    }
    if (!('geolocation' in navigator)) { setError('Este celular no deja usar la ubicación desde el navegador.'); return; }
    setError('');
    setSiguiendo(true);
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        const g = {
          lat: p.coords.latitude, lon: p.coords.longitude,
          vel: p.coords.speed, alt: p.coords.altitude, rumbo: p.coords.heading,
          precision: p.coords.accuracy, t: p.timestamp,
        };
        setGps(g); setError('');
        try { localStorage.setItem(CLAVE_GPS, JSON.stringify(g)); } catch {}
      },
      (e) => setError(e.code === 1
        ? 'No diste permiso de ubicación. Activalo en los ajustes del navegador para esta página.'
        : 'Todavía no hay señal de GPS. Probá con el celular pegado a la ventanilla y esperá un par de minutos.'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 120000 },
    );
  }

  if (ahora == null) return <Cabecera titulo="Mapa del vuelo" emoji="🛫" />;

  // ¿Dónde está el avión? Con GPS reciente, la posición real; si no, según el horario.
  const gpsFresco = gps && ahora - gps.t < 15 * 60e3;
  const porHorario = estimarPorHorario(tramos, ahora);
  let tramo, f, pos, fuente;
  if (gpsFresco) {
    const u = ubicarEnRuta(rutas, gps);
    tramo = u.tramo; f = u.f; pos = gps; fuente = 'gps';
  } else {
    tramo = porHorario.tramo; f = porHorario.f;
    pos = rutas[tramo][Math.round(f * PASOS)]; fuente = 'horario';
  }
  const t = tramos[tramo];
  const destinoTramo = AEROPUERTOS[t.hasta];
  const faltaTramo = distanciaKm(pos, destinoTramo);
  const faltaTotal = faltaTramo + largos.slice(tramo + 1).reduce((a, b) => a + b, 0);
  const total = largos.reduce((a, b) => a + b, 0);
  const hecho = Math.min(1, Math.max(0, 1 - faltaTotal / total));
  const velKmh = gpsFresco && gps.vel != null ? gps.vel * 3.6 : null;
  const etaMin = velKmh && velKmh > 200 ? (faltaTramo / velKmh) * 60 : (ms(t.llega) - ahora) / 60e3;

  // Rumbo del avioncito: hacia el siguiente punto de la ruta
  const sig = rutas[tramo][Math.min(PASOS, Math.round(f * PASOS) + 1)];
  const [x, y] = px(pos.lon, pos.lat);
  const [sx, sy] = px(sig.lon, sig.lat);
  const angulo = gpsFresco && gps.rumbo != null && !Number.isNaN(gps.rumbo)
    ? gps.rumbo
    : (Math.atan2(sx - x, -(sy - y)) * 180) / Math.PI;


  let titular;
  if (fuente === 'gps') titular = `Volando sobre ${dondeEstamos(pos)}`;
  else if (porHorario.fase === 'antes') titular = `Todavía no despegamos: sale ${tramos[0].vuelo} a las ${fmtHora(ms(tramos[0].sale))}`;
  else if (porHorario.fase === 'escala') titular = `Escala en ${AEROPUERTOS[t.hasta].nombre}`;
  else if (porHorario.fase === 'llegamos') titular = `¡Llegamos a ${AEROPUERTOS[t.hasta].nombre}!`;
  else titular = `Más o menos sobre ${dondeEstamos(pos)}`;

  return (
    <>
      <Cabecera titulo="Mapa del vuelo" emoji="🛫" />

      <div className="tabs">
        {[['ida', '🛫 Ida'], ['vuelta', '🛬 Vuelta']].map(([k, l]) => (
          <button key={k} type="button" className={'tab' + (sentido === k ? ' on' : '')} onClick={() => setSentido(k)}>{l}</button>
        ))}
      </div>

      <div className="card">
        <b>{titular}</b>
        <p className="small muted" style={{ margin: '0.2rem 0 0.7rem' }}>
          {fuente === 'gps'
            ? `📡 Posición real del GPS (±${Math.round(gps.precision)} m), hace ${Math.max(0, Math.round((ahora - gps.t) / 60e3))} min`
            : '🕒 Posición estimada por el horario del vuelo'}
        </p>

        <svg className="mapa-vuelo" viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label="Mapa de la ruta del vuelo">
          <rect className="mv-mar" width={ANCHO} height={ALTO} />
          {FONDO_PAISES.map((p) => <path key={p.n} className="mv-pais" d={p.d} />)}

          {rutas.map((pts, i) => (
            <polyline key={i} className="mv-ruta" points={pts.map((p) => px(p.lon, p.lat).join(',')).join(' ')} />
          ))}
          {/* tramo ya recorrido */}
          <polyline
            className="mv-hecho"
            points={[
              ...rutas.slice(0, tramo).flat(),
              ...rutas[tramo].slice(0, Math.round(f * PASOS) + 1),
            ].map((p) => px(p.lon, p.lat).join(',')).join(' ')}
          />

          {Object.entries(AEROPUERTOS).map(([cod, a]) => {
            const [ax, ay] = px(a.lon, a.lat);
            return (
              <g key={cod}>
                <circle className="mv-aero" cx={ax} cy={ay} r="5" />
                <text className="mv-rotulo" x={ax + 8} y={ay + 4}>{a.nombre}</text>
              </g>
            );
          })}

          <g transform={`translate(${x} ${y}) rotate(${angulo})`}>
            <circle className="mv-halo" r="16" />
            <path className="mv-avion" d="M0 -12 L3 -3 L12 2 L12 5 L3 2 L2 9 L5 12 L5 14 L0 12.5 L-5 14 L-5 12 L-2 9 L-3 2 L-12 5 L-12 2 L-3 -3 Z" />
          </g>
        </svg>

        <div className="progreso" style={{ marginTop: '0.8rem' }}>
          <div className="progreso-barra" style={{ width: `${Math.round(hecho * 100)}%` }} />
        </div>
        <p className="small muted center" style={{ margin: '0.3rem 0 0' }}>{Math.round(hecho * 100)}% del viaje</p>

        <div className="vuelo-datos">
          <div><span>Faltan a {destinoTramo.nombre.split(' (')[0]}</span><b>{fmtKm(faltaTramo)}</b></div>
          <div><span>Llegada {velKmh ? 'según velocidad' : 'prevista'}</span><b>{porHorario.fase === 'llegamos' && !gpsFresco ? '—' : fmtDur(etaMin)}</b></div>
          <div><span>Velocidad</span><b>{velKmh != null ? `${Math.round(velKmh)} km/h` : '—'}</b></div>
          <div><span>Altura</span><b>{gpsFresco && gps.alt != null ? `${Math.round(gps.alt).toLocaleString('es-AR')} m` : '—'}</b></div>
        </div>

        <button type="button" className={'btn' + (siguiendo ? ' ghost' : '')} style={{ width: '100%', marginTop: '0.9rem' }} onClick={alternarGps}>
          {siguiendo ? '⏸️ Dejar de usar el GPS' : '📡 Usar el GPS del celular'}
        </button>
        {siguiendo && !gpsFresco && !error && <p className="small muted center" style={{ margin: '0.5rem 0 0' }}>Buscando satélites… puede tardar unos minutos.</p>}
        {error && <p className="small error" style={{ margin: '0.5rem 0 0' }}>{error}</p>}
      </div>

      <div className="card">
        <h2>Tramos</h2>
        {tramos.map((tr, i) => (
          <div key={i} style={{ padding: '0.55rem 0', borderTop: '1px solid var(--linea)' }}>
            <div className="row between">
              <b>{AEROPUERTOS[tr.desde].nombre.split(' (')[0]} → {AEROPUERTOS[tr.hasta].nombre.split(' (')[0]}</b>
              <span className="tag">{tr.vuelo}</span>
            </div>
            <p className="small muted" style={{ margin: '0.15rem 0 0' }}>
              Sale {fmtHora(ms(tr.sale))}{tr.estimado === 'todo' || tr.estimado === 'salida' ? ' (estimado)' : ''} ·
              llega {fmtHora(ms(tr.llega))}{tr.estimado === 'todo' || tr.estimado === 'llegada' ? ' (estimado)' : ''} ·
              {' '}{fmtKm(largos[i])}
            </p>
          </div>
        ))}
        <p className="small muted" style={{ margin: '0.5rem 0 0' }}>Horarios en hora de Argentina.</p>
      </div>

      <div className="card">
        <h2>📡 Cómo usarlo en el avión</h2>
        <ul className="lista-hotel">
          <li>Antes de viajar, con internet, abrí esta pantalla y tocá “Usar el GPS” para dar el permiso de ubicación.</li>
          <li>En el avión: modo avión sí, pero dejá la <b>Ubicación</b> prendida (en Android, desde el panel de arriba).</li>
          <li>El GPS no usa internet: escucha a los satélites. Funciona mejor con el celular cerca de la ventanilla.</li>
          <li>Si no agarra señal, el mapa muestra igual una posición estimada por el horario.</li>
          <li>El GPS gasta batería: apagalo cuando no estés mirando.</li>
        </ul>
      </div>
    </>
  );
}
