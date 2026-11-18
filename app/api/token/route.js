import { NextResponse } from 'next/server';
import { esFamilia, firmarToken } from '@/lib/server/familia';

export const dynamic = 'force-dynamic';

// Entrega un token temporal de Supabase solo a quien ya entró con el código familiar.
export async function GET(req) {
  if (!esFamilia(req)) return NextResponse.json({ error: 'sin acceso' }, { status: 401 });

  const t = firmarToken();
  // Sin SUPABASE_JWT_SECRET el cliente sigue con la anon key (modo previo a seguridad.sql).
  if (!t) return NextResponse.json({ token: null }, { headers: { 'Cache-Control': 'no-store' } });

  return NextResponse.json(t, { headers: { 'Cache-Control': 'no-store' } });
}
