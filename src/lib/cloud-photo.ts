import type { ExportBundle } from "./storage";

export type InlinePhoto = ExportBundle["assets"][number];
export const MAX_PHOTO_DATA_URL = 220_000;
export const MAX_CLOUD_DOCUMENT = 900_000;

export function readInlinePhoto(value: unknown, photoId: string): InlinePhoto {
  const photo = value as Partial<InlinePhoto> | null;
  if (!photo || photo.id !== photoId || photo.type !== "photo" || typeof photo.dataUrl !== "string"
    || photo.dataUrl.length > MAX_PHOTO_DATA_URL
    || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.dataUrl)
    || !["image/png", "image/jpeg", "image/webp"].includes(photo.mime ?? "")
    || !photo.dataUrl.startsWith(`data:${photo.mime};base64,`)
    || typeof photo.createdAt !== "number" || !Number.isFinite(photo.createdAt)) {
    throw new Error("La photo sauvegardée est absente ou invalide. Le CV local a été conservé.");
  }
  return photo as InlinePhoto;
}

/** Only the cloud copy is resized. The original stays in this browser's assets. */
export async function prepareCloudPhoto(photo: InlinePhoto): Promise<InlinePhoto> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Impossible de préparer la photo. Choisis une image PNG, JPEG ou WebP valide."));
    image.src = photo.dataUrl;
  });
  if (!image.naturalWidth || !image.naturalHeight) throw new Error("Les dimensions de la photo sont invalides.");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("La préparation de la photo est indisponible dans ce navigateur.");
  for (const maxSide of [640, 480, 320]) {
    const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.88, 0.74, 0.6]) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= MAX_PHOTO_DATA_URL) {
        return readInlinePhoto({ ...photo, type: "photo", mime: "image/jpeg", dataUrl }, photo.id);
      }
    }
  }
  throw new Error("Cette photo reste trop volumineuse pour la sauvegarde. Choisis une image plus petite.");
}

export function assertCloudDocumentSize(data: unknown) {
  // Leave space below Firestore's 1 MiB limit for document names and field overhead.
  if (new TextEncoder().encode(JSON.stringify(data)).length > MAX_CLOUD_DOCUMENT) {
    throw new Error("Le CV et sa photo dépassent la taille de sauvegarde autorisée. Exporte une copie et réduis le contenu ou la photo avant de réessayer.");
  }
}
