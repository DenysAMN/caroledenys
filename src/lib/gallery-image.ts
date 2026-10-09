import "server-only";
import sharp from "sharp";

export async function optimizeGalleryImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size < 1 || file.size > 4_000_000) throw new Error("Use JPG, PNG ou WebP de até 4 MB após compressão.");
  const input = Buffer.from(await file.arrayBuffer());
  const image = sharp(input, { limitInputPixels: 50_000_000, animated: false });
  const metadata = await image.metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || !metadata.width || !metadata.height || metadata.width < 100 || metadata.height < 100 || (metadata.pages ?? 1) > 1) throw new Error("Envie uma foto estática com pelo menos 100 pixels de cada lado.");
  // Reorienta pelo EXIF e não inclui metadados/GPS no arquivo público.
  const { data, info } = await image.rotate().resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}
