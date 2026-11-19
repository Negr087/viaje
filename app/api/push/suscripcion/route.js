import { NextResponse } from 'next/server';
import { esFamilia, supabaseAdmin } from '@/lib/server/familia';
import { TIPOS_PUSH } from '@/lib/server/push';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function base(req) {
  if (!esFamilia(req)) return { error: NextResponse.json({ error: 'sin acceso' }, { status: 401 }) };
  const admin = supabaseAdmin();
  if (!admin) return { error: NextResponse.json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor' }, { status: 500 }) };
  return { admin };
}

// Guardar (o actualizar) la suscripción de este celular: a quién pertenece y qué tipos apagó
export async function POST(req) {
  const { admin, error } = base(req);
  if (error) return error;

  const { suscripcion, persona_id, apagados = [] } = await req.json().catch(() => ({}));
  const endpoint = suscripcion?.endpoint;
  const { p256dh, auth } = suscripcion?.keys || {};
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || !p256dh || !auth || !UUID.test(persona_id || '')) {
    return NextResponse.json({ error: 'datos inválidos' }, { status: 400 });
  }

  const { error: e } = await admin.from('push_suscripciones').upsert({
    endpoint,
    persona_id,
    p256dh,
    auth,
    apagados: (Array.isArray(apagados) ? apagados : []).filter((t) => TIPOS_PUSH.includes(t)),
  });
  if (e) return NextResponse.json({ error: e.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Desactivar en este celular
export async function DELETE(req) {
  const { admin, error } = base(req);
  if (error) return error;
  const { endpoint } = await req.json().catch(() => ({}));
  if (typeof endpoint !== 'string') return NextResponse.json({ error: 'datos inválidos' }, { status: 400 });
  await admin.from('push_suscripciones').delete().eq('endpoint', endpoint);
  return NextResponse.json({ ok: true });
}
