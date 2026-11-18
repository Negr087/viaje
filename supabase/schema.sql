-- =========================================================
-- App del viaje familiar — schema para Supabase
-- Pegalo entero en Supabase → SQL Editor → Run, y después seguridad.sql
--
-- Todo vive en el schema "viaje", separado de tus tablas en "public",
-- así se puede usar en un proyecto de Supabase que ya tengas.
-- Después de correrlo: Project Settings → Data API → Exposed schemas → agregá "viaje".
-- =========================================================

create schema if not exists viaje;
set search_path to viaje, public, extensions;

-- Habitaciones del resort
create table if not exists habitaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  notas text,
  created_at timestamptz default now()
);

-- Cada integrante de la familia
create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nucleo text,                 -- ej: "Familia Ibáñez", "Tíos"
  tipo text not null default 'adulto' check (tipo in ('adulto', 'nino', 'bebe')),
  emoji text default '🙂',
  habitacion_id uuid references habitaciones(id) on delete set null,
  created_at timestamptz default now()
);

-- Hub de info: vuelos, hotel, contactos, documentos
create table if not exists info_items (
  id uuid primary key default gen_random_uuid(),
  categoria text not null check (categoria in ('vuelo', 'hotel', 'contacto', 'documento', 'otro')),
  titulo text not null,
  detalle text,
  nucleo text,
  created_at timestamptz default now()
);

-- Checklist por persona
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete cascade,
  texto text not null,
  hecho boolean not null default false,
  created_at timestamptz default now()
);

-- Excursiones y quién se anota
create table if not exists excursiones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio numeric,
  apto_chicos boolean not null default true,
  fecha date,
  created_at timestamptz default now()
);

create table if not exists excursion_votos (
  excursion_id uuid not null references excursiones(id) on delete cascade,
  persona_id uuid not null references personas(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (excursion_id, persona_id)
);

-- Álbum compartido
create table if not exists fotos (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references personas(id) on delete set null,
  path text not null,
  caption text,
  dia date,
  es_video boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists foto_likes (
  foto_id uuid not null references fotos(id) on delete cascade,
  persona_id uuid not null references personas(id) on delete cascade,
  primary key (foto_id, persona_id)
);

-- Agenda del día
create table if not exists agenda (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  hora time,
  titulo text not null,
  lugar text,
  notas text,
  created_at timestamptz default now()
);

-- Turnos de niñera entre adultos
create table if not exists turnos_ninera (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  momento text not null default 'Cena',
  salen uuid[] not null default '{}',
  cuidan uuid[] not null default '{}',
  notas text,
  created_at timestamptz default now()
);

-- Gastos extra compartidos
create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  descripcion text not null,
  monto numeric not null check (monto > 0),
  moneda text not null default 'USD',
  pagado_por uuid references personas(id) on delete set null,
  participantes uuid[] not null default '{}',
  fecha date default current_date,
  created_at timestamptz default now()
);

-- Bingo del viaje
create table if not exists bingo_marcas (
  persona_id uuid not null references personas(id) on delete cascade,
  casilla int not null,
  created_at timestamptz default now(),
  primary key (persona_id, casilla)
);

-- Mensajes para la homenajeada (la que invita el viaje)
create table if not exists mensajes (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references personas(id) on delete cascade,
  texto text not null,
  created_at timestamptz default now()
);

-- Premios del viaje (los premios en sí están en lib/config.js)
create table if not exists premio_votos (
  premio text not null,
  votante_id uuid not null references personas(id) on delete cascade,
  nominado_id uuid not null references personas(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (premio, votante_id)
);

-- =========================================================
-- Permisos base para que la API de Supabase vea el schema "viaje".
-- Las políticas de acceso están en seguridad.sql: corrélo después de este archivo.
-- =========================================================
do $$
declare t text;
begin
  foreach t in array array[
    'habitaciones','personas','info_items','checklist_items','excursiones',
    'excursion_votos','fotos','foto_likes','agenda','turnos_ninera','gastos',
    'bingo_marcas','mensajes','premio_votos'
  ] loop
    execute format('alter table viaje.%I enable row level security', t);
  end loop;
end $$;

grant usage on schema viaje to authenticated, service_role;
grant all on all tables in schema viaje to service_role;

-- En vivo: que los cambios lleguen al instante a todos los celulares
-- (mismo contenido que supabase/realtime.sql)
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

-- Bucket para fotos y videos (con nombre propio para no chocar con otros buckets)
insert into storage.buckets (id, name, public)
values ('viaje-fotos', 'viaje-fotos', true)
on conflict (id) do nothing;

-- (las políticas del bucket están en seguridad.sql)

-- =========================================================
-- Datos iniciales: excursiones típicas de Puerto Plata
-- (precios vacíos: completalos cuando coticen)
-- =========================================================
insert into excursiones (nombre, descripcion, apto_chicos) values
  ('Teleférico Pico Isabel de Torres', 'Subida en teleférico, vista de toda la ciudad y jardín botánico arriba.', true),
  ('27 Charcos de Damajagua', 'Cascadas y saltos en el río. Hay recorridos cortos; consultar edad mínima.', false),
  ('Cayo Arena', 'Islote de arena con snorkel y paseo en lancha por los manglares.', true),
  ('Ocean World', 'Parque marino con delfines, lobos marinos y show.', true)
on conflict do nothing;
