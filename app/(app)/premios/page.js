'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePersonas } from '@/components/PersonaProvider';
import { Cabecera } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import { PREMIOS } from '@/lib/config';
import { ganadores } from '@/lib/premios';

export default function Premios() {
  const { yo, personas, mapa } = usePersonas();
  const [votos, setVotos] = useState([]);
  const [revelar, setRevelar] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('premio_votos').select('*');
    setVotos(data || []);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEnVivo(['premio_votos'], cargar);

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

      {PREMIOS.map((pr) => {
        const mio = votos.find((v) => v.premio === pr.id && v.votante_id === yo?.id);
        const ranking = ganadores(votos, pr.id);
        return (
          <div key={pr.id} className="card">
            <h2>{pr.emoji} {pr.titulo}</h2>
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

      <button
        className="btn full coral"
        onClick={() => (revelar ? setRevelar(false) : confirm('¿Revelar los resultados? (spoiler para todos los que estén mirando 👀)') && setRevelar(true))}
      >
        {revelar ? 'Ocultar resultados' : '🎤 Revelar resultados'}
      </button>
    </>
  );
}
