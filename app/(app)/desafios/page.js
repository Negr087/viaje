'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePersonas } from '@/components/PersonaProvider';
import { Cabecera, Vacio } from '@/components/ui';
import { supabase, archivoUrl } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import { encolar, pendientes, procesarCola } from '@/lib/upload-queue';
import { pathMini, prepararFoto } from '@/lib/image';
import { diasDelViaje, estadoViaje, fmtDia, hoyISO, numeroDeDia } from '@/lib/config';
import { DESAFIOS, PORID, desafiosDelDia } from '@/lib/desafios';

function Mini({ path }) {
  const [src, setSrc] = useState(archivoUrl(pathMini(path)));
  return <img src={src} alt="" loading="lazy" onError={() => { const o = archivoUrl(path); if (src !== o) setSrc(o); }} />;
}

export default function Desafios() {
  const { yo, personas, mapa } = usePersonas();
  const [hechos, setHechos] = useState([]);
  const [pend, setPend] = useState([]);
  const [quien, setQuien] = useState('');
  const [vista, setVista] = useState('familias');
  const [subiendo, setSubiendo] = useState(null);
  const input = useRef(null);
  const elegido = useRef(null);

  const estado = estadoViaje();
  const dias = diasDelViaje();
  const hoy = hoyISO();
  const diaActivo = estado === 'durante' ? hoy : null;

  useEffect(() => { if (yo && !quien) setQuien(yo.id); }, [yo, quien]);

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('desafios_hechos').select('*, fotos(path)').order('created_at');
    setHechos(data || []);
    setPend((await pendientes()).filter((p) => p.desafio));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEnVivo(['desafios_hechos'], cargar);

  // ---------- puntajes ----------
  const { porPersona, porFamilia } = useMemo(() => {
    const pp = {};
    for (const h of hechos) pp[h.persona_id] = (pp[h.persona_id] || 0) + (PORID[h.desafio]?.puntos || 0);
    const pf = {};
    for (const [id, pts] of Object.entries(pp)) {
      const fam = mapa[id]?.nucleo || 'Sin familia';
      pf[fam] = (pf[fam] || 0) + pts;
    }
    const orden = (o) => Object.entries(o).sort(([, a], [, b]) => b - a);
    return { porPersona: orden(pp), porFamilia: orden(pf) };
  }, [hechos, mapa]);

  const yaLoHizo = (personaId, fecha, desafioId) =>
    hechos.some((h) => h.persona_id === personaId && h.fecha === fecha && h.desafio === desafioId)
    || pend.some((p) => p.desafio.persona_id === personaId && p.desafio.fecha === fecha && p.desafio.id === desafioId);

  function cumplir(d) {
    if (!yo || !quien) return;
    elegido.current = d;
    input.current?.click();
  }

  async function alElegirFoto(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    const d = elegido.current;
    if (!f || !d || !f.type.startsWith('image/')) return;
    setSubiendo(d.id);
    const { foto, mini } = await prepararFoto(f);
    const quienNombre = mapa[quien]?.nombre;
    await encolar({
      id: crypto.randomUUID(),
      blob: foto,
      mini,
      tipo: foto.type || 'image/jpeg',
      ext: foto.type === 'image/jpeg' ? 'jpg' : (f.name.split('.').pop() || 'jpg').toLowerCase(),
      persona_id: yo.id,
      caption: `🎯 ${d.texto}${quien !== yo.id && quienNombre ? ` (${quienNombre})` : ''}`,
      dia: diaActivo,
      es_video: false,
      desafio: { id: d.id, fecha: diaActivo, persona_id: quien },
    });
    setSubiendo(null);
    await cargar();
    await procesarCola();
    cargar();
  }

  // ---------- tarjetas de desafío ----------
  function tarjeta(d, fecha, activa) {
    const quienes = hechos.filter((h) => h.fecha === fecha && h.desafio === d.id);
    const listo = quien && yaLoHizo(quien, fecha, d.id);
    return (
      <div className="desafio" key={d.id}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div className="row" style={{ alignItems: 'flex-start', gap: '0.6rem' }}>
            <span className="desafio-emoji">{d.emoji}</span>
            <div>
              <b>{d.texto}</b>
              <div className="small muted">+{d.puntos} puntos</div>
            </div>
          </div>
          {activa && (
            listo
              ? <span className="tag">✓ Hecho</span>
              : <button className="btn chico" onClick={() => cumplir(d)} disabled={!yo || subiendo === d.id}>
                  {subiendo === d.id ? '...' : '📷 Lo cumplí'}
                </button>
          )}
        </div>
        {quienes.length > 0 && (
          <div className="desafio-fotos">
            {quienes.map((h) => (
              <span key={h.id} title={mapa[h.persona_id]?.nombre}>
                {h.fotos?.path && <Mini path={h.fotos.path} />}
                <small>{mapa[h.persona_id]?.emoji} {mapa[h.persona_id]?.nombre}</small>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  const diasPasados = dias.filter((d) => (estado === 'despues' || d < hoy) && hechos.some((h) => h.fecha === d));
  const ranking = vista === 'familias' ? porFamilia : porPersona;
  const maximo = ranking[0]?.[1] || 1;

  return (
    <>
      <Cabecera titulo="Desafíos" emoji="🎯" />
      <input ref={input} type="file" accept="image/*" hidden onChange={alElegirFoto} />

      {estado === 'antes' && (
        <div className="card">
          <b>Arrancan el {fmtDia(dias[0], true)} 🏝️</b>
          <p className="small muted" style={{ margin: '0.3rem 0 0' }}>
            Cada día del viaje aparecen 3 desafíos nuevos. Para cumplir uno, sacale una foto: va al álbum y suma puntos
            para vos y tu familia. Hay {DESAFIOS.length} desafíos en total; estos son los del primer día:
          </p>
          <div className="stack" style={{ marginTop: '0.6rem' }}>
            {desafiosDelDia(dias[0]).map((d) => tarjeta(d, dias[0], false))}
          </div>
        </div>
      )}

      {diaActivo && (
        <div className="card">
          <div className="row between">
            <h2 style={{ margin: 0 }}>Día {numeroDeDia(diaActivo)} · hoy</h2>
            {personas.length > 0 && (
              <select value={quien} onChange={(e) => setQuien(e.target.value)} style={{ width: 'auto' }} aria-label="¿Quién lo cumple?">
                {personas.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.nombre}</option>)}
              </select>
            )}
          </div>
          <p className="small muted" style={{ margin: '0.3rem 0 0.6rem' }}>
            ¿Lo cumplió un chico? Elegilo arriba y subí la foto desde tu celu.
          </p>
          <div className="stack">
            {desafiosDelDia(diaActivo).map((d) => tarjeta(d, diaActivo, true))}
          </div>
          {pend.length > 0 && <p className="small muted center">⏳ {pend.length} foto{pend.length > 1 ? 's' : ''} esperando señal para subirse.</p>}
        </div>
      )}

      <div className="card">
        <div className="row between">
          <h2 style={{ margin: 0 }}>🏆 Ranking</h2>
          <div className="row">
            <button className={'chip' + (vista === 'familias' ? ' on' : '')} onClick={() => setVista('familias')}>Familias</button>
            <button className={'chip' + (vista === 'personas' ? ' on' : '')} onClick={() => setVista('personas')}>Personas</button>
          </div>
        </div>
        {ranking.length === 0
          ? <Vacio>Todavía nadie sumó puntos.</Vacio>
          : (
            <ol className="ranking">
              {ranking.map(([clave, pts], i) => (
                <li key={clave}>
                  <span className="ranking-pos">{['🥇', '🥈', '🥉'][i] || i + 1}</span>
                  <span className="ranking-nombre">
                    {vista === 'familias' ? clave : `${mapa[clave]?.emoji || ''} ${mapa[clave]?.nombre || 'Alguien'}`}
                    <span className="ranking-barra" style={{ width: `${(pts / maximo) * 100}%` }} />
                  </span>
                  <b>{pts}</b>
                </li>
              ))}
            </ol>
          )}
      </div>

      {[...diasPasados].reverse().map((d) => (
        <div className="card" key={d}>
          <h3 style={{ marginTop: 0 }}>Día {numeroDeDia(d)} · <span className="muted">{fmtDia(d, true)}</span></h3>
          <div className="stack">
            {desafiosDelDia(d).map((x) => tarjeta(x, d, false))}
          </div>
        </div>
      ))}
    </>
  );
}
