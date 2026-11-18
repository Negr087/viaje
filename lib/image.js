// Achica las fotos antes de subirlas: el wifi del resort suele ser lento.
// 2400px de lado mayor alcanza de sobra para pantalla e incluso para imprimir un fotolibro.
export async function comprimir(file, max = 2400, calidad = 0.85) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const escala = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * escala);
    const h = Math.round(bmp.height * escala);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', calidad));
    if (!blob || blob.size > file.size) return file;
    return blob;
  } catch {
    // Formatos que el navegador no sabe decodificar (ej: algunos HEIC) se suben tal cual
    return file;
  }
}
