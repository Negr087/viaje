'use client';
import { useEffect, useRef } from 'react';
import { SCHEMA, supabase } from './supabase';

let n = 0;

// Escucha cambios en las tablas indicadas (Supabase Realtime) y llama a `alCambiar`.
// Agrupa ráfagas (ej: 5 fotos subidas juntas) en una sola recarga.
// También recarga al volver a la app, por si se perdió algún evento con el celu bloqueado.
export function useEnVivo(tablas, alCambiar) {
  const ref = useRef(alCambiar);
  useEffect(() => { ref.current = alCambiar; });

  const clave = tablas.join(',');

  useEffect(() => {
    if (!clave) return;
    let t;
    const disparar = () => {
      clearTimeout(t);
      t = setTimeout(() => ref.current?.(), 350);
    };

    const canal = supabase.channel(`vivo:${clave}:${++n}`);
    for (const table of clave.split(',')) {
      canal.on('postgres_changes', { event: '*', schema: SCHEMA, table }, disparar);
    }
    canal.subscribe();

    const alVolver = () => { if (document.visibilityState === 'visible') disparar(); };
    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('online', disparar);

    return () => {
      clearTimeout(t);
      supabase.removeChannel(canal);
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener('online', disparar);
    };
  }, [clave]);
}
