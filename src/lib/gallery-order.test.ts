import { describe, expect, it } from "vitest";
import { moveGalleryPhoto } from "./gallery-order";
import type { GalleryPhoto } from "./gallery-rules";

const photos = ["a", "cover", "b", "story", "c", "d"].map(id => ({ id } as GalleryPhoto));
describe("visual gallery reorder", () => {
  it("inserts at the target and shifts intermediate photos instead of swapping", () => {
    expect(moveGalleryPhoto(photos, ["a", "b", "c", "d"], "a", "d").map(p => p.id)).toEqual(["b", "cover", "c", "story", "d", "a"]);
  });
  it("moves backwards without moving photos from other spaces", () => {
    expect(moveGalleryPhoto(photos, ["a", "b", "c", "d"], "c", "a").map(p => p.id)).toEqual(["c", "cover", "a", "story", "b", "d"]);
  });
  it("retains every photo when reordering all spaces", () => {
    const moved = moveGalleryPhoto(photos, photos.map(p => p.id), "cover", "d");
    expect(moved.map(p => p.id)).toEqual(["a", "b", "story", "c", "d", "cover"]);
    expect(new Set(moved.map(p => p.id)).size).toBe(photos.length);
  });
  it("ignores cancelled, unchanged or foreign destinations", () => {
    expect(moveGalleryPhoto(photos, ["a", "b"], "a", "a")).toBe(photos);
    expect(moveGalleryPhoto(photos, ["a", "b"], "a", "story")).toBe(photos);
    expect(moveGalleryPhoto(photos, ["a", "b"], "missing", "a")).toBe(photos);
  });
});
