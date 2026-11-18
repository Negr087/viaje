'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SCHEMA, supabase } from '@/lib/supabase';
import { VIAJE } from '@/lib/config';

const DURACION = 5000;
const AGRUPAR_MS = 4000;

// Cómo se anuncia cada tipo de novedad. `autor` = columna con quién lo hizo
// (para no avisarte de lo tuyo). Sin autor, no se avisa si ya estás en esa sección.
const EVENTOS = {
  fotos: {
    href: '/fotos', autor: 'persona_id',
    texto: (q, n, row) => `${q} subió ${n > 1 ? `${n} ${row.es_video ? 'archivos' : 'fotos'}` : row.es_video ? 'un video' : 'una foto'}`,
    icono: '📸',
  },
  gastos: {
    href: '/gastos', autor: 'pagado_por',
    texto: (q, n, row) => n > 1 ? `${q} cargó ${n} gastos` : `${q} cargó "${row.descripcion}"`,
    icono: '💸',
  },
  excursion_votos: {
    href: '/excursiones', autor: 'persona_id',
    texto: (q, n) => n > 1 ? `${q} se anotó a ${n} excursiones` : `${q} se anotó a una excursión`,
    icono: '🚤',
  },
  mensajes: {
    href: '/recuerdo', autor: 'persona_id',
    texto: (q) => `${q} dejó un mensaje para ${VIAJE.homenajeada}`,
    icono: '💌',
  },
  agenda: {
    href: '/agenda',
    texto: (_, n, row) => n > 1 ? `${n} cosas nuevas en la agenda` : `Nuevo en la agenda: ${row.titulo}`,
    icono: '📅',
  },
  turnos_ninera: {
    href: '/ninera',
    texto: () => 'Hay un turno de niñera nuevo',
    icono: '🍼',
  },
};

function EstadoConexion() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const act = () => setOnline(navigator.onLine);
    act();
    window.addEventListener('online', act);
    window.addEventListener('offline', act);
    return () => {
      window.removeEventListener('online', act);
      window.removeEventListener('offline', act);
    };
  }, []);
  if (online) return null;
  return (
    <div className="sin-conexion" role="status">
      <span className="sin-conexion-punto" /> Sin conexión · mostrando lo último guardado
    </div>
  );
}

export default function EnVivo({ yo, mapa }) {
  const pathname = usePathname();
  const [avisos, setAvisos] = useState([]);
  const ctx = useRef({ yo, mapa, pathname });
  useEffect(() => { ctx.current = { yo, mapa, pathname }; });
  const grupos = useRef({});

  const quitar = useCallback((id) => setAvisos((as) => as.filter((a) => a.id !== id)), []);

  useEffect(() => {
    const canal = supabase.channel(`avisos:${Date.now()}`);

    for (const [tabla, ev] of Object.entries(EVENTOS)) {
      canal.on('postgres_changes', { event: 'INSERT', schema: SCHEMA, table: tabla }, ({ new: row }) => {
        const { yo, mapa, pathname } = ctx.current;
        const autorId = ev.autor ? row[ev.autor] : null;
        if (autorId && autorId === yo?.id) return;
        if (!ev.autor && pathname.startsWith(ev.href)) return;

        // Agrupa: si la misma persona sube 6 fotos seguidas, sale un solo aviso que se actualiza.
        const clave = `${tabla}:${autorId || ''}`;
        const g = grupos.current[clave];
        const ahora = Date.now();
        const n = g && ahora - g.t < AGRUPAR_MS ? g.n + 1 : 1;
        const id = n > 1 ? g.id : `${clave}:${ahora}`;
        grupos.current[clave] = { id, n, t: ahora };

        const p = autorId ? mapa[autorId] : null;
        const quien = p?.nombre || 'Alguien';
        const aviso = { id, href: ev.href, icono: p?.emoji || ev.icono, badge: ev.icono, texto: ev.texto(quien, n, row), t: ahora };

        setAvisos((as) => [aviso, ...as.filter((a) => a.id !== id)].slice(0, 3));
        if (navigator.vibrate) navigator.vibrate(12);
      });
    }
    canal.subscribe();
    return () => { supabase.removeChannel(canal); };
  }, []);

  // Cada aviso se va solo a los pocos segundos (se reinicia si se actualiza)
  useEffect(() => {
    if (!avisos.length) return;
    const timers = avisos.map((a) => setTimeout(() => quitar(a.id), Math.max(0, DURACION - (Date.now() - a.t))));
    return () => timers.forEach(clearTimeout);
  }, [avisos, quitar]);

  return (
    <>
      <EstadoConexion />
      <div className="avisos" aria-live="polite">
        {avisos.map((a) => (
          <Link key={a.id + a.t} href={a.href} className="aviso" onClick={() => quitar(a.id)}>
            <span className="aviso-icono">{a.icono}<small>{a.badge}</small></span>
            <span className="aviso-texto">{a.texto}</span>
            <span className="aviso-vivo">en vivo</span>
          </Link>
        ))}
      </div>
    </>
  );
}
