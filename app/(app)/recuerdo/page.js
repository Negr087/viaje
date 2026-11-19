'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePersonas } from '@/components/PersonaProvider';
import { Cabecera, Vacio } from '@/components/ui';
import { supabase, archivoUrl } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import { PREMIOS, VIAJE, fmtDia, numeroDeDia } from '@/lib/config';
import { ganadores, todosLosPremios } from '@/lib/premios';

const POR_DIA = 3; // mejores fotos por día (las más likeadas)

export default function Recuerdo() {
  const { yo, mapa } = usePersonas();
  const [mensajes, setMensajes] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [votos, setVotos] = useState([]);
  const [extras, setExtras] = useState([]);
  const [texto, setTexto] = useState('');
  const [slide, setSlide] = useState(null);

  const cargar = useCallback(async () => {
    const [m, f, v, x] = await Promise.all([
      supabase.from('mensajes').select('*').order('created_at'),
      supabase.from('fotos').select('*, foto_likes(persona_id)').eq('es_video', false),
      supabase.from('premio_votos').select('*'),
      supabase.from('premios_extra').select('*').order('created_at'),
    ]);
    setMensajes(m.data || []);
    setFotos(f.data || []);
    setVotos(v.data || []);
    setExtras(x.data || []);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEnVivo(['mensajes', 'fotos', 'foto_likes', 'premio_votos', 'premios_extra'], cargar);

  const mio = mensajes.find((m) => m.persona_id === yo?.id);
  useEffect(() => { if (mio) setTexto(mio.texto); }, [mio]);

  async function guardar(e) {
    e.preventDefault();
    if (!texto.trim() || !yo) return;
    if (mio) await supabase.from('mensajes').update({ texto: texto.trim() }).eq('id', mio.id);
    else await supabase.from('mensajes').insert({ persona_id: yo.id, texto: texto.trim() });
    cargar();
  }

  const mejores = useMemo(() => {
    const porDia = {};
    for (const f of fotos) (porDia[f.dia || f.created_at.slice(0, 10)] ||= []).push(f);
    return Object.entries(porDia)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dia, fs]) => [dia, fs.sort((a, b) => b.foto_likes.length - a.foto_likes.length).slice(0, POR_DIA)]);
  }, [fotos]);

  const premiados = todosLosPremios(PREMIOS, extras)
    .map((p) => ({ ...p, ganador: ganadores(votos, p.id)[0]?.[0] }))
    .filter((p) => p.ganador);

  // Presentación a pantalla completa: portada, fotos, premios, mensajes, cierre
  const slides = useMemo(() => [
    { tipo: 'texto', texto: `Gracias, ${VIAJE.homenajeada} 🧡`, firma: VIAJE.nombre },
    ...mejores.flatMap(([dia, fs]) => fs.map((f) => ({ tipo: 'foto', foto: f, firma: `Día ${numeroDeDia(dia) || ''} · ${fmtDia(dia, true)}` }))),
    ...premiados.map((p) => ({ tipo: 'texto', texto: `${p.emoji} ${p.titulo}`, firma: mapa[p.ganador]?.nombre })),
    ...mensajes.map((m) => ({ tipo: 'texto', texto: `“${m.texto}”`, firma: mapa[m.persona_id]?.nombre })),
    { tipo: 'texto', texto: '¿Cuándo es el próximo? ✈️', firma: 'La familia' },
  ], [mejores, premiados, mensajes, mapa]);

  useEffect(() => {
    if (slide === null) return;
    const t = setTimeout(() => setSlide((s) => (s + 1 < slides.length ? s + 1 : null)), 6000);
    return () => clearTimeout(t);
  }, [slide, slides.length]);

  const actual = slide !== null ? slides[slide] : null;

  return (
    <>
      <Cabecera titulo={`Para ${VIAJE.homenajeada}`} emoji="💌" />

      <div className="card mar">
        <p style={{ margin: 0 }}>
          Este viaje es un regalo de {VIAJE.homenajeada}. Acá juntamos un mensaje de cada uno y lo mejor de cada día
          para devolverle un poquito. Al final lo pasamos como presentación o lo imprimimos.
        </p>
      </div>

      <div className="row no-print" style={{ marginBottom: '1rem' }}>
        <button className="btn coral grow" onClick={() => setSlide(0)}>▶ Presentación</button>
        <button className="btn ghost grow" onClick={() => window.print()}>🖨️ Imprimir / PDF</button>
      </div>

      <form className="card stack no-print" onSubmit={guardar}>
        <h2>Tu mensaje</h2>
        <textarea placeholder={`Unas palabras para ${VIAJE.homenajeada}...`} value={texto} onChange={(e) => setTexto(e.target.value)} />
        <button className="btn">{mio ? 'Actualizar mi mensaje' : 'Guardar mensaje'}</button>
      </form>

      <h2>Mensajes ({mensajes.length})</h2>
      {mensajes.length === 0 && <Vacio>Todavía nadie escribió.</Vacio>}
      {mensajes.map((m) => (
        <div key={m.id} className="mensaje">
          <p className="pre">{m.texto}</p>
          <b className="small">— {mapa[m.persona_id]?.emoji} {mapa[m.persona_id]?.nombre}</b>
        </div>
      ))}

      {premiados.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2>🏆 Los premios</h2>
          {premiados.map((p) => (
            <p key={p.id} style={{ margin: '0.3rem 0' }}>{p.emoji} {p.titulo}: <b>{mapa[p.ganador]?.nombre}</b></p>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: '1rem' }}>Lo mejor de cada día</h2>
      <p className="small muted no-print">Salen las {POR_DIA} fotos con más ❤️ de cada día. Andá al álbum a likear tus favoritas.</p>
      {mejores.length === 0 && <Vacio>Cuando haya fotos, aparecen acá.</Vacio>}
      {mejores.map(([dia, fs]) => (
        <div key={dia} className="card">
          <h3 style={{ textTransform: 'capitalize' }}>{numeroDeDia(dia) ? `Día ${numeroDeDia(dia)} · ` : ''}{fmtDia(dia, true)}</h3>
          <div className="fotos-dia">
            {fs.map((f) => <img key={f.id} src={archivoUrl(f.path)} alt={f.caption || ''} />)}
          </div>
        </div>
      ))}

      {actual && (
        <div className="presentacion" onClick={() => setSlide(slide + 1 < slides.length ? slide + 1 : null)}>
          <button className="btn ghost chico cerrar" style={{ color: 'white', borderColor: 'white' }} onClick={(e) => { e.stopPropagation(); setSlide(null); }}>✕</button>
          <div>
            {actual.tipo === 'foto'
              ? <img src={archivoUrl(actual.foto.path)} alt="" />
              : <div className="texto-grande">{actual.texto}</div>}
            {actual.firma && <div className="firma">{actual.firma}</div>}
            {actual.tipo === 'foto' && actual.foto.caption && <div style={{ marginTop: '0.4rem' }}>{actual.foto.caption}</div>}
          </div>
        </div>
      )}
    </>
  );
}
