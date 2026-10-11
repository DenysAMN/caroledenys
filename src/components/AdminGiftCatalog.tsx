"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatBRLShort } from "@/lib/format";
import { ADMIN_GIFT_FILTERS, adminGiftMatches, adminGiftReceived, filterAdminCatalog, giftAvailable, type AdminCatalogGift, type AdminGiftFilter } from "@/lib/gift-filters";

export default function AdminGiftCatalog({ gifts }: { gifts: AdminCatalogGift[] }) {
  const [filter,setFilter] = useState<AdminGiftFilter>("ALL");
  const [q,setQ] = useState("");
  const [type,setType] = useState("ALL");
  const [category,setCategory] = useState("ALL");
  const categories = [...new Set(gifts.map(gift => gift.category ?? "Sem categoria"))].sort((a,b) => a.localeCompare(b,"pt-BR"));
  const rows = filterAdminCatalog(gifts,filter,q,type,category);
  const reset = () => { setFilter("ALL");setQ("");setType("ALL");setCategory("ALL"); };
  return <>
    <section className="admin-catalog-toolbar" aria-label="Filtrar presentes">
      <div className="admin-catalog-chips" role="group" aria-label="Situação dos presentes">{ADMIN_GIFT_FILTERS.map(([value,label]) => <button type="button" key={value} className={`admin-catalog-chip${filter === value ? " is-active" : ""}`} aria-pressed={filter === value} onClick={()=>setFilter(value)}>{label}<span>{gifts.filter(gift=>adminGiftMatches(gift,value)).length}</span></button>)}</div>
      <label className="admin-catalog-search"><span>Buscar presente ou quem reservou</span><input type="search" value={q} onChange={event=>setQ(event.target.value)} placeholder="Digite um nome…" maxLength={200} /></label>
      <details className="admin-catalog-extra"><summary>Tipo e categoria</summary><div>
        <label>Tipo<select value={type} onChange={event=>setType(event.target.value)}><option value="ALL">Todos os tipos</option><option value="LINK">Loja</option><option value="COTAS">Cotas</option><option value="LIVRE">Valor livre</option></select></label>
        <label>Categoria<select value={category} onChange={event=>setCategory(event.target.value)}><option value="ALL">Todas as categorias</option>{categories.map(value=><option key={value}>{value}</option>)}</select></label>
      </div></details>
      <div className="admin-catalog-result" aria-live="polite"><span>{rows.length} de {gifts.length} presente(s)</span>{(filter !== "ALL" || q || type !== "ALL" || category !== "ALL") && <button type="button" onClick={reset}>Limpar filtros</button>}</div>
      {filter === "AVAILABLE" && <p className="admin-catalog-tip">Ainda podem ser reservados. Presentes com cotas parciais também aparecem aqui.</p>}
      {filter === "RESERVED" && <p className="admin-catalog-tip">Há reserva ou cotas comprometidas; ainda existe algo a receber.</p>}
    </section>
    <div className="admin-gift-list admin-catalog-list">{rows.map(gift => {
      const received = adminGiftReceived(gift);
      const available = giftAvailable(gift);
      const label = gift.status === "OCULTO" ? "Oculto" : received ? gift.type === "LIVRE" ? "Contribuição recebida" : "Recebido" : gift.hasReservations || gift.status === "RESERVADO" || gift.type === "COTAS" && gift.shares_taken > 0 ? gift.type === "COTAS" && available ? "Reserva parcial" : "Reservado" : "Disponível";
      return <Link href={`/admin/presentes/${gift.id}`} className="admin-gift-row" key={gift.id}>
        <div className="admin-gift-miniature">{gift.image_url ? <Image src={gift.image_url} alt="" fill sizes="76px" /> : <span>C&amp;D</span>}</div>
        <div className="admin-gift-name"><small>{gift.type === "LINK" ? "Loja" : gift.type === "COTAS" ? "Cotas" : "Valor livre"} · {gift.category ?? "Sem categoria"}</small><strong>{gift.title}</strong>
          <span className={`admin-catalog-status${received ? " is-received" : available ? " is-available" : ""}`}>{label}</span>
          {gift.type === "COTAS" && <small>{gift.shares_taken}/{gift.total_shares ?? 0} cotas comprometidas · {Math.max(0,(gift.total_shares ?? 0)-gift.shares_taken)} disponíveis · {gift.paidShares} pagas</small>}
          {gift.reservedBy.length > 0 && <small>Reservado por: {gift.reservedBy.join(", ")}</small>}
        </div>
        <span className="admin-catalog-price">{gift.type === "LINK" ? gift.price_cents ? formatBRLShort(gift.price_cents) : "Sem preço" : gift.type === "LIVRE" ? `A partir de ${formatBRLShort(gift.min_cents ?? 2000)}` : `${Math.max(0,(gift.total_shares ?? 0)-gift.shares_taken)} cotas restantes`}</span>
        <span className="admin-gift-edit">Abrir →</span>
      </Link>;
    })}</div>
    {!rows.length && <div className="admin-empty"><h2>Nenhum presente nesta seleção</h2><p>Tente outro botão ou limpe a busca.</p><button className="btn btn-ghost" type="button" onClick={reset}>Mostrar todos</button></div>}
  </>;
}
