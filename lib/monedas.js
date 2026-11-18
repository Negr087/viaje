'use client';
import { useEffect, useState } from 'react';

// Cotizaciones: USD→DOP de open.er-api.com y los dólares de Argentina de dolarapi.com.
// Ambas son gratis, sin registro. Se guardan en el celular para usarlas sin señal.
const CLAVE = 'cotizaciones';
const VIGENCIA_MS = 3 * 60 * 60 * 1000;

export const TIPOS_ARS = [
  ['tarjeta', 'Tarjeta'],
  ['blue', 'Blue'],
  ['bolsa', 'MEP'],
  ['oficial', 'Oficial'],
];

function leer() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch { return null; }
}

async function traer() {
  const [dop, ars] = await Promise.all([
    fetch('https://open.er-api.com/v6/latest/USD').then((r) => r.json()),
    fetch('https://dolarapi.com/v1/dolares').then((r) => r.json()),
  ]);
  if (dop?.result !== 'success' || !Array.isArray(ars)) throw new Error('cotizaciones');
  const c = {
    DOP: dop.rates.DOP,
    ARS: Object.fromEntries(ars.filter((x) => x.venta).map((x) => [x.casa, x.venta])),
    t: Date.now(),
  };
  try { localStorage.setItem(CLAVE, JSON.stringify(c)); } catch {}
  return c;
}

export function useCotizaciones() {
  const [cot, setCot] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const guardada = leer();
    if (guardada) setCot(guardada);
    if (guardada && Date.now() - guardada.t < VIGENCIA_MS) return;
    traer().then(setCot).catch(() => setError(true));
  }, []);

  return { cot, error };
}

// Convierte pasando por USD. `tipoArs`: qué dólar usar para los pesos argentinos.
export function convertir(monto, de, a, cot, tipoArs = 'tarjeta') {
  if (!cot || !Number.isFinite(monto)) return null;
  const ars = cot.ARS[tipoArs] || cot.ARS.oficial;
  const porUsd = { USD: 1, DOP: cot.DOP, ARS: ars };
  if (!porUsd[de] || !porUsd[a]) return null;
  return (monto / porUsd[de]) * porUsd[a];
}
