// Solo servidor. Manda notificaciones push a los celulares suscriptos.
import 'server-only';
import webpush from 'web-push';

export const TIPOS_PUSH = ['fotos', 'agenda', 'ninera', 'gastos'];

let configurado = false;
function configurar(origen) {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  if (!configurado) {
    // El "subject" identifica quién manda: un mailto: o la URL de la app.
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || origen, pub, priv);
    configurado = true;
  }
  return true;
}

// Manda `aviso` ({ titulo, cuerpo, url, tag }) a las suscripciones de `personas`
// (o a todas si personas es null), salteando a `excepto` y a quien apagó ese tipo.
export async function mandar(admin, { tipo, personas = null, excepto = null, aviso, origen }) {
  if (!configurar(origen)) return { enviados: 0, error: 'Faltan las claves VAPID en el servidor' };

  let q = admin.from('push_suscripciones').select('endpoint, persona_id, p256dh, auth, apagados');
  if (personas) {
    if (!personas.length) return { enviados: 0 };
    q = q.in('persona_id', personas);
  }
  const { data: subs, error } = await q;
  if (error) return { enviados: 0, error: error.message };

  const destino = (subs || []).filter((s) => s.persona_id !== excepto && !s.apagados.includes(tipo));
  const payload = JSON.stringify(aviso);

  const resultados = await Promise.allSettled(destino.map((s) =>
    webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 60 * 60 })
  ));

  // Celulares que desinstalaron la app o revocaron el permiso: se limpian
  const vencidos = destino
    .filter((_, i) => [404, 410].includes(resultados[i].reason?.statusCode))
    .map((s) => s.endpoint);
  if (vencidos.length) await admin.from('push_suscripciones').delete().in('endpoint', vencidos);

  return { enviados: resultados.filter((r) => r.status === 'fulfilled').length };
}

// true la primera vez que se pide una clave; false si ya se había usado (evita duplicados)
export async function primeraVez(admin, clave) {
  const { error } = await admin.from('push_enviados').insert({ clave });
  return !error;
}
