'use client';
import Link from 'next/link';

export function Cabecera({ titulo, emoji, children }) {
  return (
    <header className="cabecera">
      <Link href="/" className="volver" aria-label="Volver">‹</Link>
      <h1>{emoji && <span className="cabecera-emoji" aria-hidden="true">{emoji}</span>}{titulo}</h1>
      {children && <div className="cabecera-extra">{children}</div>}
    </header>
  );
}

export function PersonaChips({ personas, value, onChange }) {
  return (
    <div className="chips">
      {personas.map((p) => {
        const on = value.includes(p.id);
        return (
          <button
            type="button"
            key={p.id}
            className={'chip' + (on ? ' on' : '')}
            onClick={() => onChange(on ? value.filter((x) => x !== p.id) : [...value, p.id])}
          >
            {p.emoji} {p.nombre}
          </button>
        );
      })}
    </div>
  );
}

export function Vacio({ children }) {
  return <p className="vacio">{children}</p>;
}

export function Progreso({ valor, total }) {
  const pct = total ? Math.round((valor / total) * 100) : 0;
  return (
    <div className="progreso" title={`${valor}/${total}`}>
      <div className="progreso-barra" style={{ width: pct + '%' }} />
    </div>
  );
}

export function nombres(ids, mapa) {
  return (ids || []).map((id) => mapa[id]?.nombre).filter(Boolean).join(', ');
}
