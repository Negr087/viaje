'use client';
import { useState } from 'react';
import { Cabecera } from '@/components/ui';
import { VIAJE } from '@/lib/config';
import { HOTEL, DATOS_RAPIDOS, RESTAURANTES, BARES, SECCIONES_INFO, LUGARES } from '@/lib/hotel';

const TABS = [
  ['mapa', '🗺️ Mapa'],
  ['comer', '🍽️ Comer y tomar'],
  ['info', 'ℹ️ Info'],
];

function Mapa() {
  const [sel, setSel] = useState('lobby');
  const lugar = LUGARES.find((l) => l.id === sel);

  return (
    <div className="card">
      <svg className="mapa-hotel" viewBox="0 0 360 540" role="img" aria-label="Mapa aproximado del hotel">
        {/* calle y entrada */}
        <rect className="m-calle" x="0" y="0" width="360" height="22" />
        <text className="m-rotulo" x="12" y="15">Carretera Luperón</text>
        <path className="m-camino" d="M180 22 V80 M180 130 V160 M180 210 V255 M180 345 V410" />
        {/* jardines */}
        <rect className="m-jardin" x="8" y="60" width="344" height="370" rx="26" />
        {/* edificios del frente */}
        <rect className="m-edificio" x="125" y="80" width="110" height="50" rx="10" />
        <rect className="m-edificio" x="38" y="92" width="80" height="52" rx="10" />
        <rect className="m-edificio" x="242" y="92" width="80" height="52" rx="10" />
        <rect className="m-edificio" x="135" y="162" width="90" height="46" rx="10" />
        {/* deportes */}
        <rect className="m-cancha" x="300" y="160" width="46" height="60" rx="4" />
        {/* laguna */}
        <ellipse className="m-agua" cx="92" cy="200" rx="34" ry="20" />
        <text className="m-rotulo" x="72" y="204">laguna</text>
        {/* habitaciones */}
        <rect className="m-hab" x="16" y="232" width="46" height="100" rx="8" />
        <rect className="m-hab" x="298" y="232" width="46" height="100" rx="8" />
        <rect className="m-hab" x="74" y="232" width="34" height="80" rx="8" />
        <rect className="m-hab" x="252" y="232" width="34" height="80" rx="8" />
        {/* pileta alrededor de un jardín */}
        <path className="m-agua" d="M120 262 Q180 236 240 262 Q262 300 240 338 Q180 362 120 338 Q98 300 120 262 Z" />
        <ellipse className="m-jardin-int" cx="180" cy="300" rx="34" ry="22" />
        <circle className="m-agua" cx="92" cy="380" r="16" />
        {/* arena y mar */}
        <path className="m-arena" d="M0 412 Q90 398 180 410 T360 404 V470 H0 Z" />
        <path className="m-mar" d="M0 462 Q60 450 120 462 T240 460 T360 458 V540 H0 Z" />
        <text className="m-rotulo m-rotulo-mar" x="180" y="510" textAnchor="middle">Océano Atlántico</text>

        {LUGARES.map((l) => (
          <g
            key={l.id}
            className={'m-pin' + (l.id === sel ? ' on' : '')}
            transform={`translate(${l.x} ${l.y})`}
            onClick={() => setSel(l.id)}
            role="button"
            tabIndex={0}
            aria-label={l.nombre}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(l.id)}
          >
            <circle r="17" />
            <text textAnchor="middle" dy="6">{l.emoji}</text>
          </g>
        ))}
      </svg>

      {lugar && (
        <div className="mapa-detalle">
          <b>{lugar.emoji} {lugar.nombre}</b>
          <p className="muted" style={{ margin: '0.2rem 0 0' }}>{lugar.texto}</p>
        </div>
      )}

      <div className="chips" style={{ marginTop: '0.8rem' }}>
        {LUGARES.map((l) => (
          <button key={l.id} type="button" className={'chip' + (l.id === sel ? ' on' : '')} onClick={() => setSel(l.id)}>
            {l.emoji} {l.nombre}
          </button>
        ))}
      </div>

      <p className="small muted" style={{ margin: '0.8rem 0 0' }}>
        Es un esquema aproximado armado con descripciones de huéspedes, no el plano oficial.
        Al llegar pedí el mapa impreso en recepción y sacale una foto.
      </p>
    </div>
  );
}

function Comer() {
  return (
    <>
      <div className="card">
        <h2>Restaurantes</h2>
        {RESTAURANTES.map((r) => (
          <div key={r.id} style={{ padding: '0.6rem 0', borderTop: '1px solid var(--linea)' }}>
            <b>{r.emoji} {r.nombre}</b>
            <p className="small" style={{ margin: '0.15rem 0 0' }}>{r.tipo}</p>
            <p className="small muted" style={{ margin: '0.15rem 0 0' }}>🕒 {r.horario} · Reserva: {r.reserva}{r.reserva.startsWith('Sí') && <> (<a href={HOTEL.app} target="_blank" rel="noreferrer">en la app</a>)</>}</p>
            <p className="small muted" style={{ margin: '0.15rem 0 0' }}>{r.nota}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <h2>Bares</h2>
        {BARES.map((b) => (
          <div key={b.id} className="row between" style={{ padding: '0.5rem 0', borderTop: '1px solid var(--linea)' }}>
            <b>{b.emoji} {b.nombre}</b>
            <span className="small muted">{b.donde}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function Info() {
  return (
    <>
      <div className="card">
        <h2>Datos rápidos</h2>
        {DATOS_RAPIDOS.map(([e, t, d]) => (
          <div key={t} className="row between" style={{ padding: '0.45rem 0', borderTop: '1px solid var(--linea)' }}>
            <b>{e} {t}</b>
            <span className="small muted">{d}</span>
          </div>
        ))}
        <div className="row between" style={{ padding: '0.45rem 0', borderTop: '1px solid var(--linea)' }}>
          <b>🔑 Check-in</b><span className="small muted">{HOTEL.checkin}</span>
        </div>
        <div className="row between" style={{ padding: '0.45rem 0', borderTop: '1px solid var(--linea)' }}>
          <b>🧳 Check-out</b><span className="small muted">{HOTEL.checkout}</span>
        </div>
      </div>
      {SECCIONES_INFO.map((s) => (
        <div className="card" key={s.titulo}>
          <h2>{s.titulo}</h2>
          <ul className="lista-hotel">
            {s.items.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      ))}
      <p className="small muted center">Horarios de referencia: pueden cambiar, confirmalos en recepción.</p>
    </>
  );
}

export default function Hotel() {
  const [tab, setTab] = useState('mapa');
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(HOTEL.nombre + ' Puerto Plata')}`;

  return (
    <>
      <Cabecera titulo="Info del hotel" emoji="🏨" />

      <div className="card mar">
        <b>{VIAJE.hotel}</b>
        <p className="small" style={{ margin: '0.2rem 0 0' }}>{HOTEL.direccion}</p>
        <div className="row" style={{ marginTop: '0.6rem' }}>
          <a className="btn chico" href={`tel:${HOTEL.telefono.replace(/\s/g, '')}`}>📞 Llamar</a>
          <a className="btn chico" href={maps} target="_blank" rel="noreferrer">📍 Cómo llegar</a>
          <a className="btn chico" href={HOTEL.web} target="_blank" rel="noreferrer">🌐 Web</a>
        </div>
        <p className="small muted" style={{ margin: '0.5rem 0 0' }}>✓ Esta sección se ve aunque no haya señal.</p>
      </div>

      <div className="card">
        <h2>📲 App de Iberostar</h2>
        <p className="small" style={{ margin: '0.2rem 0 0.6rem' }}>
          Con la app reservamos los restaurantes a la carta (Mare Nostrum, La Hacienda, Sakura) y vemos
          las actividades del día. Bajala antes de viajar e iniciá sesión con el número de reserva.
        </p>
        <div className="row">
          <a className="btn" href={HOTEL.app} target="_blank" rel="noreferrer">▶️ Descargar en Play Store</a>
          <a className="small muted" href={HOTEL.appIos} target="_blank" rel="noreferrer">¿iPhone? App Store</a>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'mapa' && <Mapa />}
      {tab === 'comer' && <Comer />}
      {tab === 'info' && <Info />}
    </>
  );
}
