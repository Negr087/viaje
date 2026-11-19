-- =========================================================
-- Notificaciones push (llegan aunque la app esté cerrada)
-- Pegalo en Supabase → SQL Editor → Run. Se puede correr más de una vez.
-- Estas tablas solo las toca el servidor (service_role): sin políticas RLS,
-- desde el celular no se pueden leer ni escribir.
-- =========================================================

set search_path to viaje, public, extensions;

-- Un registro por celular que activó las notificaciones
create table if not exists push_suscripciones (
  endpoint text primary key,
  persona_id uuid not null references personas(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  apagados text[] not null default '{}',   -- tipos que ese celular no quiere: fotos, agenda, ninera, gastos
  created_at timestamptz default now()
);

-- Para no mandar dos veces lo mismo y para el límite de "fotos: una por hora"
create table if not exists push_enviados (
  clave text primary key,
  enviado timestamptz not null default now()
);

alter table push_suscripciones enable row level security;
alter table push_enviados enable row level security;
revoke all on push_suscripciones, push_enviados from anon, authenticated;
grant all on push_suscripciones, push_enviados to service_role;
