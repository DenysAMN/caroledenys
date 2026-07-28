"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import {
  criarPresente,
  editarPresente,
  type GiftActionState,
} from "@/app/admin/actions/gifts";
import { centsForInput } from "@/lib/gift-validation";
import type { Gift, GiftType } from "@/lib/types";

const initialState: GiftActionState = { error: null };

export default function AdminGiftForm({ gift }: { gift?: Gift }) {
  const [type, setType] = useState<GiftType>(gift?.type ?? "LINK");
  const action = gift ? editarPresente.bind(null, gift.id) : criarPresente;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="admin-gift-form">
      <section className="admin-form-sheet">
        <div className="admin-form-heading">
          <span>01</span>
          <div><p className="eyebrow">Identificação</p><h2>O presente</h2></div>
        </div>
        <div className="admin-form-grid">
          <label className="field admin-span-2">
            <span>Título</span>
            <input name="title" defaultValue={gift?.title ?? ""} required maxLength={120} />
          </label>
          <label className="field admin-span-2">
            <span>Descrição</span>
            <textarea name="description" defaultValue={gift?.description ?? ""} rows={4} maxLength={1000} />
          </label>
          <label className="field">
            <span>Categoria</span>
            <input name="category" defaultValue={gift?.category ?? ""} maxLength={60} placeholder="Casa, Cozinha…" />
          </label>
          <label className="field">
            <span>Ordem</span>
            <input name="sort_order" type="number" step="1" defaultValue={gift?.sort_order ?? 0} required />
          </label>
        </div>
      </section>

      <section className="admin-form-sheet">
        <div className="admin-form-heading">
          <span>02</span>
          <div><p className="eyebrow">Modelo</p><h2>Como presentear</h2></div>
        </div>
        <div className="admin-form-grid">
          <label className="field">
            <span>Tipo</span>
            <select name="type" value={type} onChange={(event) => setType(event.target.value as GiftType)}>
              <option value="LINK">Link de loja</option>
              <option value="COTAS">Dividido em cotas</option>
              <option value="LIVRE">Contribuição livre</option>
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue={gift?.status ?? "DISPONIVEL"}>
              <option value="DISPONIVEL">Disponível</option>
              <option value="RESERVADO">Reservado</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="OCULTO">Oculto</option>
            </select>
          </label>

          {type === "LINK" && (
            <>
              <label className="field admin-span-2">
                <span>Link da loja</span>
                <input name="external_url" type="url" defaultValue={gift?.external_url ?? ""} placeholder="https://…" required />
              </label>
              <label className="field">
                <span>Preço de referência (R$)</span>
                <input name="price_reais" inputMode="decimal" defaultValue={centsForInput(gift?.price_cents ?? null)} placeholder="450,00" required />
              </label>
            </>
          )}

          {type === "COTAS" && (
            <>
              <label className="field">
                <span>Valor de cada cota (R$)</span>
                <input name="share_reais" inputMode="decimal" defaultValue={centsForInput(gift?.share_cents ?? null)} placeholder="120,00" required />
              </label>
              <label className="field">
                <span>Quantidade total de cotas</span>
                <input name="total_shares" type="number" min="1" max="1000" step="1" defaultValue={gift?.total_shares ?? 20} required />
              </label>
              {gift && <p className="admin-form-note admin-span-2">Cotas já reservadas: {gift.shares_taken}. O banco impedirá um total menor que esse número.</p>}
            </>
          )}

          {type === "LIVRE" && (
            <label className="field">
              <span>Contribuição mínima (R$)</span>
              <input name="min_reais" inputMode="decimal" defaultValue={centsForInput(gift?.min_cents ?? 2000)} placeholder="20,00" required />
            </label>
          )}
        </div>
      </section>

      <section className="admin-form-sheet">
        <div className="admin-form-heading">
          <span>03</span>
          <div><p className="eyebrow">Imagem</p><h2>A fotografia</h2></div>
        </div>
        <div className="admin-image-field">
          {gift?.image_url && (
            <Image src={gift.image_url} alt="Imagem atual" width={220} height={165} className="admin-current-image" />
          )}
          <label className="field">
            <span>{gift?.image_url ? "Substituir imagem" : "Enviar imagem"}</span>
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp" />
            <small>JPG, PNG ou WebP · máximo 4 MB</small>
          </label>
        </div>
      </section>

      {state.error && <p className="field-error" role="alert">{state.error}</p>}
      <div className="admin-form-submit">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Salvando…" : gift ? "Salvar alterações" : "Criar presente"}
        </button>
      </div>
    </form>
  );
}
