'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePersonas } from '@/components/PersonaProvider';
import { Cabecera, Vacio } from '@/components/ui';
import { supabase, archivoUrl } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import { encolar, pendientes, procesarCola } from '@/lib/upload-queue';
import { comprimir } from '@/lib/image';
import { fmtDia, hoyISO, numeroDeDia } from '@/lib/config';

const MAX_VIDEO = 50 * 1024 * 1024; // límite por archivo del plan gratis de Supabase

export default function Fotos() {
  const { yo, personas, mapa } = usePersonas();
  const [fotos, setFotos] = useState([]);
  const [pend, setPend] = useState(0);
  const [filtro, setFiltro] = useState('');
  const [caption, setCaption] = useState('');
  const [abierta, setAbierta] = useState(null);
  const [preparando, setPreparando] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from('fotos')
      .select('*, foto_likes(persona_id)')
      .order('created_at', { ascending: false });
    setFotos(data || []);
    setPend((await pendientes()).length);
  }, []);

  useEnVivo(['fotos', 'foto_likes'], cargar);

  const sincronizar = useCallback(async () => {
    await procesarCola();
    await cargar();
  }, [cargar]);

  useEffect(() => {
    sincronizar();
    const on = () => sincronizar();
    window.addEventListener('online', on);
    window.addEventListener('focus', on);
    const t = setInterval(on, 30000);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('focus', on);
      clearInterval(t);
    };
  }, [sincronizar]);

  async function elegirArchivos(e) {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length || !yo) return;
    setPreparando(true);
    for (const f of files) {
      const esVideo = f.type.startsWith('video/');
      if (esVideo && f.size > MAX_VIDEO) {
        alert(`"${f.name}" pesa más de 50 MB. Recortalo un poco y probá de nuevo.`);
        continue;
      }
      const blob = esVideo ? f : await comprimir(f);
      const extOriginal = (f.name.split('.').pop() || '').toLowerCase();
      const ext = blob.type === 'image/jpeg' ? 'jpg' : extOriginal || (esVideo ? 'mp4' : 'jpg');
      await encolar({
        id: crypto.randomUUID(),
        blob,
        tipo: blob.type || f.type || 'application/octet-stream',
        ext,
        persona_id: yo.id,
        caption: caption.trim() || null,
        dia: hoyISO(),
        es_video: esVideo,
      });
    }
    setCaption('');
    setPreparando(false);
    setPend((await pendientes()).length);
    sincronizar();
  }

  async function toggleLike(foto) {
    if (!yo) return;
    const ya = foto.foto_likes.some((l) => l.persona_id === yo.id);
    if (ya) await supabase.from('foto_likes').delete().match({ foto_id: foto.id, persona_id: yo.id });
    else await supabase.from('foto_likes').insert({ foto_id: foto.id, persona_id: yo.id });
    const { data } = await supabase.from('foto_likes').select('persona_id').eq('foto_id', foto.id);
    setFotos((fs) => fs.map((f) => (f.id === foto.id ? { ...f, foto_likes: data || [] } : f)));
    setAbierta((a) => (a?.id === foto.id ? { ...a, foto_likes: data || [] } : a));
  }

  async function borrar(foto) {
    if (!confirm('¿Borrar esta foto para todos?')) return;
    // El borrado pasa por el servidor: desde el celular no se pueden borrar archivos.
    const r = await fetch(`/api/fotos/${foto.id}`, { method: 'DELETE' });
    if (!r.ok) {
      const { error } = await r.json().catch(() => ({}));
      return alert(`No se pudo borrar la foto${error ? `: ${error}` : ''}.`);
    }
    setAbierta(null);
    cargar();
  }

  const visibles = filtro ? fotos.filter((f) => f.persona_id === filtro) : fotos;
  const porDia = visibles.reduce((acc, f) => {
    const d = f.dia || f.created_at.slice(0, 10);
    (acc[d] ||= []).push(f);
    return acc;
  }, {});

  return (
    <>
      <Cabecera titulo="Álbum" emoji="📸" />

      <div className="card stack">
        <input placeholder="Comentario (opcional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <label className="subir">
          <input type="file" accept="image/*,video/*" multiple onChange={elegirArchivos} disabled={preparando || !yo} />
          {preparando ? 'Preparando...' : '📷 Subir fotos o videos'}
        </label>
        {pend > 0 && (
          <p className="small muted center">
            ⏳ {pend} pendiente{pend > 1 ? 's' : ''} de subir. Se suben solas cuando haya señal.{' '}
            <button className="btn chico ghost" onClick={sincronizar}>Reintentar</button>
          </p>
        )}
      </div>

      <div className="row" style={{ marginBottom: '0.75rem' }}>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todas las fotos ({fotos.length})</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              Subidas por {p.nombre} ({fotos.filter((f) => f.persona_id === p.id).length})
            </option>
          ))}
        </select>
      </div>

      {visibles.length === 0 && <Vacio>Todavía no hay fotos. ¡Estrenalo!</Vacio>}

      {Object.entries(porDia).sort(([a], [b]) => b.localeCompare(a)).map(([dia, fs]) => (
        <section key={dia}>
          <h3>
            {numeroDeDia(dia) ? `Día ${numeroDeDia(dia)} · ` : ''}
            <span className="muted">{fmtDia(dia, true)}</span>
          </h3>
          <div className="galeria">
            {fs.map((f) => (
              <button key={f.id} onClick={() => setAbierta(f)}>
                {f.es_video
                  ? <><video src={archivoUrl(f.path) + '#t=0.5'} preload="metadata" muted playsInline /><span className="play">▶</span></>
                  : <img src={archivoUrl(f.path)} alt={f.caption || ''} loading="lazy" />}
                {f.foto_likes.length > 0 && <span className="likes">❤️ {f.foto_likes.length}</span>}
              </button>
            ))}
          </div>
        </section>
      ))}

      {abierta && (
        <div className="lightbox">
          <div className="row between" style={{ padding: '0.75rem 1rem 0' }}>
            <span>{mapa[abierta.persona_id]?.emoji} {mapa[abierta.persona_id]?.nombre || 'Alguien'}</span>
            <button className="icon-btn" onClick={() => setAbierta(null)}>✕</button>
          </div>
          <div className="lightbox-media" onClick={() => setAbierta(null)}>
            {abierta.es_video
              ? <video src={archivoUrl(abierta.path)} controls autoPlay playsInline onClick={(e) => e.stopPropagation()} />
              : <img src={archivoUrl(abierta.path)} alt={abierta.caption || ''} />}
          </div>
          <div className="lightbox-pie">
            {abierta.caption && <p>{abierta.caption}</p>}
            <div className="row between">
              <button className="btn coral" onClick={() => toggleLike(abierta)}>
                {abierta.foto_likes.some((l) => l.persona_id === yo?.id) ? '❤️' : '🤍'} {abierta.foto_likes.length}
              </button>
              <div className="row">
                <a className="btn ghost chico" style={{ color: 'white', borderColor: 'white' }} href={archivoUrl(abierta.path)} target="_blank" rel="noreferrer" download>
                  Descargar
                </a>
                {abierta.persona_id === yo?.id && (
                  <button className="btn ghost chico" style={{ color: 'white', borderColor: 'white' }} onClick={() => borrar(abierta)}>Borrar</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
