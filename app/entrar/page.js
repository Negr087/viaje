import { VIAJE } from '@/lib/config';

export const metadata = { title: 'Entrar' };

export default async function Entrar({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="contenedor">
    <div className="entrar">
      <div className="entrar-card">
        <div className="entrar-emoji">🌴</div>
        <h1>{VIAJE.nombre}</h1>
        <p className="muted">{VIAJE.destino}</p>
        <form action="/api/entrar" method="post" className="stack">
          <input
            name="codigo"
            placeholder="Código de la familia"
            autoCapitalize="characters"
            autoComplete="off"
            required
          />
          {error && <p className="error">Código incorrecto, probá de nuevo.</p>}
          <button className="btn" type="submit">Entrar</button>
        </form>
      </div>
    </div>
    </main>
  );
}
