import './globals.css';
import { Fredoka, Nunito, Pacifico } from 'next/font/google';
import SWRegister from '@/components/SWRegister';
import { SCRIPT_TEMA } from '@/lib/tema';
import { VIAJE } from '@/lib/config';

// Pacifico: la letra "de playa" para títulos de marca.
// Fredoka: redondeada y suave para títulos y botones. Nunito: lectura cómoda.
const pacifico = Pacifico({ subsets: ['latin'], weight: '400', variable: '--font-pacifico', display: 'swap' });
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });

export const metadata = {
  title: { default: VIAJE.nombre, template: `%s · ${VIAJE.nombre}` },
  description: `La app de la familia para ${VIAJE.destino}`,
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: { capable: true, title: 'Viaje', statusBarStyle: 'black-translucent' },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5efe4' },
    { media: '(prefers-color-scheme: dark)', color: '#04111a' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${pacifico.variable} ${fredoka.variable} ${nunito.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body>
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
