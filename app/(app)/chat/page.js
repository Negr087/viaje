'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePersonas } from '@/components/PersonaProvider';
import { Cabecera, Vacio } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import { avisar } from '@/lib/push';
import { hoyISO } from '@/lib/config';

const ULTIMOS = 300;

function hora(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function dia(iso) {
  const d = new Date(iso).toLocaleDateString('en-CA');
  if (d === hoyISO()) return 'Hoy';
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'numeric' });
}

export default function Chat() {
  const { yo, mapa } = usePersonas();
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fin = useRef(null);
  const primeraCarga = useRef(true);

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('chat').select('*').order('created_at', { ascending: false }).limit(ULTIMOS);
    setMensajes((data || []).reverse());
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEnVivo(['chat'], cargar);

  // Bajar al último mensaje cuando llega uno nuevo
  useEffect(() => {
    if (!mensajes.length) return;
    fin.current?.scrollIntoView({ behavior: primeraCarga.current ? 'auto' : 'smooth', block: 'end' });
    primeraCarga.current = false;
  }, [mensajes.length]);

  async function enviar(e) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || !yo || enviando) return;
    setEnviando(true);
    const { data, error } = await supabase.from('chat').insert({ persona_id: yo.id, texto: t }).select().single();
    setEnviando(false);
    if (error) return alert('No se pudo mandar el mensaje. ¿Hay señal?');
    setTexto('');
    setMensajes((m) => (m.some((x) => x.id === data.id) ? m : [...m, data]));
    avisar('chat', data.id, yo.id);
  }

  async function borrar(m) {
    if (m.persona_id !== yo?.id || !confirm('¿Borrar este mensaje?')) return;
    await supabase.from('chat').delete().eq('id', m.id);
    cargar();
  }

  return (
    <>
      <Cabecera titulo="Chat" emoji="💬" />

      {mensajes.length === 0 && <Vacio>Todavía no hay mensajes. ¡Mandá el primero!</Vacio>}

      <div className="chat">
        {mensajes.map((m, i) => {
          const ant = mensajes[i - 1];
          const mio = m.persona_id === yo?.id;
          const nuevoDia = !ant || dia(ant.created_at) !== dia(m.created_at);
          const mismoAutor = !nuevoDia && ant?.persona_id === m.persona_id;
          const p = mapa[m.persona_id];
          return (
            <div key={m.id}>
              {nuevoDia && <p className="chat-dia">{dia(m.created_at)}</p>}
              <div className={'chat-burbuja' + (mio ? ' mia' : '') + (mismoAutor ? ' seguido' : '')} onClick={() => mio && borrar(m)}>
                {!mio && !mismoAutor && <b className="chat-autor">{p?.emoji} {p?.nombre || 'Alguien'}</b>}
                <span className="chat-texto">{m.texto}</span>
                <span className="chat-hora">{hora(m.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={fin} />
      </div>

      <form className="chat-escribir" onSubmit={enviar}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={yo ? 'Escribí un mensaje…' : 'Elegí quién sos para escribir'}
          maxLength={1000}
          disabled={!yo}
          enterKeyHint="send"
          aria-label="Mensaje"
        />
        <button className="btn" disabled={!yo || !texto.trim() || enviando} aria-label="Enviar">➤</button>
      </form>
    </>
  );
}
