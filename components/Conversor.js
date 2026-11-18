'use client';
import { useState } from 'react';
import { TIPOS_ARS, convertir } from '@/lib/monedas';

const MONEDAS = { USD: '🇺🇸 Dólar', DOP: '🇩🇴 Peso dominicano', ARS: '🇦🇷 Peso argentino' };
const fmt = (n, mon) => n.toLocaleString('es-AR', { maximumFractionDigits: mon === 'USD' ? 2 : 0 });

export default function Conversor({ cot, error, tipoArs, setTipoArs }) {
  const [monto, setMonto] = useState('100');
  const [de, setDe] = useState('USD');
  const n = Number(String(monto).replace(',', '.'));

  const actualizada = cot && new Date(cot.t).toLocaleString('es-AR', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="card">
      <div className="row between" style={{ marginBottom: '0.6rem' }}>
        <h2 style={{ margin: 0 }}>💱 Conversor</h2>
        {actualizada && <span className="small muted">Cotización del {actualizada}</span>}
      </div>

      {!cot && (error
        ? <p className="small muted">No pude traer las cotizaciones. Probá cuando haya señal.</p>
        : <p className="small muted">Buscando cotizaciones…</p>)}

      {cot && (
        <>
          <div className="conversor-monto">
            <input inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} aria-label="Monto" />
            <select value={de} onChange={(e) => setDe(e.target.value)} aria-label="Moneda">
              {Object.keys(MONEDAS).map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div className="conversor-res">
            {Object.keys(MONEDAS).filter((m) => m !== de).map((m) => {
              const r = convertir(n, de, m, cot, tipoArs);
              return (
                <div key={m} className="conversor-fila">
                  <span>{MONEDAS[m]}</span>
                  <b>{r == null || !n ? '—' : `${m} ${fmt(r, m)}`}</b>
                </div>
              );
            })}
          </div>

          <div className="row" style={{ marginTop: '0.8rem' }}>
            <span className="small muted">Dólar para pesos argentinos:</span>
            <div className="chips">
              {TIPOS_ARS.filter(([k]) => cot.ARS[k]).map(([k, label]) => (
                <button key={k} type="button" className={'chip' + (tipoArs === k ? ' on' : '')} onClick={() => setTipoArs(k)}>
                  {label} ${fmt(cot.ARS[k], 'ARS')}
                </button>
              ))}
            </div>
          </div>
          <p className="small muted" style={{ margin: '0.5rem 0 0' }}>
            Pagando con tarjeta argentina en el exterior se usa el dólar tarjeta.
          </p>
        </>
      )}
    </div>
  );
}
