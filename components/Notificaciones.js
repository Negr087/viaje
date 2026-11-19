'use client';
import { useEffect, useState } from 'react';
import { TIPOS, activar, actualizar, desactivar, leerApagados, soporte, suscripcionActual } from '@/lib/push';

// Tarjeta de la portada para activar las notificaciones y elegir cuáles recibir.
export default function Notificaciones({ yo }) {
  const [estado, setEstado] = useState('cargando'); // cargando | no | ios-instalar | bloqueadas | apagadas | activas
  const [apagados, setApagados] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const s = soporte();
    if (s !== 'si') { setEstado(s); return; }
    setApagados(leerApagados());
    if (Notification.permission === 'denied') { setEstado('bloqueadas'); return; }
    suscripcionActual().then((sub) => setEstado(sub ? 'activas' : 'apagadas')).catch(() => setEstado('apagadas'));
  }, []);

  // Si alguien usa el celular de otro y toca "No soy yo", las notificaciones pasan a ser del nuevo
  const yoId = yo?.id;
  useEffect(() => {
    if (estado === 'activas' && yoId) actualizar(yoId, leerApagados()).catch(() => {});
  }, [estado, yoId]);

  if (!yo || estado === 'cargando' || estado === 'no') return null;

  async function prender() {
    setOcupado(true); setError('');
    try {
      await activar(yo.id);
      setEstado('activas');
    } catch (e) {
      if (e.message === 'permiso') setEstado(Notification.permission === 'denied' ? 'bloqueadas' : 'apagadas');
      else setError(e.message);
    }
    setOcupado(false);
  }

  async function apagar() {
    setOcupado(true);
    await desactivar().catch(() => {});
    setEstado('apagadas'); setAbierto(false);
    setOcupado(false);
  }

  async function alternar(tipo) {
    const nuevos = apagados.includes(tipo) ? apagados.filter((t) => t !== tipo) : [...apagados, tipo];
    setApagados(nuevos);
    actualizar(yo.id, nuevos).catch(() => {});
  }

  if (estado === 'ios-instalar') {
    return (
      <div className="card">
        <b>🔔 Notificaciones</b>
        <p className="small muted" style={{ margin: '0.3rem 0 0' }}>
          Para recibirlas en el iPhone, agregá la app a la pantalla de inicio: tocá <b>Compartir</b> (el cuadrado con la flecha)
          → <b>Agregar a inicio</b>, y abrila desde ese ícono.
        </p>
      </div>
    );
  }

  if (estado === 'bloqueadas') {
    return (
      <div className="card">
        <b>🔔 Notificaciones bloqueadas</b>
        <p className="small muted" style={{ margin: '0.3rem 0 0' }}>
          Las bloqueaste en este celular. Para activarlas, entrá a la configuración del celular → Notificaciones → esta app.
        </p>
      </div>
    );
  }

  if (estado === 'apagadas') {
    return (
      <div className="card">
        <div className="row between">
          <div>
            <b>🔔 Notificaciones</b>
            <p className="small muted" style={{ margin: '0.2rem 0 0' }}>Enterate de la agenda, tus turnos y las fotos aunque la app esté cerrada.</p>
          </div>
          <button className="btn chico" onClick={prender} disabled={ocupado}>{ocupado ? '...' : 'Activar'}</button>
        </div>
        {error && <p className="small" style={{ margin: '0.4rem 0 0', color: 'var(--coral, #e5533d)' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="row between">
        <b>🔔 Notificaciones activas</b>
        <button className="btn ghost chico" onClick={() => setAbierto(!abierto)}>{abierto ? 'Listo' : 'Elegir'}</button>
      </div>
      {abierto && (
        <div className="stack" style={{ marginTop: '0.6rem' }}>
          {TIPOS.map(([tipo, titulo, sub]) => (
            <label key={tipo} className="row between" style={{ cursor: 'pointer' }}>
              <span>{titulo}<br /><span className="small muted">{sub}</span></span>
              <input type="checkbox" checked={!apagados.includes(tipo)} onChange={() => alternar(tipo)} />
            </label>
          ))}
          <button className="btn ghost chico" onClick={apagar} disabled={ocupado}>Desactivar en este celular</button>
        </div>
      )}
    </div>
  );
}
