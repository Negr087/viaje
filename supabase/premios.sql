-- =========================================================
-- Premios agregados desde la app (los fijos siguen en lib/config.js)
-- Pegalo en Supabase → SQL Editor → Run. Se puede correr más de una vez.
-- =========================================================

set search_path to viaje, public, extensions;

create table if not exists premios_extra (
  id uuid primary key default gen_random_uuid(),
  emoji text not null default '🏅',
  titulo text not null,
  creado_por uuid references personas(id) on delete set null,
  created_at timestamptz default now()
);

-- Mismo acceso que el resto de las tablas: solo con el token familiar
alter table premios_extra enable row level security;
drop policy if exists "familia" on premios_extra;
create policy "familia" on premios_extra for all to authenticated
  using ((select auth.jwt() ->> 'app') = 'viaje')
  with check ((select auth.jwt() ->> 'app') = 'viaje');
revoke all on premios_extra from anon;
grant select, insert, update, delete on premios_extra to authenticated;
grant all on premios_extra to service_role;

-- En vivo: un premio nuevo aparece al instante en todos los celulares
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'viaje' and tablename = 'premios_extra'
  ) then
    alter publication supabase_realtime add table viaje.premios_extra;
  end if;
end $$;
