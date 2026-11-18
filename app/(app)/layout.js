import PersonaProvider from '@/components/PersonaProvider';
import Nav from '@/components/Nav';
import Transicion from '@/components/Transicion';

// Layout de la app ya "adentro". Todo lo que habla con Supabase cuelga de acá,
// así la pantalla de /entrar no descarga ni el cliente ni la clave de Supabase.
export default function AppLayout({ children }) {
  return (
    <PersonaProvider>
      <main className="contenedor">
        <Transicion>{children}</Transicion>
      </main>
      <Nav />
    </PersonaProvider>
  );
}
