import { NextResponse } from 'next/server';
import { esFamilia, supabaseAdmin } from '@/lib/server/familia';
import { mandar, primeraVez } from '@/lib/server/push';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNA_HORA = 60 * 60 * 1000;

// El celular avisa "acabo de cargar X" y el servidor decide a quién notificar.
// Todo se lee de la base: el celular solo manda el id, no el texto ni los destinatarios.
// Cada fila se notifica una sola vez aunque se llame dos veces.
export async function POST(req) {
  if (!esFamilia(req)) return NextResponse.json({ error: 'sin acceso' }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor' }, { status: 500 });

  const { tipo, id, de } = await req.json().catch(() => ({}));
  if (!UUID.test(id || '') || (de && !UUID.test(de))) return NextResponse.json({ error: 'datos inválidos' }, { status: 400 });
  const origen = new URL(req.url).origin;

  const nombre = async (personaId) => {
    if (!personaId) return 'Alguien';
    const { data } = await admin.from('personas').select('nombre').eq('id', personaId).maybeSingle();
    return data?.nombre || 'Alguien';
  };

  let r = { enviados: 0 };

  if (tipo === 'agenda') {
    const { data: a } = await admin.from('agenda').select('*').eq('id', id).maybeSingle();
    if (a && await primeraVez(admin, `agenda:${id}`)) {
      const cuando = new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'numeric' });
      r = await mandar(admin, {
        tipo, excepto: de, origen,
        aviso: {
          titulo: `📅 Nuevo en la agenda: ${a.titulo}`,
          cuerpo: `${cuando}${a.hora ? ` · ${a.hora.slice(0, 5)}` : ''}${a.lugar ? ` · ${a.lugar}` : ''}`,
          url: '/agenda', tag: `agenda:${id}`,
        },
      });
    }
  } else if (tipo === 'ninera') {
    const { data: t } = await admin.from('turnos_ninera').select('*').eq('id', id).maybeSingle();
    if (t && t.cuidan.length && await primeraVez(admin, `ninera:${id}`)) {
      const cuando = new Date(t.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'numeric' });
      r = await mandar(admin, {
        tipo, personas: t.cuidan, excepto: de, origen,
        aviso: {
          titulo: '🍼 Te toca de niñera',
          cuerpo: `${cuando} · ${t.momento}${t.notas ? ` · ${t.notas}` : ''}`,
          url: '/ninera', tag: `ninera:${id}`,
        },
      });
    }
  } else if (tipo === 'gastos') {
    const { data: g } = await admin.from('gastos').select('*').eq('id', id).maybeSingle();
    if (g && await primeraVez(admin, `gastos:${id}`)) {
      const quien = await nombre(g.pagado_por);
      const parte = g.participantes.length ? Number(g.monto) / g.participantes.length : null;
      const fmt = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
      r = await mandar(admin, {
        tipo, personas: g.participantes, excepto: g.pagado_por, origen,
        aviso: {
          titulo: `💸 ${quien} cargó "${g.descripcion}"`,
          cuerpo: `${g.moneda} ${fmt(Number(g.monto))}${parte ? ` · te toca ${g.moneda} ${fmt(parte)}` : ''}`,
          url: '/gastos', tag: `gastos:${id}`,
        },
      });
    }
  } else if (tipo === 'fotos') {
    // `id` = la persona que subió. Como mucho una notificación por hora por persona,
    // contando todas las fotos que subió desde la anterior.
    const clave = `fotos:${id}`;
    const { data: prev } = await admin.from('push_enviados').select('enviado').eq('clave', clave).maybeSingle();
    const ahora = Date.now();
    if (!prev || ahora - new Date(prev.enviado).getTime() >= UNA_HORA) {
      // "Reserva" el turno antes de mandar, para que dos llamadas juntas no manden dos veces
      const desde = prev?.enviado || new Date(ahora - UNA_HORA).toISOString();
      const reserva = prev
        ? await admin.from('push_enviados').update({ enviado: new Date(ahora).toISOString() }).eq('clave', clave).eq('enviado', prev.enviado).select()
        : await admin.from('push_enviados').insert({ clave, enviado: new Date(ahora).toISOString() }).select();
      if (!reserva.error && reserva.data?.length) {
        const { count } = await admin.from('fotos').select('id', { count: 'exact', head: true })
          .eq('persona_id', id).gt('created_at', desde);
        if (count) {
          r = await mandar(admin, {
            tipo, excepto: id, origen,
            aviso: {
              titulo: `📸 ${await nombre(id)} subió ${count === 1 ? 'una foto' : `${count} fotos`}`,
              cuerpo: 'Tocá para verlas en el álbum',
              url: '/fotos', tag: `fotos:${id}`,
            },
          });
        }
      }
    }
  } else {
    return NextResponse.json({ error: 'tipo inválido' }, { status: 400 });
  }

  return NextResponse.json(r);
}
