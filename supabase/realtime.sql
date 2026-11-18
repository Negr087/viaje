-- =========================================================
-- Activa el "en vivo" (Supabase Realtime) para las tablas del viaje.
-- Si ya corriste schema.sql antes de esta versión, pegá SOLO este archivo
-- en Supabase → SQL Editor → Run. Se puede correr más de una vez.
-- =========================================================
do $$
declare t text;
begin
  foreach t in array array[
    'habitaciones','personas','info_items','checklist_items','excursiones',
    'excursion_votos','fotos','foto_likes','agenda','turnos_ninera','gastos',
    'bingo_marcas','mensajes','premio_votos'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'viaje' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table viaje.%I', t);
    end if;
  end loop;
end $$;
