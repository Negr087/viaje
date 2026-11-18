'use client';
import { useCallback, useEffect, useState } from 'react';
import { Cabecera, Vacio } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import { consultas } from '@/lib/consultas';
import { VIAJE } from '@/lib/config';

const CATS = {
  vuelo: '✈️ Vuelos',
  hotel: '🏨 Hotel',
  contacto: '📞 Contactos',
  documento: '📄 Documentos y trámites',
  otro: '📌 Otros',
};

const VACIO = { categoria: 'vuelo', titulo: '', detalle: '', nucleo: '' };

export default function Info() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

  const cargar = useCallback(async () => {
    const { data } = await consultas.info();
    setItems(data || []);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEnVivo(['info_items'], cargar);

  async function guardar(e) {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    const datos = { ...form, nucleo: form.nucleo || null };
    if (editando) await supabase.from('info_items').update(datos).eq('id', editando);
    else await supabase.from('info_items').insert(datos);
    setForm(VACIO); setAbierto(false); setEditando(null);
    cargar();
  }

  function editar(it) {
    setForm({ categoria: it.categoria, titulo: it.titulo, detalle: it.detalle || '', nucleo: it.nucleo || '' });
    setEditando(it.id); setAbierto(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function borrar(id) {
    if (!confirm('¿Borrar este dato?')) return;
    await supabase.from('info_items').delete().eq('id', id);
    cargar();
  }

  return (
    <>
      <Cabecera titulo="Info del viaje" emoji="✈️">
        <button className="btn chico" onClick={() => { setAbierto(!abierto); setEditando(null); setForm(VACIO); }}>
          {abierto ? 'Cerrar' : '+ Agregar'}
        </button>
      </Cabecera>

      <div className="card mar">
        <b>{VIAJE.hotel}</b>
        <p style={{ margin: 0 }}>{VIAJE.destino}</p>
        <p className="small muted" style={{ margin: '0.4rem 0 0' }}>✓ Esta sección queda guardada en el celular: se ve aunque no haya señal.</p>
      </div>

      {abierto && (
        <form className="card stack" onSubmit={guardar}>
          <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input placeholder="Título (ej: Vuelo ida AR1234)" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          <textarea placeholder="Detalle: horarios, código de reserva, teléfono..." value={form.detalle} onChange={(e) => setForm({ ...form, detalle: e.target.value })} />
          <input placeholder="¿De qué familia? (opcional)" value={form.nucleo} onChange={(e) => setForm({ ...form, nucleo: e.target.value })} />
          <button className="btn">{editando ? 'Guardar cambios' : 'Agregar'}</button>
        </form>
      )}

      {items.length === 0 && <Vacio>Cargá los vuelos, la reserva del hotel y los teléfonos importantes.</Vacio>}

      {Object.entries(CATS).map(([cat, label]) => {
        const deCat = items.filter((i) => i.categoria === cat);
        if (!deCat.length) return null;
        return (
          <div className="card" key={cat}>
            <h2>{label}</h2>
            {deCat.map((it) => (
              <div key={it.id} style={{ padding: '0.6rem 0', borderTop: '1px solid var(--linea)' }}>
                <div className="row between">
                  <b>{it.titulo}</b>
                  <div className="row">
                    {it.nucleo && <span className="tag">{it.nucleo}</span>}
                    <button className="icon-btn" onClick={() => editar(it)}>✏️</button>
                    <button className="icon-btn" onClick={() => borrar(it.id)}>🗑️</button>
                  </div>
                </div>
                {it.detalle && <p className="pre muted" style={{ marginTop: '0.25rem' }}>{it.detalle}</p>}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
