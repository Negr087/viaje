import { NextResponse } from 'next/server';

export async function POST(req) {
  const form = await req.formData();
  const codigo = String(form.get('codigo') || '').trim().toUpperCase();
  const esperado = String(process.env.FAMILY_CODE || '').trim().toUpperCase();

  if (!esperado || codigo !== esperado) {
    return NextResponse.redirect(new URL('/entrar?error=1', req.url), 303);
  }

  const res = NextResponse.redirect(new URL('/', req.url), 303);
  res.cookies.set('familia', process.env.FAMILY_CODE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
