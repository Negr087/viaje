-- =========================================================
-- Chat de la familia (sobre todo para los chicos, que no están en el WhatsApp)
-- Pegalo en Supabase → SQL Editor → Run. Se puede correr más de una vez.
-- =========================================================

set search_path to viaje, public, extensions;

create table if not exists chat (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 1000),
  created_at timestamptz default now()
);
create index if not exists chat_created_at on chat (created_at desc);

-- Mismo acceso que el resto de las tablas: solo con el token familiar
alter table chat enable row level security;
drop policy if exists "familia" on chat;
create policy "familia" on chat for all to authenticated
  using ((select auth.jwt() ->> 'app') = 'viaje')
  with check ((select auth.jwt() ->> 'app') = 'viaje');
revoke all on chat from anon;
grant select, insert, update, delete on chat to authenticated;
grant all on chat to service_role;

-- En vivo: los mensajes llegan al instante a todos los celulares
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'viaje' and tablename = 'chat'
  ) then
    alter publication supabase_realtime add table viaje.chat;
  end if;
end $$;
