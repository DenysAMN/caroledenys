import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
let db:PGlite;
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
async function snapshot(){return (await db.query<{snapshot:{photos:{id:string;placement:string;published:boolean;src:string}[];revision:number;home_limit:number}}>("select admin_gallery_snapshot() as snapshot")).rows[0].snapshot;}
async function mutate(action:string,payload:Record<string,unknown>,revision?:number){return db.query("select admin_mutate_gallery($1,$2::jsonb,$3)",[action,JSON.stringify(payload),revision??(await snapshot()).revision]);}
beforeAll(async()=>{
 db=new PGlite();await db.exec("create role anon;create role authenticated;create role service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);");
 await db.exec(await readFile(join(process.cwd(),"supabase/migrations/20261009000000_photo_gallery.sql"),"utf8"));
},30000);
afterAll(async()=>{await db?.close();});
describe("isolated PostgreSQL gallery administration",()=>{
 it("seeds all existing photos and starts with six home previews",async()=>{const s=await snapshot();expect(s.photos).toHaveLength(17);expect(s.home_limit).toBe(6);expect(s.photos.filter(p=>p.placement==="GALLERY")).toHaveLength(10);});
 it("swaps a cover atomically, returning the previous cover to the album",async()=>{
  await mutate("SAVE",{id:id(4),alt:"Nova capa",placement:"COVER",published:true});const s=await snapshot();
  expect(s.photos.find(p=>p.id===id(4))?.placement).toBe("COVER");expect(s.photos.find(p=>p.id===id(1))?.placement).toBe("GALLERY");expect(s.photos.filter(p=>p.placement==="COVER")).toHaveLength(1);
 });
 it("reorders the entire set without losing or duplicating photos",async()=>{
  const s=await snapshot();const ids=s.photos.map(p=>p.id).reverse();await mutate("ORDER",{ids},s.revision);
  expect((await snapshot()).photos.map(p=>p.id)).toEqual(ids);
  await expect(mutate("ORDER",{ids:ids.slice(1)})).rejects.toThrow("GALERIA_ALTERADA");
  await expect(mutate("ORDER",{ids:[ids[0],...ids.slice(0,-1)]})).rejects.toThrow("GALERIA_ALTERADA");
 });
 it("rejects stale edits from a second session",async()=>{const s=await snapshot();await mutate("SETTINGS",{home_limit:3},s.revision);await expect(mutate("SETTINGS",{home_limit:9},s.revision)).rejects.toThrow("GALERIA_ALTERADA");expect((await snapshot()).home_limit).toBe(3);});
 it("hides a photo from public reads but retains it for the administrator",async()=>{
  await mutate("SAVE",{id:id(5),alt:"Oculta",placement:"GALLERY",published:false});
  await db.exec("set role anon");try{const s=(await db.query<{s:{photos:{id:string}[]}}>("select public_gallery_snapshot() as s")).rows[0].s;expect(s.photos.some(p=>p.id===id(5))).toBe(false);}finally{await db.exec("reset role");}
  expect((await snapshot()).photos.some(p=>p.id===id(5))).toBe(true);
 });
 it("returns the old storage path when replacing or deleting an uploaded photo",async()=>{
  const payload={id:id(50),alt:"Enviada",placement:"GALLERY",published:true,src:"https://example.com/photo.webp",storage_path:"50/old.webp",width:200,height:300};
  await mutate("SAVE",payload);const result=await mutate("DELETE",{id:id(50)});
  expect((result.rows[0] as {admin_mutate_gallery:{removed_path:string}}).admin_mutate_gallery.removed_path).toBe("50/old.webp");expect((await snapshot()).photos.some(p=>p.id===id(50))).toBe(false);
 });
 it("disallows public mutations and admin snapshots",async()=>{
  for(const role of ["anon","authenticated"]){await db.exec(`set role ${role}`);try{
   await expect(db.query("select admin_gallery_snapshot()")).rejects.toThrow("permission denied");
   await expect(db.query("select admin_mutate_gallery('SETTINGS','{\"home_limit\":4}',0)")).rejects.toThrow("permission denied");
   await expect(db.query("update gallery_photos set published=true")).rejects.toThrow("permission denied");
  }finally{await db.exec("reset role");}}
 });
});
