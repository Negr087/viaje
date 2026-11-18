'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePersonas } from '@/components/PersonaProvider';
import { Cabecera, PersonaChips, Vacio, nombres } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import { consultas } from '@/lib/consultas';
import { diasDelViaje, fmtDia } from '@/lib/config';

const VACIO = { fecha: '', momento: 'Cena', salen: [], cuidan: [], notas: '' };

export default function Ninera() {
  const { yo, adultos, mapa } = usePersonas();
  const [turnos, setTurnos] = useState([]);
  const [form, setForm] = useState({ ...VACIO, fecha: diasDelViaje()[0] });
  const [abierto, setAbierto] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await consultas.ninera();
    setTurnos(data || []);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEnVivo(['turnos_ninera'], cargar);

  async function guardar(e) {
    e.preventDefault();
    if (!form.salen.length) return alert('Elegí quiénes salen.');
    await supabase.from('turnos_ninera').insert(form);
    setForm({ ...VACIO, fecha: form.fecha }); setAbierto(false);
    cargar();
  }

  async function meOfrezco(t) {
    if (!yo || t.cuidan.includes(yo.id)) return;
    await supabase.from('turnos_ninera').update({ cuidan: [...t.cuidan, yo.id] }).eq('id', t.id);
    cargar();
  }

  async function meBajo(t) {
    await supabase.from('turnos_ninera').update({ cuidan: t.cuidan.filter((x) => x !== yo.id) }).eq('id', t.id);
    cargar();
  }

  async function borrar(id) {
    if (!confirm('¿Borrar el turno?')) return;
    await supabase.from('turnos_ninera').delete().eq('id', id);
    cargar();
  }

  // Resumen: cuántas veces salió y cuántas cuidó cada adulto
  const resumen = adultos.map((p) => ({
    p,
    salio: turnos.filter((t) => t.salen.includes(p.id)).length,
    cuido: turnos.filter((t) => t.cuidan.includes(p.id)).length,
  }));

  return (
    <>
      <Cabecera titulo="Turnos de niñera" emoji="🍼">
        <button className="btn chico" onClick={() => setAbierto(!abierto)}>{abierto ? 'Cerrar' : '+ Turno'}</button>
      </Cabecera>

      <div className="card coral">
        <p style={{ margin: 0 }}>La idea: que cada pareja tenga al menos una noche libre mientras otros cuidan a los chicos. 💑</p>
      </div>

      {abierto && (
        <form className="card stack" onSubmit={guardar}>
          <div className="row">
            <select className="grow" style={{ width: 'auto' }} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })}>
              {diasDelViaje().map((d) => <option key={d} value={d}>{fmtDia(d)}</option>)}
            </select>
            <select className="grow" style={{ width: 'auto' }} value={form.momento} onChange={(e) => setForm({ ...form, momento: e.target.value })}>
              {['Cena', 'Noche', 'Tarde', 'Mañana', 'Excursión'].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <label>Salen 🥂</label>
          <PersonaChips personas={adultos} value={form.salen} onChange={(salen) => setForm({ ...form, salen })} />
          <label>Cuidan 🧸 (se pueden sumar después)</label>
          <PersonaChips personas={adultos.filter((p) => !form.salen.includes(p.id))} value={form.cuidan} onChange={(cuidan) => setForm({ ...form, cuidan })} />
          <input placeholder="Notas (ej: restaurante, a qué hora vuelven)" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          <button className="btn">Guardar turno</button>
        </form>
      )}

      {turnos.length === 0 && <Vacio>Todavía no hay turnos armados.</Vacio>}

      {turnos.map((t) => {
        const cuido = yo && t.cuidan.includes(yo.id);
        const salgo = yo && t.salen.includes(yo.id);
        return (
          <div key={t.id} className="card">
            <div className="row between">
              <span className="tag coral">{fmtDia(t.fecha)} · {t.momento}</span>
              <button className="icon-btn" onClick={() => borrar(t.id)}>🗑️</button>
            </div>
            <p style={{ margin: '0.5rem 0 0.2rem' }}>🥂 <b>Salen:</b> {nombres(t.salen, mapa)}</p>
            <p style={{ margin: 0 }}>🧸 <b>Cuidan:</b> {nombres(t.cuidan, mapa) || <span className="muted">¡falta alguien!</span>}</p>
            {t.notas && <p className="small muted" style={{ margin: '0.3rem 0 0' }}>{t.notas}</p>}
            {yo && !salgo && (
              <div style={{ marginTop: '0.6rem' }}>
                {cuido
                  ? <button className="btn ghost chico" onClick={() => meBajo(t)}>Ya no puedo cuidar</button>
                  : <button className="btn chico" onClick={() => meOfrezco(t)}>Me ofrezco a cuidar</button>}
              </div>
            )}
          </div>
        );
      })}

      {turnos.length > 0 && (
        <div className="card">
          <h2>Resumen</h2>
          <ul className="lista">
            {resumen.map(({ p, salio, cuido }) => (
              <li key={p.id}>
                <span className="grow">{p.emoji} {p.nombre}</span>
                <span className="tag">🥂 {salio}</span>
                <span className="tag coral">🧸 {cuido}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
