-- =========================================================
-- Seguridad — corré esto DESPUÉS de schema.sql (y de cargar las variables
-- SUPABASE_JWT_SECRET y SUPABASE_SERVICE_ROLE_KEY en el servidor).
-- Supabase → SQL Editor → Run. Se puede correr más de una vez.
--
-- Cómo funciona:
-- · La anon key (la que viaja en el navegador) ya no puede leer ni escribir nada.
-- · Quien entra con el código familiar recibe de /api/token un token temporal
--   (rol `authenticated` + claim app = 'viaje'). Solo con eso se accede.
-- · El claim `app` evita que usuarios de OTRAS apps de este mismo proyecto de
--   Supabase (que también son `authenticated`) vean los datos del viaje.
-- · Las fotos no se pueden borrar desde el celular: el borrado pasa por
--   /api/fotos/[id] con la service_role key, de a una.
-- =========================================================

-- ---------- Tablas ----------
do $$
declare t text;
begin
  foreach t in array array[
    'habitaciones','personas','info_items','checklist_items','excursiones',
    'excursion_votos','fotos','foto_likes','agenda','turnos_ninera','gastos',
    'bingo_marcas','mensajes','premio_votos'
  ] loop
    execute format('alter table viaje.%I enable row level security', t);
    -- políticas viejas (abiertas para anon)
    execute format('drop policy if exists "familia_todo" on viaje.%I', t);
    execute format('drop policy if exists "familia" on viaje.%I', t);
    execute format('drop policy if exists "familia_ver" on viaje.%I', t);
    execute format('drop policy if exists "familia_subir" on viaje.%I', t);

    if t = 'fotos' then
      -- ver y subir sí; editar/borrar solo desde el servidor
      execute format($p$create policy "familia_ver" on viaje.%I for select to authenticated
        using ((select auth.jwt() ->> 'app') = 'viaje')$p$, t);
      execute format($p$create policy "familia_subir" on viaje.%I for insert to authenticated
        with check ((select auth.jwt() ->> 'app') = 'viaje')$p$, t);
    else
      execute format($p$create policy "familia" on viaje.%I for all to authenticated
        using ((select auth.jwt() ->> 'app') = 'viaje')
        with check ((select auth.jwt() ->> 'app') = 'viaje')$p$, t);
    end if;
  end loop;
end $$;

-- ---------- Permisos ----------
-- anon: nada. authenticated: solo lo justo (sin TRUNCATE, TRIGGER, REFERENCES).
revoke all on all tables in schema viaje from anon, authenticated;
revoke all on all sequences in schema viaje from anon, authenticated;
revoke usage on schema viaje from anon;

grant usage on schema viaje to authenticated, service_role;
grant select, insert, update, delete on all tables in schema viaje to authenticated;
revoke update, delete on viaje.fotos from authenticated;
grant all on all tables in schema viaje to service_role;
grant all on all sequences in schema viaje to service_role;

alter default privileges in schema viaje revoke all on tables from anon, authenticated;
alter default privileges in schema viaje revoke all on sequences from anon, authenticated;
alter default privileges in schema viaje grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema viaje grant all on tables to service_role;

-- ---------- Bucket de fotos ----------
-- Público para ver (las rutas tienen un id aleatorio imposible de adivinar),
-- solo fotos (sin videos), máximo 15 MB por archivo.
update storage.buckets
set public = true,
    file_size_limit = 15728640,
    allowed_mime_types = array['image/*']
where id = 'viaje-fotos';

drop policy if exists "viaje_fotos_leer" on storage.objects;
drop policy if exists "viaje_fotos_subir" on storage.objects;
drop policy if exists "viaje_fotos_borrar" on storage.objects;

-- Subir: solo con token familiar. Sin políticas de update/delete: nadie puede
-- pisar ni borrar archivos con el token (solo el servidor, con service_role).
create policy "viaje_fotos_subir" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'viaje-fotos' and (select auth.jwt() ->> 'app') = 'viaje');
