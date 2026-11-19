'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { usePersonas } from '@/components/PersonaProvider';
import { Progreso } from '@/components/ui';
import Olas from '@/components/Olas';
import TemaToggle from '@/components/TemaToggle';
import ClimaHora from '@/components/ClimaHora';
import Notificaciones from '@/components/Notificaciones';
import { useEnVivo } from '@/lib/en-vivo';
import { supabase } from '@/lib/supabase';
import { VIAJE, diasDelViaje, estadoViaje, fmtDia, hoyISO, numeroDeDia } from '@/lib/config';

const SECCIONES = [
  ['/info', '✈️', 'Info del viaje', 'Vuelos, hotel, contactos'],
  ['/checklist', '✅', 'Checklist', 'Qué llevar, por persona'],
  ['/familia', '🛏️', 'Familia', 'Quién va y habitaciones'],
  ['/excursiones', '🚤', 'Excursiones', 'Anotate a las que vas'],
  ['/fotos', '📸', 'Álbum', 'Fotos de todos'],
  ['/agenda', '📅', 'Agenda', 'Qué hacemos hoy'],
  ['/ninera', '🍼', 'Turnos de niñera', 'Noches libres por pareja'],
  ['/gastos', '💸', 'Gastos extra', 'Quién le debe a quién'],
  ['/desafios', '🎯', 'Desafíos', '3 por día, sumá puntos'],
  ['/premios', '🏆', 'Premios', 'Votá al más quemado'],
  ['/recuerdo', '💌', `Para ${VIAJE.homenajeada}`, 'Mensajes y lo mejor del viaje'],
];

function useAhora() {
  const [ahora, setAhora] = useState(null);
  useEffect(() => {
    setAhora(Date.now());
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return ahora;
}

// La portada cambia con la hora del día: amanecer, día, atardecer y noche estrellada.
function faseDelDia(ahora) {
  const h = new Date(ahora).getHours();
  if (h >= 5 && h < 8) return 'amanecer';
  if (h >= 8 && h < 17) return 'dia';
  if (h >= 17 && h < 20) return 'atardecer';
  return 'noche';
}

const SALUDOS = { amanecer: 'Buen día', dia: 'Hola', atardecer: 'Buenas tardes', noche: 'Buenas noches' };

function Cielo() {
  return (
    <>
      <span className="hero-astro" aria-hidden="true" />
      <span className="hero-estrellas" aria-hidden="true" />
    </>
  );
}

function Hero({ ahora }) {
  if (ahora === null) return <div className="hero fase-dia"><Cielo /><p className="hero-kicker">{VIAJE.destino}</p><h1>{VIAJE.nombre}</h1><Olas /></div>;
  const clase = `hero fase-${faseDelDia(ahora)}`;

  const estado = estadoViaje();

  if (estado === 'durante') {
    const n = numeroDeDia(hoyISO());
    return (
      <div className={clase}>
        <Cielo />
        <ClimaHora ahora={ahora} />
        <p className="hero-kicker">¡Estamos en {VIAJE.destino.split(',')[0]}! 🏝️</p>
        <h1>Día {n} de {diasDelViaje().length}</h1>
        <p style={{ textTransform: 'capitalize' }}>{fmtDia(hoyISO(), true)}</p>
        <Olas />
      </div>
    );
  }

  if (estado === 'despues') {
    return (
      <div className={clase}>
        <Cielo />
        <p className="hero-kicker">{VIAJE.nombre}</p>
        <h1>¡Qué viaje! 🧡</h1>
        <p>Ya volvimos. Mirá el recuerdo armado entre todos.</p>
        <Link href="/recuerdo" className="btn" style={{ marginTop: '0.5rem' }}>Ver el recuerdo</Link>
        <Olas />
      </div>
    );
  }

  const objetivo = new Date(`${VIAJE.inicio}T${VIAJE.horaSalida}:00-03:00`).getTime();
  let resto = Math.max(0, Math.floor((objetivo - ahora) / 1000));
  const d = Math.floor(resto / 86400); resto %= 86400;
  const h = Math.floor(resto / 3600); resto %= 3600;
  const m = Math.floor(resto / 60);
  const s = resto % 60;

  return (
    <div className={clase}>
      <Cielo />
      <ClimaHora ahora={ahora} />
      <p className="hero-kicker">Cuenta regresiva</p>
      <h1>{VIAJE.destino.split(',')[0]}</h1>
      <div className="cuenta">
        <div><b key={'d' + d}>{d}</b><span>días</span></div>
        <div><b key={'h' + h}>{String(h).padStart(2, '0')}</b><span>horas</span></div>
        <div><b key={'m' + m}>{String(m).padStart(2, '0')}</b><span>min</span></div>
        <div><b key={'s' + s}>{String(s).padStart(2, '0')}</b><span>seg</span></div>
      </div>
      <Olas />
    </div>
  );
}

export default function Inicio() {
  const { yo, cambiar } = usePersonas();
  const [check, setCheck] = useState(null);
  const [proximos, setProximos] = useState([]);
  const ahora = useAhora();
  const fase = ahora === null ? 'dia' : faseDelDia(ahora);
  const yoId = yo?.id;

  const cargarCheck = useCallback(async () => {
    if (!yoId) return;
    const { data } = await supabase.from('checklist_items').select('hecho').eq('persona_id', yoId);
    setCheck(data || []);
  }, [yoId]);

  const cargarAgenda = useCallback(async () => {
    const { data } = await supabase.from('agenda').select('*').gte('fecha', hoyISO())
      .order('fecha').order('hora', { nullsFirst: true }).limit(3);
    setProximos(data || []);
  }, []);

  useEffect(() => { cargarCheck(); }, [cargarCheck]);
  useEffect(() => { cargarAgenda(); }, [cargarAgenda]);
  useEnVivo(['checklist_items'], cargarCheck);
  useEnVivo(['agenda'], cargarAgenda);

  const hechos = check?.filter((c) => c.hecho).length || 0;

  return (
    <>
      <div className="saludo">
        <h2>
          <small>{VIAJE.nombre}</small>
          {SALUDOS[fase]}{yo ? `, ${yo.nombre}` : ''} {yo?.emoji || '👋'}
        </h2>
        <div className="saludo-acciones">
          <button className="btn ghost chico" onClick={cambiar}>{yo ? 'No soy yo' : '¿Quién sos?'}</button>
          <TemaToggle />
        </div>
      </div>

      <Hero ahora={ahora} />

      <Notificaciones yo={yo} />

      {estadoViaje() === 'antes' && check && (
        <Link href="/checklist" className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div className="row between">
            <b>Tu checklist</b>
            <span className="muted small">{check.length ? `${hechos}/${check.length}` : 'Sin armar'}</span>
          </div>
          {check.length > 0 && <div style={{ marginTop: '0.5rem' }}><Progreso valor={hechos} total={check.length} /></div>}
        </Link>
      )}

      {proximos.length > 0 && (
        <div className="card">
          <b>Próximo en la agenda</b>
          <ul className="lista">
            {proximos.map((a) => (
              <li key={a.id}>
                <span className="tag">{fmtDia(a.fecha)}{a.hora ? ` · ${a.hora.slice(0, 5)}` : ''}</span>
                <span>{a.titulo}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="secciones-titulo">Todo el viaje</p>
      <div className="secciones">
        {SECCIONES.map(([href, icono, titulo, sub], i) => (
          <Link key={href} href={href} className={`seccion tono-${i % 6}`} style={{ '--i': i }}>
            <span className="seccion-icono">{icono}</span>
            <b>{titulo}</b>
            <span>{sub}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
