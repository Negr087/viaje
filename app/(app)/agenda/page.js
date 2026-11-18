'use client';
import { useCallback, useEffect, useState } from 'react';
import { Cabecera, Vacio } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import { consultas } from '@/lib/consultas';
import { diasDelViaje, fmtDia, hoyISO, numeroDeDia } from '@/lib/config';

const VACIO = { hora: '', titulo: '', lugar: '', notas: '' };

export default function Agenda() {
  const dias = diasDelViaje();
  const [dia, setDia] = useState(dias.includes(hoyISO()) ? hoyISO() : dias[0]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [abierto, setAbierto] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await consultas.agenda();
    setItems(data || []);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEnVivo(['agenda'], cargar);

  async function guardar(e) {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    await supabase.from('agenda').insert({ ...form, fecha: dia, hora: form.hora || null });
    setForm(VACIO); setAbierto(false);
    cargar();
  }

  async function borrar(id) {
    if (!confirm('¿Borrar de la agenda?')) return;
    await supabase.from('agenda').delete().eq('id', id);
    cargar();
  }

  const delDia = items.filter((i) => i.fecha === dia);

  return (
    <>
      <Cabecera titulo="Agenda" emoji="📅">
        <button className="btn chico" onClick={() => setAbierto(!abierto)}>{abierto ? 'Cerrar' : '+ Agregar'}</button>
      </Cabecera>

      <div className="tabs">
        {dias.map((d) => (
          <button key={d} className={'tab' + (d === dia ? ' on' : '')} onClick={() => setDia(d)}>
            Día {numeroDeDia(d)}<br /><span className="small">{fmtDia(d)}</span>
          </button>
        ))}
      </div>

      <h2 style={{ textTransform: 'capitalize' }}>{fmtDia(dia, true)}</h2>

      {abierto && (
        <form className="card stack" onSubmit={guardar}>
          <input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
          <input placeholder="Qué (ej: Cena en el italiano, reserva para 9)" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          <input placeholder="Dónde / punto de encuentro" value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} />
          <textarea placeholder="Notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          <button className="btn">Agregar al {fmtDia(dia)}</button>
        </form>
      )}

      {delDia.length === 0 && <Vacio>Día libre. Pileta, playa y siesta 😎</Vacio>}

      {delDia.map((a) => (
        <div key={a.id} className="card">
          <div className="row between">
            <div className="row">
              {a.hora && <span className="tag coral">{a.hora.slice(0, 5)}</span>}
              <b>{a.titulo}</b>
            </div>
            <button className="icon-btn" onClick={() => borrar(a.id)}>🗑️</button>
          </div>
          {a.lugar && <p className="small muted" style={{ margin: '0.3rem 0 0' }}>📍 {a.lugar}</p>}
          {a.notas && <p className="pre small" style={{ margin: '0.3rem 0 0' }}>{a.notas}</p>}
        </div>
      ))}
    </>
  );
}
