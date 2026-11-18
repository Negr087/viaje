'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePersonas } from '@/components/PersonaProvider';
import { Cabecera, PersonaChips, Vacio, nombres } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useEnVivo } from '@/lib/en-vivo';
import { consultas } from '@/lib/consultas';
import { VIAJE, fmtDia } from '@/lib/config';
import { convertir, useCotizaciones } from '@/lib/monedas';
import Conversor from '@/components/Conversor';

const MONEDAS = ['USD', 'DOP', 'ARS'];

function balances(gastos) {
  const net = {};
  for (const g of gastos) {
    const parts = g.participantes || [];
    if (!parts.length || !g.pagado_por) continue;
    const cuota = Number(g.monto) / parts.length;
    net[g.pagado_por] = (net[g.pagado_por] || 0) + Number(g.monto);
    for (const p of parts) net[p] = (net[p] || 0) - cuota;
  }
  return net;
}

// Minimiza la cantidad de transferencias (greedy)
function saldar(net) {
  const deben = [], cobran = [];
  for (const [id, v] of Object.entries(net)) {
    if (v < -0.01) deben.push({ id, v: -v });
    else if (v > 0.01) cobran.push({ id, v });
  }
  deben.sort((a, b) => b.v - a.v);
  cobran.sort((a, b) => b.v - a.v);
  const pagos = [];
  let i = 0, j = 0;
  while (i < deben.length && j < cobran.length) {
    const m = Math.min(deben[i].v, cobran[j].v);
    pagos.push({ de: deben[i].id, a: cobran[j].id, monto: m });
    deben[i].v -= m; cobran[j].v -= m;
    if (deben[i].v < 0.01) i++;
    if (cobran[j].v < 0.01) j++;
  }
  return pagos;
}

const fmt = (n) => n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function Gastos() {
  const { yo, adultos, mapa } = usePersonas();
  const [gastos, setGastos] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ descripcion: '', monto: '', moneda: VIAJE.moneda, pagado_por: '', participantes: [] });
  const { cot, error } = useCotizaciones();
  const [tipoArs, setTipoArsState] = useState('tarjeta');
  useEffect(() => {
    try { const t = localStorage.getItem('tipo_ars'); if (t) setTipoArsState(t); } catch {}
  }, []);
  const setTipoArs = (t) => {
    setTipoArsState(t);
    try { localStorage.setItem('tipo_ars', t); } catch {}
  };
  const equivalentes = (monto, mon) => MONEDAS.filter((m) => m !== mon)
    .map((m) => { const r = convertir(monto, mon, m, cot, tipoArs); return r == null ? null : `${m} ${fmt(r)}`; })
    .filter(Boolean).join(' · ');

  const cargar = useCallback(async () => {
    const { data } = await consultas.gastos();
    setGastos(data || []);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEnVivo(['gastos'], cargar);

  function abrir() {
    setForm({ descripcion: '', monto: '', moneda: VIAJE.moneda, pagado_por: yo?.id || '', participantes: adultos.map((a) => a.id) });
    setAbierto(!abierto);
  }

  async function guardar(e) {
    e.preventDefault();
    if (!form.descripcion.trim() || !Number(form.monto) || !form.pagado_por || !form.participantes.length) {
      return alert('Completá qué, cuánto, quién pagó y entre quiénes se divide.');
    }
    await supabase.from('gastos').insert({ ...form, monto: Number(form.monto) });
    setAbierto(false);
    cargar();
  }

  async function borrar(id) {
    if (!confirm('¿Borrar el gasto?')) return;
    await supabase.from('gastos').delete().eq('id', id);
    cargar();
  }

  const monedasUsadas = [...new Set(gastos.map((g) => g.moneda))];

  return (
    <>
      <Cabecera titulo="Gastos extra" emoji="💸">
        <button className="btn chico" onClick={abrir}>{abierto ? 'Cerrar' : '+ Gasto'}</button>
      </Cabecera>

      <p className="muted small">El viaje lo invita {VIAJE.homenajeada} 🧡. Esto es para lo extra: excursiones, propinas, compras compartidas.</p>

      {abierto && (
        <form className="card stack" onSubmit={guardar}>
          <input placeholder="Qué fue (ej: Lancha a Cayo Arena)" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <div className="row">
            <input className="grow" style={{ width: 'auto' }} type="number" step="0.01" placeholder="Monto" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
            <select style={{ width: '90px' }} value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}>
              {MONEDAS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <label>Pagó</label>
          <select value={form.pagado_por} onChange={(e) => setForm({ ...form, pagado_por: e.target.value })}>
            <option value="">Elegí</option>
            {adultos.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.nombre}</option>)}
          </select>
          <div className="row between">
            <label style={{ margin: 0 }}>Se divide entre</label>
            <div className="row">
              <button type="button" className="btn chico ghost" onClick={() => setForm({ ...form, participantes: adultos.map((a) => a.id) })}>Todos</button>
              <button type="button" className="btn chico ghost" onClick={() => setForm({ ...form, participantes: [] })}>Nadie</button>
            </div>
          </div>
          <PersonaChips personas={adultos} value={form.participantes} onChange={(participantes) => setForm({ ...form, participantes })} />
          {Number(form.monto) > 0 && form.participantes.length > 0 && (
            <p className="small muted">
              {form.moneda} {fmt(Number(form.monto) / form.participantes.length)} por persona
              {cot && <> (≈ {equivalentes(Number(form.monto) / form.participantes.length, form.moneda)})</>}
            </p>
          )}
          <button className="btn">Guardar</button>
        </form>
      )}

      <Conversor cot={cot} error={error} tipoArs={tipoArs} setTipoArs={setTipoArs} />

      {monedasUsadas.map((mon) => {
        const pagos = saldar(balances(gastos.filter((g) => g.moneda === mon)));
        const total = gastos.filter((g) => g.moneda === mon).reduce((s, g) => s + Number(g.monto), 0);
        return (
          <div key={mon} className="card mar">
            <div className="row between">
              <b>Para quedar a mano ({mon})</b>
              <span className="small">Total: {mon} {fmt(total)}</span>
            </div>
            {cot && total > 0 && <p className="equivalente">≈ {equivalentes(total, mon)}</p>}
            {pagos.length === 0
              ? <p style={{ margin: '0.5rem 0 0' }}>¡Todos a mano! 🙌</p>
              : pagos.map((p, i) => (
                <p key={i} style={{ margin: '0.5rem 0 0' }}>
                  {mapa[p.de]?.nombre} → {mapa[p.a]?.nombre}: <b>{mon} {fmt(p.monto)}</b>
                </p>
              ))}
          </div>
        );
      })}

      {gastos.length === 0 && <Vacio>Sin gastos cargados.</Vacio>}

      {gastos.map((g) => (
        <div key={g.id} className="card">
          <div className="row between">
            <b>{g.descripcion}</b>
            <div className="row">
              <b>{g.moneda} {fmt(Number(g.monto))}</b>
              <button className="icon-btn" onClick={() => borrar(g.id)}>🗑️</button>
            </div>
          </div>
          <p className="small muted" style={{ margin: '0.3rem 0 0' }}>
            Pagó {mapa[g.pagado_por]?.nombre || '?'} · {fmtDia(g.fecha)} · entre {g.participantes.length}: {nombres(g.participantes, mapa)}
          </p>
        </div>
      ))}
    </>
  );
}
