import { describe, expect, it } from "vitest";
import { gallerySelection, parsePhotoFields, validOrder, type GalleryPhoto } from "./gallery-rules";
const photo = (id: number, placement: GalleryPhoto["placement"]="GALLERY", published=true): GalleryPhoto => ({ id:`00000000-0000-4000-8000-${String(id).padStart(12,"0")}`,src:`/photo-${id}.jpg`,alt:"Foto do casal",width:100,height:200,orientation:"portrait",caption:"",placement,published,sortOrder:id,storagePath:null });
describe("gallery selection",()=>{
 it("uses the ordered first photos on home and retains the rest in the full album",()=>{
  const selected=gallerySelection({photos:[photo(4),photo(3,"GALLERY",false),photo(2),photo(1)],homeLimit:2,revision:0,ready:true});
  expect(selected.home.map(p=>p.sortOrder)).toEqual([1,2]);expect(selected.gallery.map(p=>p.sortOrder)).toEqual([1,2,4]);
 });
 it("never fills a hidden cover with an old default photo",()=>{
  const selected=gallerySelection({photos:[photo(1,"COVER",false),photo(2,"STORY"),photo(3,"INSPIRATION")],homeLimit:0,revision:0,ready:true});
  expect(selected.cover).toBeNull();expect(selected.story?.sortOrder).toBe(2);expect(selected.inspiration).toHaveLength(1);expect(selected.home).toEqual([]);
 });
 it("rejects arbitrary positions, empty descriptions and duplicate reorder IDs",()=>{
  const form=new FormData();form.set("alt","Foto");form.set("placement","COVER");expect(parsePhotoFields(form)?.published).toBe(false);
  form.set("placement","ADMIN");expect(parsePhotoFields(form)).toBeNull();form.set("placement","GALLERY");form.set("alt"," ");expect(parsePhotoFields(form)).toBeNull();
  expect(validOrder([photo(1).id,photo(1).id])).toBe(false);expect(validOrder(["bad-id"])).toBe(false);
 });
});
