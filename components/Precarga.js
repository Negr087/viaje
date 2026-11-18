'use client';
import { useEffect } from 'react';
import { consultas } from '@/lib/consultas';

// Pantallas que tienen que abrir aunque no haya señal (aeropuerto, wifi del resort).
const PAGINAS = ['/', '/info', '/agenda', '/checklist', '/familia', '/excursiones', '/ninera', '/gastos'];
const CADA_MS = 2 * 60 * 60 * 1000; // cada 2 h como mucho

// Con señal, descarga en segundo plano las pantallas y los datos clave para que
// el service worker los guarde. Así la info del viaje queda disponible offline
// aunque nunca hayas entrado a esa sección.
export default function Precarga() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    const correr = async () => {
      if (!navigator.onLine) return;
      try {
        const ultima = Number(localStorage.getItem('precarga_t') || 0);
        if (Date.now() - ultima < CADA_MS) return;
        localStorage.setItem('precarga_t', String(Date.now()));
      } catch {}

      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({ tipo: 'precache', urls: PAGINAS });
      // Las consultas pasan por el service worker, que guarda cada respuesta.
      await Promise.allSettled(Object.values(consultas).map((q) => q()));
    };

    const t = setTimeout(correr, 3000); // que no compita con la carga inicial
    return () => clearTimeout(t);
  }, []);

  return null;
}
