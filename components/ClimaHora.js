'use client';
import { useEffect, useState } from 'react';
import { VIAJE } from '@/lib/config';
import Sargazo from '@/components/Sargazo';

const CACHE_MS = 20 * 60 * 1000;

// Códigos WMO de Open-Meteo → emoji
function iconoClima(code, esDia) {
  if (code === 0) return esDia ? '☀️' : '🌙';
  if (code <= 2) return esDia ? '🌤️' : '☁️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 95) return '⛈️';
  if (code >= 80) return '🌧️';
  if (code >= 51) return esDia ? '🌦️' : '🌧️';
  return '🌡️';
}

async function traerClima() {
  try {
    const c = JSON.parse(sessionStorage.getItem('clima') || 'null');
    if (c && Date.now() - c.t < CACHE_MS) return c;
  } catch {}
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${VIAJE.lat}&longitude=${VIAJE.lon}`
    + `&current=temperature_2m,weather_code,is_day&timezone=${encodeURIComponent(VIAJE.zonaHoraria)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('clima');
  const { current } = await r.json();
  const c = { temp: Math.round(current.temperature_2m), code: current.weather_code, dia: current.is_day === 1, t: Date.now() };
  try { sessionStorage.setItem('clima', JSON.stringify(c)); } catch {}
  return c;
}

// Minutos de diferencia entre la zona del destino y la del celular
function diferenciaMin(ahora) {
  const d = new Date(ahora);
  const destino = new Date(d.toLocaleString('en-US', { timeZone: VIAJE.zonaHoraria }));
  const local = new Date(d.toLocaleString('en-US'));
  return Math.round((destino - local) / 60000);
}

export default function ClimaHora({ ahora }) {
  const [clima, setClima] = useState(null);

  useEffect(() => {
    let vivo = true;
    traerClima().then((c) => vivo && setClima(c)).catch(() => {});
    return () => { vivo = false; };
  }, []);

  const ciudad = VIAJE.destino.split(',')[0];
  const hora = new Date(ahora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: VIAJE.zonaHoraria });
  const dif = diferenciaMin(ahora);
  const difTexto = dif === 0 ? 'misma hora' : `${Math.abs(dif / 60)} h ${dif < 0 ? 'menos' : 'más'}`;

  return (
    <div className="clima">
      {clima && (
        <span className="clima-chip" title={`Clima ahora en ${ciudad}`}>
          {iconoClima(clima.code, clima.dia)} <b>{clima.temp}°</b>
        </span>
      )}
      <span className="clima-chip" title={`Hora en ${ciudad}`}>
        🕐 <b>{hora}</b> allá{dif !== 0 && <span className="clima-dif">{difTexto}</span>}
      </span>
      <Sargazo />
    </div>
  );
}
