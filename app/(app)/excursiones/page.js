'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePersonas } from '@/components/PersonaProvider';
import { Cabecera, Vacio, nombres } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import { consultas } from '@/lib/consultas';
import { VIAJE, diasDelViaje, fmtDia } from '@/lib/config';

const VACIA = { nombre: '', descripcion: '', precio: '', apto_chicos: true, fecha: '' };

export default function Excursiones() {
  const { yo, mapa } = usePersonas();
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(VACIA);
  const [abierto, setAbierto] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await consultas.excursiones();
    setLista(data || []);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEnVivo(['excursiones', 'excursion_votos'], cargar);

  async function toggleVoy(ex) {
    if (!yo) return;
    const voy = ex.excursion_votos.some((v) => v.persona_id === yo.id);
    if (voy) await supabase.from('excursion_votos').delete().match({ excursion_id: ex.id, persona_id: yo.id });
    else await supabase.from('excursion_votos').insert({ excursion_id: ex.id, persona_id: yo.id });
    cargar();
  }

  async function guardar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    await supabase.from('excursiones').insert({
      ...form,
      precio: form.precio === '' ? null : Number(form.precio),
      fecha: form.fecha || null,
    });
    setForm(VACIA); setAbierto(false);
    cargar();
  }

  async function actualizar(id, cambios) {
    await supabase.from('excursiones').update(cambios).eq('id', id);
    cargar();
  }

  async function borrar(id) {
    if (!confirm('¿Borrar la excursión?')) return;
    await supabase.from('excursiones').delete().eq('id', id);
    cargar();
  }

  const ordenadas = [...lista].sort((a, b) => b.excursion_votos.length - a.excursion_votos.length);

  return (
    <>
      <Cabecera titulo="Excursiones" emoji="🚤">
        <button className="btn chico" onClick={() => setAbierto(!abierto)}>{abierto ? 'Cerrar' : '+ Proponer'}</button>
      </Cabecera>

      {abierto && (
        <form className="card stack" onSubmit={guardar}>
          <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <textarea placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <input type="number" placeholder={`Precio por persona (${VIAJE.moneda})`} value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
          <label className="check-label">
            <input type="checkbox" checked={form.apto_chicos} onChange={(e) => setForm({ ...form, apto_chicos: e.target.checked })} />
            Apta para chicos
          </label>
          <button className="btn">Proponer</button>
        </form>
      )}

      {lista.length === 0 && <Vacio>No hay excursiones todavía.</Vacio>}

      {ordenadas.map((ex) => {
        const ids = ex.excursion_votos.map((v) => v.persona_id);
        const voy = yo && ids.includes(yo.id);
        return (
          <div key={ex.id} className="card">
            <div className="row between">
              <h2 style={{ margin: 0 }}>{ex.nombre}</h2>
              <button className="icon-btn" onClick={() => borrar(ex.id)}>🗑️</button>
            </div>
            <div className="row" style={{ margin: '0.4rem 0' }}>
              {ex.apto_chicos ? <span className="tag">👨‍👩‍👧 Familiar</span> : <span className="tag coral">🧑 Solo adultos</span>}
              {ex.precio != null && <span className="tag">{VIAJE.moneda} {ex.precio} c/u</span>}
              {ex.fecha && <span className="tag">📅 {fmtDia(ex.fecha)}</span>}
            </div>
            {ex.descripcion && <p className="muted">{ex.descripcion}</p>}
            <p className="small"><b>{ids.length} anotados</b>{ids.length ? `: ${nombres(ids, mapa)}` : ''}</p>
            <div className="row">
              <button className={'btn ' + (voy ? 'ghost' : 'coral')} onClick={() => toggleVoy(ex)}>
                {voy ? '✓ Voy (desanotarme)' : '¡Me anoto!'}
              </button>
              <select className="grow" style={{ width: 'auto' }} value={ex.fecha || ''} onChange={(e) => actualizar(ex.id, { fecha: e.target.value || null })}>
                <option value="">Sin fecha</option>
                {diasDelViaje().map((d) => <option key={d} value={d}>{fmtDia(d)}</option>)}
              </select>
            </div>
          </div>
        );
      })}
    </>
  );
}
