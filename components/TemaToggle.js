'use client';
import { useEffect, useState } from 'react';

function temaActual() {
  const forzado = document.documentElement.dataset.theme;
  if (forzado === 'light' || forzado === 'dark') return forzado;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function TemaToggle() {
  const [tema, setTema] = useState(null);

  useEffect(() => { setTema(temaActual()); }, []);

  const cambiar = () => {
    const nuevo = temaActual() === 'dark' ? 'light' : 'dark';
    const aplicar = () => {
      document.documentElement.dataset.theme = nuevo;
      setTema(nuevo);
    };
    try { localStorage.setItem('tema', nuevo); } catch {}
    // View Transitions API: el cambio de tema se hace con un fundido suave.
    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(aplicar);
    } else {
      aplicar();
    }
  };

  return (
    <button
      type="button"
      className="tema-btn"
      onClick={cambiar}
      aria-label={tema === 'dark' ? 'Pasar a modo claro' : 'Pasar a modo oscuro'}
      title={tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      {tema && <span key={tema}>{tema === 'dark' ? '🌙' : '☀️'}</span>}
    </button>
  );
}
