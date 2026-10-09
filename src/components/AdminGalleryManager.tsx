"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteGalleryPhoto, reorderGalleryPhotos, saveGalleryPhoto, setGalleryHomeLimit, type GalleryResult } from "@/app/admin/actions/gallery";
import { GALLERY_PLACEMENTS, PLACEMENT_LABELS, type GalleryPhoto, type GallerySnapshot } from "@/lib/gallery-rules";
import AdminGalleryBoard from "./AdminGalleryBoard";
import { compressGalleryUpload } from "@/lib/gallery-upload";

function PhotoFields({ photo }: { photo?: GalleryPhoto }) {
  return <div className="admin-form-grid">
    <label className="field"><span>Descrição da foto</span><input name="alt" minLength={2} maxLength={240} defaultValue={photo?.alt ?? "Foto de Carol e Denys"} required /></label>
    <label className="field"><span>Legenda (opcional)</span><input name="caption" maxLength={240} defaultValue={photo?.caption ?? ""} /></label>
    <label className="field"><span>Onde aparece</span><select name="placement" defaultValue={photo?.placement ?? "GALLERY"}>{GALLERY_PLACEMENTS.map(value => <option key={value} value={value}>{PLACEMENT_LABELS[value]}</option>)}</select></label>
    <label className="admin-photo-check"><input name="published" type="checkbox" defaultChecked={photo?.published ?? true} /> Publicar no site</label>
  </div>;
}
export default function AdminGalleryManager({ snapshot }: { snapshot: GallerySnapshot }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placementFilter, setPlacementFilter] = useState("ALL");
  const editorRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (selectedId) {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      editorRef.current?.focus({ preventScroll: true });
    }
  }, [selectedId]);
  const photos = [...snapshot.photos].sort((a,b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const selected = photos.find(photo => photo.id === selectedId);
  const disabled = pending || !snapshot.ready;
  function run(task: () => Promise<GalleryResult>) {
    startTransition(async () => {
      try { const result = await task(); setMessage(result.message); if (result.ok) router.refresh(); }
      catch { setMessage("Não foi possível concluir. Atualize a página e tente novamente."); }
    });
  }
  function persist(task: () => Promise<GalleryResult>): Promise<boolean> {
    return new Promise(resolve => {
      startTransition(async () => {
        try {
          const result = await task();
          setMessage(result.message);
          if (result.ok) router.refresh();
          resolve(result.ok);
        } catch {
          setMessage("Não foi possível salvar a posição. A ordem anterior foi mantida.");
          resolve(false);
        }
      });
    });
  }
  return <>
    <section className="admin-form-sheet">
      <h2>Fotos na página principal</h2>
      <p>As primeiras fotos publicadas em “Galeria de fotos” aparecem na home, na ordem abaixo. Todas aparecem na galeria completa. Fotos de capa, história, transição e inspiração têm seus próprios espaços.</p>
      <form className="admin-filters" key={`limit-${snapshot.revision}`} onSubmit={event => {
        event.preventDefault(); const form = new FormData(event.currentTarget); run(() => setGalleryHomeLimit(Number(form.get("home_limit")), snapshot.revision));
      }}>
        <label>Quantidade na home<input name="home_limit" type="number" min={0} max={12} step={1} defaultValue={snapshot.homeLimit} required disabled={disabled} /></label>
        <button className="btn" disabled={disabled}>Salvar quantidade</button>
        <Link className="text-link" href="/galeria" target="_blank">Ver galeria completa ↗</Link>
      </form>
    </section>
    <div className="admin-gallery-feedback" aria-live="polite">{progress || message}</div>
    <AdminGalleryBoard key={snapshot.revision} photos={photos} homeLimit={snapshot.homeLimit} disabled={disabled} selectedId={selectedId} onSelect={setSelectedId} filter={placementFilter} onFilter={setPlacementFilter}
      onReorder={ids => persist(() => reorderGalleryPhotos(ids, snapshot.revision))}
      onPlacement={(photo, placement) => {
        const form = new FormData(); form.set("alt", photo.alt); form.set("caption", photo.caption); form.set("placement", placement);
        if (photo.published) form.set("published", "on");
        return persist(() => saveGalleryPhoto(photo.id, form, snapshot.revision));
      }} />
    <details className="admin-form-sheet admin-gallery-add">
      <summary>Adicionar novas fotos</summary>
      <form className="admin-gallery-upload" onSubmit={event => {
        event.preventDefault(); const formElement = event.currentTarget; const fields = new FormData(formElement);
        const files = fields.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
        if (!files.length) { setMessage("Selecione pelo menos uma foto."); return; }
        if (files.length > 20) { setMessage("Envie até 20 fotos por vez."); return; }
        if (files.length > 1 && ["COVER","STORY","TRANSITION"].includes(String(fields.get("placement")))) { setMessage("Escolha uma única foto para este destaque, ou use Galeria de fotos para enviar várias."); return; }
        startTransition(async () => {
          let revision = snapshot.revision; let uploaded = 0;
          try {
            for (const file of files) {
              setProgress(`Enviando foto ${uploaded + 1} de ${files.length}…`);
              const payload = new FormData(); for (const key of ["alt","caption","placement","published"]) { const value=fields.get(key); if (typeof value === "string") payload.set(key,value); }
              payload.set("image", await compressGalleryUpload(file));
              const result = await saveGalleryPhoto(null,payload,revision);
              if (!result.ok) throw new Error(result.message);
              revision=result.revision!; uploaded++;
            }
            setMessage(`${uploaded} foto(s) adicionada(s).`); formElement.reset();
          } catch(error) {
            if(uploaded > 0) { const input=formElement.elements.namedItem("images"); if(input instanceof HTMLInputElement) input.value=""; }
            setMessage(`${uploaded} foto(s) adicionada(s). ${error instanceof Error ? error.message : "O envio foi interrompido."}${uploaded > 0 ? " Envie novamente apenas as fotos restantes." : " Tente novamente."}`);
          }
          finally { setProgress(""); router.refresh(); }
        });
      }}>
        <PhotoFields />
        <label className="field"><span>Escolher fotos do celular ou computador</span><input name="images" type="file" multiple accept="image/jpeg,image/png,image/webp" required disabled={disabled} /><small>Até 20 fotos por envio · JPG, PNG ou WebP de até 20 MB cada. A compressão acontece antes do envio. Para HEIC, exporte como JPG.</small></label>
        <button className="btn" disabled={disabled}>{pending ? "Processando…" : "Enviar fotos"}</button>
      </form>
    </details>
    <section ref={editorRef} tabIndex={-1} className="admin-gallery-list" aria-label="Editar foto selecionada">
      {selected ? [selected].map(photo => <article className="admin-gallery-card" key={`${photo.id}-${snapshot.revision}`}>
        <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width:700px) 100vw, 220px" className="admin-gallery-thumb" />
        <div><h2>{photo.alt}</h2><p>{PLACEMENT_LABELS[photo.placement]} · {photo.published ? "Publicada" : "Oculta"}</p>{photo.caption && <p>{photo.caption}</p>}
          <div className="admin-inline-actions">
            <button className="btn btn-ghost" type="button" disabled={disabled} onClick={() => { const form = new FormData();form.set("alt",photo.alt);form.set("caption",photo.caption);form.set("placement",photo.placement);if(!photo.published)form.set("published","on");run(()=>saveGalleryPhoto(photo.id,form,snapshot.revision)); }}>{photo.published ? "Ocultar" : "Publicar"}</button>
            <button className="btn admin-btn-danger" type="button" disabled={disabled} onClick={() => { if(window.confirm("Excluir esta foto do site? Se ela estiver em um destaque, esse espaço ficará sem foto até você escolher outra."))run(()=>deleteGalleryPhoto(photo.id,snapshot.revision)); }}>Excluir</button>
          </div>
          <div className="admin-gallery-edit">
            <form onSubmit={event => {
              event.preventDefault();const form=new FormData(event.currentTarget);
              run(async()=>{const file=form.get("image");if(file instanceof File && file.size>0)form.set("image",await compressGalleryUpload(file));return saveGalleryPhoto(photo.id,form,snapshot.revision);});
            }}><PhotoFields photo={photo} /><label className="field"><span>Substituir por outra foto (opcional)</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} /></label><button className="btn" disabled={disabled}>Salvar foto</button></form>
          </div>
        </div>
      </article>) : <p>Toque em “Editar foto” numa miniatura para alterar legenda, descrição, publicação ou arquivo.</p>}
    </section>
  </>;
}
