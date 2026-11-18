'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  ['/', '🏠', 'Inicio'],
  ['/fotos', '📸', 'Fotos'],
  ['/agenda', '📅', 'Agenda'],
  ['/checklist', '✅', 'Checklist'],
  ['/gastos', '💸', 'Gastos'],
];

export default function Nav() {
  const pathname = usePathname();
  if (pathname.startsWith('/entrar')) return null;

  return (
    <nav className="nav">
      {ITEMS.map(([href, icono, label]) => {
        const activo = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={activo ? 'activo' : ''}>
            <span className="nav-icono">{icono}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
