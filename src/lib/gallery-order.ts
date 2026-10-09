import type { GalleryPhoto } from "./gallery-rules";

// Move within the visible group, keeping all other groups in their original slots.
export function moveGalleryPhoto(photos: GalleryPhoto[], visibleIds: string[], activeId: string, overId: string): GalleryPhoto[] {
  const from = visibleIds.indexOf(activeId);
  const to = visibleIds.indexOf(overId);
  if (from < 0 || to < 0 || from === to) return photos;
  const ids = [...visibleIds];
  ids.splice(to, 0, ids.splice(from, 1)[0]);
  const byId = new Map(photos.map(photo => [photo.id, photo]));
  const visible = new Set(visibleIds);
  let index = 0;
  return photos.map(photo => visible.has(photo.id) ? byId.get(ids[index++])! : photo);
}
