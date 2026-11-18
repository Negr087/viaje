import { createClient } from '@supabase/supabase-js';

// Los fallback evitan que el build falle si todavía no cargaste el .env.local
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'falta-la-anon-key';

// Todas las tablas viven en el schema "viaje" (ver supabase/schema.sql)
export const SCHEMA = 'viaje';
export const BUCKET = 'viaje-fotos';

// ---------- Token familiar ----------
// La anon key sola no puede leer ni escribir nada (ver supabase/seguridad.sql).
// El servidor entrega un token temporal a quien tiene la cookie del código
// familiar, y con eso se habla con Supabase (datos, fotos y en vivo).
const RENOVAR_ANTES_S = 60 * 60;
let actual = null; // { token, exp }
let pedido = null;

function leerGuardado() {
  try { return JSON.parse(sessionStorage.getItem('sb_token') || 'null'); } catch { return null; }
}

async function pedirToken() {
  try {
    const r = await fetch('/api/token', { cache: 'no-store', credentials: 'same-origin' });
    if (!r.ok) return null;
    const t = await r.json();
    if (!t?.token) return null;
    try { sessionStorage.setItem('sb_token', JSON.stringify(t)); } catch {}
    return t;
  } catch {
    return null; // sin señal: se usa el último token guardado
  }
}

async function tokenFamilia() {
  if (typeof window === 'undefined') return null;
  actual ||= leerGuardado();
  const ahora = Date.now() / 1000;
  if (actual && actual.exp - ahora > RENOVAR_ANTES_S) return actual.token;

  pedido ||= pedirToken().finally(() => { pedido = null; });
  const nuevo = await pedido;
  if (nuevo) actual = nuevo;
  // null = todavía no se configuró SUPABASE_JWT_SECRET → supabase-js usa la anon key
  return actual?.token ?? null;
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
  db: { schema: SCHEMA },
  accessToken: tokenFamilia,
});

export function archivoUrl(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
