'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePersonas } from '@/components/PersonaProvider';
import { Cabecera, Progreso, Vacio } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import { consultas } from '@/lib/consultas';
import { CHECKLIST_BASE } from '@/lib/config';

export default function Checklist() {
  const { yo, personas, mapa } = usePersonas();
  const [personaId, setPersonaId] = useState(null);
  const [todos, setTodos] = useState([]);
  const [nuevo, setNuevo] = useState('');

  useEffect(() => { if (yo && !personaId) setPersonaId(yo.id); }, [yo, personaId]);

  const cargar = useCallback(async () => {
    const { data } = await consultas.checklist();
    setTodos(data || []);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEnVivo(['checklist_items'], cargar);

  const persona = mapa[personaId];
  const items = todos.filter((t) => t.persona_id === personaId);

  async function cargarBase() {
    const lista = CHECKLIST_BASE[persona.tipo] || CHECKLIST_BASE.adulto;
    await supabase.from('checklist_items').insert(lista.map((texto) => ({ persona_id: personaId, texto })));
    cargar();
  }

  async function toggle(it) {
    setTodos((ts) => ts.map((t) => (t.id === it.id ? { ...t, hecho: !t.hecho } : t)));
    await supabase.from('checklist_items').update({ hecho: !it.hecho }).eq('id', it.id);
  }

  async function agregar(e) {
    e.preventDefault();
    if (!nuevo.trim()) return;
    await supabase.from('checklist_items').insert({ persona_id: personaId, texto: nuevo.trim() });
    setNuevo('');
    cargar();
  }

  async function borrar(id) {
    setTodos((ts) => ts.filter((t) => t.id !== id));
    await supabase.from('checklist_items').delete().eq('id', id);
  }

  return (
    <>
      <Cabecera titulo="Checklist" emoji="✅" />

      <div className="card">
        <label>¿De quién es la lista?</label>
        <select value={personaId || ''} onChange={(e) => setPersonaId(e.target.value)}>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>{p.emoji} {p.nombre}{p.id === yo?.id ? ' (vos)' : ''}</option>
          ))}
        </select>
      </div>

      {persona && (
        <div className="card">
          {items.length === 0 ? (
            <Vacio>
              La lista de {persona.nombre} está vacía.<br /><br />
              <button className="btn" onClick={cargarBase}>Cargar lista base</button>
            </Vacio>
          ) : (
            <>
              <div className="row between" style={{ marginBottom: '0.5rem' }}>
                <b>{items.filter((i) => i.hecho).length} de {items.length} listos</b>
              </div>
              <Progreso valor={items.filter((i) => i.hecho).length} total={items.length} />
              <ul className="lista" style={{ marginTop: '0.5rem' }}>
                {items.map((it) => (
                  <li key={it.id} className={it.hecho ? 'hecho' : ''}>
                    <input type="checkbox" checked={it.hecho} onChange={() => toggle(it)} />
                    <span className="texto grow" onClick={() => toggle(it)}>{it.texto}</span>
                    <button className="icon-btn" onClick={() => borrar(it.id)}>✕</button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <form className="row" onSubmit={agregar} style={{ marginTop: '0.75rem' }}>
            <input className="grow" style={{ width: 'auto' }} placeholder="Agregar algo..." value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
            <button className="btn">+</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Cómo viene la familia</h2>
        {personas.map((p) => {
          const its = todos.filter((t) => t.persona_id === p.id);
          const ok = its.filter((t) => t.hecho).length;
          return (
            <div key={p.id} style={{ padding: '0.4rem 0', cursor: 'pointer' }} onClick={() => setPersonaId(p.id)}>
              <div className="row between small">
                <span>{p.emoji} {p.nombre}</span>
                <span className="muted">{its.length ? `${ok}/${its.length}` : 'sin lista'}</span>
              </div>
              <Progreso valor={ok} total={its.length} />
            </div>
          );
        })}
      </div>
    </>
  );
}
