'use client';
import { usePathname } from 'next/navigation';

// Re-monta el contenido en cada cambio de ruta para disparar la animación de entrada.
export default function Transicion({ children }) {
  const pathname = usePathname();
  return <div key={pathname} className="pagina">{children}</div>;
}
