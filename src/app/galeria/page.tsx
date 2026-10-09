import type { Metadata } from "next";
import Link from "next/link";
import WeddingGallery from "@/components/WeddingGallery";
import { getPublicGallery } from "@/lib/gallery";
import { gallerySelection } from "@/lib/gallery-rules";
export const revalidate = 30;
export const metadata: Metadata = { title: "Galeria de fotos", description: "O álbum completo de Carol e Denys, antes do sim." };
export default async function GalleryPage() {
  const { gallery } = gallerySelection(await getPublicGallery());
  return <main className="gallery-page"><header className="container gallery-page-head"><Link className="back-link" href="/#galeria">← Voltar à página principal</Link><p className="eyebrow">Todos os momentos</p><h1>Nossa galeria completa</h1><p>{gallery.length} foto(s). Toque em uma imagem para abri-la em tamanho maior.</p></header><WeddingGallery photos={gallery} /></main>;
}
