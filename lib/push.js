'use client';
// Notificaciones push del lado del celular.

export const TIPOS = [
  ['fotos', '📸 Fotos nuevas', 'Como mucho una por hora por persona'],
  ['agenda', '📅 Agenda', 'Cuando se agrega algo'],
  ['ninera', '🍼 Niñera', 'Cuando te toca cuidar'],
  ['gastos', '💸 Gastos', 'Cuando te incluyen en uno'],
  ['chat', '💬 Chat', 'Cada mensaje nuevo'],
];

const CLAVE_APAGADOS = 'push_apagados';

// Le avisa al servidor que se cargó algo. Si falla (sin señal) no pasa nada:
// el aviso en vivo dentro de la app igual les llega a los que la tienen abierta.
export function avisar(tipo, id, de) {
  if (!id) return;
  fetch('/api/push/avisar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo, id, de: de || null }),
    keepalive: true,
  }).catch(() => {});
}

export function soporte() {
  if (typeof window === 'undefined') return 'cargando';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  // En iPhone las notificaciones solo andan con la app agregada a la pantalla de inicio
  if (ios && !instalada) return 'ios-instalar';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'no';
  return 'si';
}

function claveBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function leerApagados() {
  try { return JSON.parse(localStorage.getItem(CLAVE_APAGADOS)) || []; } catch { return []; }
}

export async function suscripcionActual() {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

async function guardar(sub, personaId, apagados) {
  const r = await fetch('/api/push/suscripcion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suscripcion: sub.toJSON(), persona_id: personaId, apagados }),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'No se pudo guardar');
}

export async function activar(personaId) {
  const clave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!clave) throw new Error('Faltan configurar las notificaciones en el servidor');
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') throw new Error('permiso');
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveBytes(clave) }));
  await guardar(sub, personaId, leerApagados());
  return sub;
}

// Re-guarda la suscripción (cuando cambian los tipos apagados o la persona del celular)
export async function actualizar(personaId, apagados) {
  try { localStorage.setItem(CLAVE_APAGADOS, JSON.stringify(apagados)); } catch {}
  const sub = await suscripcionActual();
  if (sub) await guardar(sub, personaId, apagados);
}

export async function desactivar() {
  const sub = await suscripcionActual();
  if (!sub) return;
  await fetch('/api/push/suscripcion', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe();
}
