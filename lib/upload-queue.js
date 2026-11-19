// Cola de subida offline: las fotos se guardan en IndexedDB y se suben
// cuando hay señal. Si se corta el wifi a mitad de camino, no se pierde nada.
import { BUCKET, supabase } from './supabase';
import { pathMini } from './image';
import { avisar } from './push';

const DB = 'viaje-fotos';
const STORE = 'pendientes';

function abrir() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function tx(modo, fn) {
  const db = await abrir();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, modo);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => res(req?.result);
    t.onerror = () => rej(t.error);
  });
}

export const encolar = (item) => tx('readwrite', (s) => s.put(item));
export const pendientes = () => tx('readonly', (s) => s.getAll());
const quitar = (id) => tx('readwrite', (s) => s.delete(id));

let procesando = false;

// true si quedó subido (incluye "ya existe": se subió en un intento anterior que se cortó)
async function subir(path, blob, tipo) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: tipo, upsert: false });
  return !error || String(error.statusCode) === '409' || /exist|duplicate/i.test(error.message || '');
}

export async function procesarCola() {
  if (procesando || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
  procesando = true;
  const subieron = new Set();
  try {
    const items = await pendientes();
    for (const it of items) {
      const path = `${it.dia}/${it.id}.${it.ext}`;
      if (!(await subir(path, it.blob, it.tipo))) break; // sin señal o error: reintenta después
      if (it.mini && !(await subir(pathMini(path), it.mini, 'image/jpeg'))) break;

      const { error: e2 } = await supabase.from('fotos').insert({
        id: it.id,
        persona_id: it.persona_id,
        path,
        caption: it.caption,
        dia: it.dia,
        es_video: !!it.es_video,
      });
      if (e2 && e2.code !== '23505') break; // 23505 = ya estaba insertada

      await quitar(it.id);
      if (it.persona_id) subieron.add(it.persona_id);
    }
  } finally {
    procesando = false;
    // Una sola llamada por persona al terminar la tanda (el servidor limita a una notificación por hora)
    for (const p of subieron) avisar('fotos', p);
  }
}
