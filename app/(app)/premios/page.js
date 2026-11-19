'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePersonas } from '@/components/PersonaProvider';
import { Cabecera } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import { PREMIOS } from '@/lib/config';
import { ganadores, todosLosPremios } from '@/lib/premios';

export default function Premios() {
  const { yo, personas, mapa } = usePersonas();
  const [votos, setVotos] = useState([]);
  const [extras, setExtras] = useState([]);
  const [revelar, setRevelar] = useState(false);
  const [nuevo, setNuevo] = useState({ emoji: '', titulo: '' });

  const cargar = useCallback(async () => {
    const [v, x] = await Promise.all([
      supabase.from('premio_votos').select('*'),
      supabase.from('premios_extra').select('*').order('created_at'),
    ]);
    setVotos(v.data || []);
    setExtras(x.data || []);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEnVivo(['premio_votos', 'premios_extra'], cargar);

  const premios = todosLosPremios(PREMIOS, extras);

  async function agregar(e) {
    e.preventDefault();
    const titulo = nuevo.titulo.trim();
    if (!titulo || !yo) return;
    const { error } = await supabase.from('premios_extra').insert({ emoji: nuevo.emoji.trim() || '🏅', titulo, creado_por: yo.id });
    if (error) return alert('No se pudo agregar el premio.');
    setNuevo({ emoji: '', titulo: '' });
    cargar();
  }

  async function borrarPremio(pr) {
    if (!confirm(`¿Borrar el premio "${pr.titulo}"? Se pierden sus votos.`)) return;
    await supabase.from('premio_votos').delete().eq('premio', pr.id);
    await supabase.from('premios_extra').delete().eq('id', pr.id);
    cargar();
  }

  async function votar(premio, nominado_id) {
    if (!yo) return;
    if (!nominado_id) {
      await supabase.from('premio_votos').delete().match({ premio, votante_id: yo.id });
    } else {
      await supabase.from('premio_votos').upsert({ premio, votante_id: yo.id, nominado_id }, { onConflict: 'premio,votante_id' });
    }
    cargar();
  }

  const votantes = new Set(votos.map((v) => v.votante_id)).size;

  return (
    <>
      <Cabecera titulo="Premios del viaje" emoji="🏆" />

      <div className="card coral">
        <p style={{ margin: 0 }}>Votá en secreto. Los resultados se revelan la última noche 🤫</p>
        <p className="small muted" style={{ margin: '0.3rem 0 0' }}>Ya votaron {votantes} personas.</p>
      </div>

      {premios.map((pr) => {
        const mio = votos.find((v) => v.premio === pr.id && v.votante_id === yo?.id);
        const ranking = ganadores(votos, pr.id);
        return (
          <div key={pr.id} className="card">
            <div className="row between" style={{ alignItems: 'flex-start' }}>
              <h2>{pr.emoji} {pr.titulo}</h2>
              {pr.extra && <button className="icon-btn" onClick={() => borrarPremio(pr)} aria-label="Borrar premio">🗑️</button>}
            </div>
            <select value={mio?.nominado_id || ''} onChange={(e) => votar(pr.id, e.target.value)}>
              <option value="">— Mi voto —</option>
              {personas.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.nombre}</option>)}
            </select>
            {revelar && ranking.length > 0 && (
              <div style={{ marginTop: '0.6rem' }}>
                {ranking.slice(0, 3).map(([id, n], i) => (
                  <p key={id} style={{ margin: '0.2rem 0' }}>
                    {['🥇', '🥈', '🥉'][i]} {mapa[id]?.emoji} <b>{mapa[id]?.nombre}</b> <span className="muted small">({n} votos)</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <form className="card" onSubmit={agregar}>
        <h2>➕ Agregar un premio</h2>
        <div className="row">
          <input value={nuevo.emoji} onChange={(e) => setNuevo({ ...nuevo, emoji: e.target.value })} placeholder="🏅" maxLength={8} style={{ width: '4rem', textAlign: 'center' }} aria-label="Emoji" />
          <input value={nuevo.titulo} onChange={(e) => setNuevo({ ...nuevo, titulo: e.target.value })} placeholder="Ej: El que más se quejó del calor" maxLength={60} aria-label="Nombre del premio" />
        </div>
        <button className="btn full" style={{ marginTop: '0.5rem' }} disabled={!yo || !nuevo.titulo.trim()}>Agregar</button>
      </form>

      <button
        className="btn full coral"
        onClick={() => (revelar ? setRevelar(false) : confirm('¿Revelar los resultados? (spoiler para todos los que estén mirando 👀)') && setRevelar(true))}
      >
        {revelar ? 'Ocultar resultados' : '🎤 Revelar resultados'}
      </button>
    </>
  );
}
