import { NextResponse } from 'next/server';

// Puerta de entrada: sin el código familiar no se ve nada.
const LIBRES = ['/entrar', '/api/entrar', '/manifest.json', '/sw.js', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];

export function middleware(req) {
  const codigo = process.env.FAMILY_CODE;
  if (!codigo) return NextResponse.next(); // sin código configurado, abierto (útil en local)

  const { pathname } = req.nextUrl;
  if (LIBRES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  if (req.cookies.get('familia')?.value === codigo) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/entrar';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
