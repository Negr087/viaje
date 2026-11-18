'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import EnVivo from '@/components/EnVivo';
import Precarga from '@/components/Precarga';

const Ctx = createContext(null);
export const usePersonas = () => useContext(Ctx);

// "Login" sin login: cada uno elige quién es y queda guardado en el celular.
export default function PersonaProvider({ children }) {
  const [personas, setPersonas] = useState([]);
  const [cargado, setCargado] = useState(false);
  const [yoId, setYoId] = useState(null);
  const [eligiendo, setEligiendo] = useState(false);
  const [omitido, setOmitido] = useState(false);
  const pathname = usePathname();

  const recargar = useCallback(async () => {
    const { data } = await supabase
      .from('personas')
      .select('*')
      .order('nucleo', { nullsFirst: false })
      .order('nombre');
    setPersonas(data || []);
    setCargado(true);
  }, []);

  useEffect(() => {
    setYoId(localStorage.getItem('persona_id'));
    try { setOmitido(sessionStorage.getItem('selector_omitido') === '1'); } catch {}
    if (!pathname.startsWith('/entrar')) recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recargar]);

  // "Más tarde": oculta el selector hasta cerrar la pestaña/app.
  const omitir = () => {
    try { sessionStorage.setItem('selector_omitido', '1'); } catch {}
    setOmitido(true);
    setEligiendo(false);
  };

  // Si alguien se agrega o cambia su emoji, se actualiza en todos los celulares.
  useEnVivo(pathname.startsWith('/entrar') ? [] : ['personas', 'habitaciones'], recargar);

  const elegir = (id) => {
    localStorage.setItem('persona_id', id);
    setYoId(id);
    setEligiendo(false);
  };

  const mapa = useMemo(() => Object.fromEntries(personas.map((p) => [p.id, p])), [personas]);
  const yo = mapa[yoId] || null;
  const adultos = useMemo(() => personas.filter((p) => p.tipo === 'adulto'), [personas]);

  const libre = pathname.startsWith('/familia') || pathname.startsWith('/entrar');
  const mostrarSelector = cargado && !libre && (eligiendo || (!yo && !omitido));

  return (
    <Ctx.Provider value={{ personas, adultos, mapa, yo, recargar, elegir, cambiar: () => setEligiendo(true) }}>
      {children}
      {!pathname.startsWith('/entrar') && <><EnVivo yo={yo} mapa={mapa} /><Precarga /></>}
      {mostrarSelector && (
        <div className="overlay">
          <div className="modal">
            {personas.length === 0 ? (
              <>
                <h2>¡Bienvenidos! 🌴</h2>
                <p>Todavía no hay nadie cargado. Arrancá cargando a la familia.</p>
                <Link className="btn" href="/familia">Cargar la familia</Link>
                <button className="btn ghost" onClick={omitir}>Más tarde</button>
              </>
            ) : (
              <>
                <h2>¿Quién sos?</h2>
                <div className="persona-grid">
                  {personas.filter((p) => p.tipo !== 'bebe').map((p) => (
                    <button key={p.id} className="persona-btn" onClick={() => elegir(p.id)}>
                      <span className="persona-emoji">{p.emoji || '🙂'}</span>
                      <span>{p.nombre}</span>
                    </button>
                  ))}
                </div>
                <p className="muted small">¿No estás? <Link href="/familia">Agregate acá</Link></p>
                {yo
                  ? <button className="btn ghost" onClick={() => setEligiendo(false)}>Cancelar</button>
                  : <button className="btn ghost" onClick={omitir}>Más tarde</button>}
              </>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
