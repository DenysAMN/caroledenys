import type { Metadata } from "next";
import MyGifts from "@/components/MyGifts";

export const metadata: Metadata = {
  title: "Meus presentes · Carol & Denys",
  description: "Acompanhe os presentes que você reservou para Carol e Denys.",
};

export default function MeusPresentesPage() {
  return (
    <main className="my-gifts-page">
      <div className="container">
        <div className="my-gifts-envelope" aria-hidden="true">
          <span>Para você</span>
          <i />
        </div>
        <MyGifts />
      </div>
    </main>
  );
}
