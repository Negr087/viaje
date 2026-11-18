'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePersonas } from '@/components/PersonaProvider';
import { Cabecera } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import { BINGO } from '@/lib/config';

const LIBRE = 12;
const LINEAS = [
  ...[0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4].map((c) => r * 5 + c)),
  ...[0, 1, 2, 3, 4].map((c) => [0, 1, 2, 3, 4].map((r) => r * 5 + c)),
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

function contarLineas(marcadas) {
  const set = new Set([...marcadas, LIBRE]);
  return LINEAS.filter((l) => l.every((i) => set.has(i))).length;
}

export default function Bingo() {
  const { yo, personas, mapa } = usePersonas();
  const [jugadorId, setJugadorId] = useState(null);
  const [marcas, setMarcas] = useState([]);

  useEffect(() => { if (yo && !jugadorId) setJugadorId(yo.id); }, [yo, jugadorId]);

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('bingo_marcas').select('persona_id, casilla');
    setMarcas(data || []);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEnVivo(['bingo_marcas'], cargar);

  const mias = marcas.filter((m) => m.persona_id === jugadorId).map((m) => m.casilla);

  async function toggle(i) {
    if (i === LIBRE || !jugadorId) return;
    if (mias.includes(i)) {
      setMarcas((ms) => ms.filter((m) => !(m.persona_id === jugadorId && m.casilla === i)));
      await supabase.from('bingo_marcas').delete().match({ persona_id: jugadorId, casilla: i });
    } else {
      setMarcas((ms) => [...ms, { persona_id: jugadorId, casilla: i }]);
      await supabase.from('bingo_marcas').insert({ persona_id: jugadorId, casilla: i });
    }
  }

  const lineas = contarLineas(mias);
  const ranking = personas
    .map((p) => {
      const m = marcas.filter((x) => x.persona_id === p.id).map((x) => x.casilla);
      return { p, casillas: m.length, lineas: contarLineas(m) };
    })
    .filter((r) => r.casillas > 0)
    .sort((a, b) => b.lineas - a.lineas || b.casillas - a.casillas);

  return (
    <>
      <Cabecera titulo="Bingo del viaje" emoji="🦀" />

      <div className="card">
        <label>¿Quién juega? (los chicos pueden jugar desde el celu de los papás)</label>
        <select value={jugadorId || ''} onChange={(e) => setJugadorId(e.target.value)}>
          {personas.filter((p) => p.tipo !== 'bebe').map((p) => (
            <option key={p.id} value={p.id}>{p.emoji} {p.nombre}</option>
          ))}
        </select>
      </div>

      {lineas > 0 && <div className="bingo-grito">¡BINGO{lineas > 1 ? ` x${lineas}` : ''}! 🎉</div>}

      <div className="bingo">
        {BINGO.map((txt, i) => (
          <button
            key={i}
            className={i === LIBRE ? 'libre' : mias.includes(i) ? 'on' : ''}
            onClick={() => toggle(i)}
          >
            {txt}
          </button>
        ))}
      </div>
      <p className="small muted center" style={{ marginTop: '0.5rem' }}>Tocá una casilla cuando lo veas o lo hagas. Línea completa = bingo.</p>

      {ranking.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2>Tabla</h2>
          <ul className="lista">
            {ranking.map(({ p, casillas, lineas }, i) => (
              <li key={p.id}>
                <b>{i + 1}.</b>
                <span className="grow">{mapa[p.id]?.emoji} {p.nombre}</span>
                {lineas > 0 && <span className="tag coral">🎉 {lineas}</span>}
                <span className="tag">{casillas}/24</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
