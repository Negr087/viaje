'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePersonas } from '@/components/PersonaProvider';
import { Cabecera, Vacio } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import { consultas } from '@/lib/consultas';
import { TIPOS } from '@/lib/config';

const EMOJIS = ['🙂', '😎', '👩', '👨', '👵', '👴', '👧', '👦', '👶', '🧔', '👱‍♀️', '🧑‍🦱', '🦩', '🐢', '🌺', '⚽'];
const VACIA = { nombre: '', nucleo: '', tipo: 'adulto', emoji: '🙂' };

export default function Familia() {
  const { personas, recargar, yo, cambiar } = usePersonas();
  const [habitaciones, setHabitaciones] = useState([]);
  const [nueva, setNueva] = useState(VACIA);
  const [hab, setHab] = useState('');

  const cargarHab = useCallback(async () => {
    const { data } = await consultas.habitaciones();
    setHabitaciones(data || []);
  }, []);

  useEffect(() => { cargarHab(); }, [cargarHab]);
  useEnVivo(['habitaciones'], cargarHab);

  async function agregarPersona(e) {
    e.preventDefault();
    if (!nueva.nombre.trim()) return;
    await supabase.from('personas').insert({ ...nueva, nombre: nueva.nombre.trim(), nucleo: nueva.nucleo.trim() || null });
    setNueva({ ...VACIA, nucleo: nueva.nucleo }); // mantiene el núcleo para cargar rápido
    recargar();
  }

  async function actualizar(id, cambios) {
    await supabase.from('personas').update(cambios).eq('id', id);
    recargar();
  }

  async function borrarPersona(p) {
    if (!confirm(`¿Borrar a ${p.nombre}? Se borran también su checklist y sus votos.`)) return;
    await supabase.from('personas').delete().eq('id', p.id);
    recargar();
  }

  async function agregarHab(e) {
    e.preventDefault();
    if (!hab.trim()) return;
    await supabase.from('habitaciones').insert({ nombre: hab.trim() });
    setHab('');
    cargarHab();
  }

  async function borrarHab(id) {
    if (!confirm('¿Borrar la habitación?')) return;
    await supabase.from('habitaciones').delete().eq('id', id);
    cargarHab(); recargar();
  }

  const nucleos = [...new Set(personas.map((p) => p.nucleo).filter(Boolean))];
  const cuenta = Object.fromEntries(Object.keys(TIPOS).map((t) => [t, personas.filter((p) => p.tipo === t).length]));

  return (
    <>
      <Cabecera titulo="Familia" emoji="🛏️" />

      <div className="card mar">
        <b>{personas.length} viajeros</b>
        <p style={{ margin: 0 }}>{cuenta.adulto} adultos · {cuenta.nino} niños · {cuenta.bebe} bebés</p>
        {yo && (
          <p style={{ margin: '0.5rem 0 0' }}>
            Estás como <b>{yo.nombre}</b> · <button className="btn chico ghost" style={{ color: 'white', borderColor: 'white' }} onClick={cambiar}>Cambiar</button>
          </p>
        )}
      </div>

      <form className="card stack" onSubmit={agregarPersona}>
        <h2>Agregar persona</h2>
        <input placeholder="Nombre" value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} />
        <input placeholder="Familia / núcleo (ej: Los Ibáñez)" list="nucleos" value={nueva.nucleo} onChange={(e) => setNueva({ ...nueva, nucleo: e.target.value })} />
        <datalist id="nucleos">{nucleos.map((n) => <option key={n} value={n} />)}</datalist>
        <div className="row">
          <select className="grow" style={{ width: 'auto' }} value={nueva.tipo} onChange={(e) => setNueva({ ...nueva, tipo: e.target.value })}>
            {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select style={{ width: '80px' }} value={nueva.emoji} onChange={(e) => setNueva({ ...nueva, emoji: e.target.value })}>
            {EMOJIS.map((em) => <option key={em}>{em}</option>)}
          </select>
        </div>
        <button className="btn">Agregar</button>
      </form>

      <div className="card">
        <h2>Habitaciones</h2>
        <form className="row" onSubmit={agregarHab} style={{ marginBottom: '0.5rem' }}>
          <input className="grow" style={{ width: 'auto' }} placeholder="Ej: Hab. 214" value={hab} onChange={(e) => setHab(e.target.value)} />
          <button className="btn">+</button>
        </form>
        {habitaciones.length === 0 && <p className="muted small">Cuando tengan los números de habitación, cargalos y asigná a cada uno abajo.</p>}
        {habitaciones.map((h) => {
          const adentro = personas.filter((p) => p.habitacion_id === h.id);
          return (
            <div key={h.id} className="row between" style={{ padding: '0.4rem 0', borderTop: '1px solid var(--linea)' }}>
              <div>
                <b>{h.nombre}</b>
                <div className="small muted">{adentro.length ? adentro.map((p) => `${p.emoji} ${p.nombre}`).join('  ') : 'vacía'}</div>
              </div>
              <button className="icon-btn" onClick={() => borrarHab(h.id)}>🗑️</button>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2>Todos</h2>
        {personas.length === 0 && <Vacio>Todavía no hay nadie. ¡Cargá a los 14!</Vacio>}
        {personas.map((p) => (
          <div key={p.id} style={{ padding: '0.6rem 0', borderTop: '1px solid var(--linea)' }}>
            <div className="row between">
              <b>{p.emoji} {p.nombre}</b>
              <div className="row">
                <span className="tag">{TIPOS[p.tipo]}</span>
                {p.nucleo && <span className="tag coral">{p.nucleo}</span>}
                <button className="icon-btn" onClick={() => borrarPersona(p)}>🗑️</button>
              </div>
            </div>
            <div className="row" style={{ marginTop: '0.4rem' }}>
              <select className="grow" style={{ width: 'auto' }} value={p.habitacion_id || ''} onChange={(e) => actualizar(p.id, { habitacion_id: e.target.value || null })}>
                <option value="">Sin habitación</option>
                {habitaciones.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
              </select>
              <select style={{ width: '80px' }} value={p.emoji || '🙂'} onChange={(e) => actualizar(p.id, { emoji: e.target.value })}>
                {EMOJIS.map((em) => <option key={em}>{em}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
