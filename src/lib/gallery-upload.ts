// Compressão no celular antes do envio; cada foto vai em uma requisição própria.
export async function compressGalleryUpload(file: File): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 20_000_000) throw new Error("Escolha JPG, PNG ou WebP de até 20 MB. Para HEIC, exporte a foto como JPG.");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width < 100 || bitmap.height < 100 || bitmap.width * bitmap.height > 50_000_000) throw new Error("A foto deve ter pelo menos 100 pixels de cada lado e até 50 megapixels.");
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d"); if (!context) throw new Error("Não foi possível preparar esta foto.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Não foi possível comprimir esta foto.")), "image/webp", .82));
    if (blob.size > 4_000_000) throw new Error("A foto continua acima de 4 MB. Envie uma versão menor.");
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: blob.type });
  } finally { bitmap.close(); }
}
