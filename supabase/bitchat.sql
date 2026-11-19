-- =========================================================
-- Suma "Bajar Bitchat" al checklist de los que ya tenían su lista cargada
-- (adultos y chicos, no bebés). Se puede correr más de una vez: no duplica.
-- =========================================================

set search_path to viaje, public, extensions;

insert into checklist_items (persona_id, texto)
select p.id, 'Bajar Bitchat y probarlo en casa (para chatear en el avión)'
from personas p
where p.tipo in ('adulto', 'nino')
  and exists (select 1 from checklist_items c where c.persona_id = p.id)
  and not exists (
    select 1 from checklist_items c
    where c.persona_id = p.id and c.texto ilike '%bitchat%'
  );
