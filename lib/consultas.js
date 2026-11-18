// Consultas compartidas entre las páginas y la precarga offline.
// Tienen que ser idénticas en los dos lados: el service worker guarda cada
// respuesta por URL, así que la misma consulta = la misma URL = sirve sin señal.
import { supabase } from './supabase';

export const consultas = {
  info: () => supabase.from('info_items').select('*').order('created_at'),
  agenda: () => supabase.from('agenda').select('*').order('hora', { nullsFirst: true }),
  checklist: () => supabase.from('checklist_items').select('*').order('created_at'),
  excursiones: () => supabase.from('excursiones').select('*, excursion_votos(persona_id)').order('created_at'),
  ninera: () => supabase.from('turnos_ninera').select('*').order('fecha'),
  gastos: () => supabase.from('gastos').select('*').order('created_at', { ascending: false }),
  habitaciones: () => supabase.from('habitaciones').select('*').order('nombre'),
};
