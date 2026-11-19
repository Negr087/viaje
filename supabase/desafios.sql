-- =========================================================
-- Desafíos diarios: quién cumplió qué desafío, con la foto de prueba
-- Pegalo en Supabase → SQL Editor → Run. Se puede correr más de una vez.
-- =========================================================

set search_path to viaje, public, extensions;

create table if not exists desafios_hechos (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete cascade,  -- quién lo cumplió
  fecha date not null,                                                  -- día del viaje
  desafio text not null,                                                -- id del desafío (lib/desafios.js)
  foto_id uuid not null references fotos(id) on delete cascade,         -- si se borra la foto, se pierden los puntos
  created_at timestamptz default now(),
  unique (persona_id, fecha, desafio)
);

-- Mismo acceso que el resto de las tablas: solo con el token familiar
alter table desafios_hechos enable row level security;
drop policy if exists "familia" on desafios_hechos;
create policy "familia" on desafios_hechos for all to authenticated
  using ((select auth.jwt() ->> 'app') = 'viaje')
  with check ((select auth.jwt() ->> 'app') = 'viaje');
revoke all on desafios_hechos from anon;
grant select, insert, update, delete on desafios_hechos to authenticated;
grant all on desafios_hechos to service_role;

-- En vivo: el ranking se actualiza solo en todos los celulares
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'viaje' and tablename = 'desafios_hechos'
  ) then
    alter publication supabase_realtime add table viaje.desafios_hechos;
  end if;
end $$;
