import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
import { optimizeGalleryImage } from "./gallery-image";
describe("gallery upload processing",()=>{
 it("rotates EXIF orientation and strips metadata from the public image",async()=>{
  const buffer=await sharp({create:{width:100,height:200,channels:3,background:"red"}}).jpeg().withMetadata({orientation:6}).toBuffer();
  const result=await optimizeGalleryImage(new File([new Uint8Array(buffer)],"photo.jpg",{type:"image/jpeg"}));
  const meta=await sharp(result.data).metadata();
  expect([result.width,result.height]).toEqual([200,100]);expect(meta.format).toBe("webp");expect(meta.exif).toBeUndefined();expect(meta.orientation).toBeUndefined();
 });
 it("rejects spoofed SVG uploads and files above the server size limit",async()=>{
  await expect(optimizeGalleryImage(new File(['<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"></svg>'],"fake.jpg",{type:"image/jpeg"}))).rejects.toThrow();
  await expect(optimizeGalleryImage(new File([new Uint8Array(4_000_001)],"large.jpg",{type:"image/jpeg"}))).rejects.toThrow();
 });
});
