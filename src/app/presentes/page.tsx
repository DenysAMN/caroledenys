import type { Metadata } from "next";
import GiftList from "@/components/GiftList";
import { getGifts } from "@/lib/gifts";
import { supabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Lista de presentes",
};

// Revalida a cada 30s: contadores de cota mudam quando alguém reserva.
export const revalidate = 30;

export default async function PresentesPage() {
  const gifts = await getGifts();

  return (
    <main className="section">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Presentear</p>
          <h2>Lista de presentes</h2>
          <p>
            Alguns presentes dividimos em cotas — você escolhe quantas quer dar e paga
            por PIX. Quando todas são preenchidas, ele é nosso. 💝
          </p>
        </div>

        {gifts.length > 0 ? (
          <GiftList gifts={gifts} />
        ) : (
          <p style={{ textAlign: "center", color: "var(--muted)" }}>
            {supabaseConfigured
              ? "Ainda não há presentes cadastrados."
              : "Lista sendo preparada — volte em breve. 💛"}
          </p>
        )}
      </div>
    </main>
  );
}
