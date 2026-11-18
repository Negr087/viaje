// Solo servidor. Nunca importar desde un componente 'use client'.
import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Identidad fija de "la familia" dentro del token (no es un usuario de Supabase Auth).
const SUB_FAMILIA = 'c5090c88-f76b-4839-bab1-a388ba26a970';
// Claim que exigen las políticas RLS (ver supabase/seguridad.sql).
export const CLAIM_APP = 'viaje';
const DURACION_S = 12 * 60 * 60;

function iguales(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// ¿El request trae la cookie del código familiar? (misma regla que middleware.js)
export function esFamilia(req) {
  const codigo = process.env.FAMILY_CODE;
  if (!codigo) return true; // sin código configurado la app está abierta (útil en local)
  const cookie = req.cookies.get('familia')?.value;
  return !!cookie && iguales(cookie, codigo);
}

const b64url = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

// JWT HS256 firmado con el "JWT secret" del proyecto: Supabase lo acepta como rol
// `authenticated`, y las políticas RLS además exigen app = 'viaje'.
export function firmarToken() {
  const secreto = process.env.SUPABASE_JWT_SECRET;
  if (!secreto) return null;
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + DURACION_S;
  const cabecera = b64url({ alg: 'HS256', typ: 'JWT' });
  const cuerpo = b64url({ sub: SUB_FAMILIA, role: 'authenticated', aud: 'authenticated', app: CLAIM_APP, iat, exp });
  const firma = createHmac('sha256', secreto).update(`${cabecera}.${cuerpo}`).digest('base64url');
  return { token: `${cabecera}.${cuerpo}.${firma}`, exp };
}

// Cliente con la service_role key: saltea RLS. Solo para acciones puntuales
// que la familia no puede hacer directo (ej: borrar archivos del bucket).
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'viaje' },
  });
}
