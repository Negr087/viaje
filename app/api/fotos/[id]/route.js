import { NextResponse } from 'next/server';
import { esFamilia, supabaseAdmin } from '@/lib/server/familia';

const BUCKET = 'viaje-fotos';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Borrar una foto: la familia no puede borrar archivos del bucket directamente
// (así una clave filtrada no puede vaciar el álbum). Pasa por acá, de a una.
export async function DELETE(req, { params }) {
  if (!esFamilia(req)) return NextResponse.json({ error: 'sin acceso' }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 });

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor' }, { status: 500 });
  }

  const { data: foto, error } = await admin.from('fotos').select('id, path').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!foto) return NextResponse.json({ ok: true }); // ya no estaba

  const { error: eArchivo } = await admin.storage.from(BUCKET).remove([foto.path, foto.path.replace(/\.[^./]+$/, '') + '_mini.jpg']);
  if (eArchivo) return NextResponse.json({ error: eArchivo.message }, { status: 500 });

  const { error: eFila } = await admin.from('fotos').delete().eq('id', id);
  if (eFila) return NextResponse.json({ error: eFila.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
