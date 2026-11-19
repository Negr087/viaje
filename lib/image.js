// Achica las fotos antes de subirlas: el wifi del resort suele ser lento y el
// plan gratis de Supabase tiene poco espacio y poca transferencia.
// - foto: 1920px de lado mayor (~500 KB). Se ve perfecta en el celu y alcanza para un fotolibro.
// - mini: 480px (~40 KB). Es la que se muestra en la grilla del álbum.
const FOTO = { max: 1920, calidad: 0.82 };
const MINI = { max: 480, calidad: 0.7 };

function achicar(bmp, { max, calidad }) {
  const escala = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * escala);
  canvas.height = Math.round(bmp.height * escala);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((r) => canvas.toBlob(r, 'image/jpeg', calidad));
}

// Devuelve { foto, mini }. mini es null si el navegador no sabe leer el formato
// (ej: algunos HEIC): en ese caso la foto se sube tal cual y el álbum usa la original.
export async function prepararFoto(file) {
  if (file.type === 'image/gif') return { foto: file, mini: null };
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const [grande, mini] = await Promise.all([achicar(bmp, FOTO), achicar(bmp, MINI)]);
    bmp.close?.();
    const foto = grande && grande.size < file.size ? grande : file;
    return { foto, mini };
  } catch {
    return { foto: file, mini: null };
  }
}

// La miniatura vive al lado de la foto: 2027-03-31/<id>.jpg → 2027-03-31/<id>_mini.jpg
export function pathMini(path) {
  return path.replace(/\.[^./]+$/, '') + '_mini.jpg';
}
