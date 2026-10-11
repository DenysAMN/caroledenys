"use client";
import { useState } from "react";
import type { Gift } from "@/lib/types";
import GiftCard from "@/components/GiftCard";
import { giftAvailable, giftHasReservation, giftSearch } from "@/lib/gift-filters";
export default function GiftList({ gifts }: { gifts: Gift[] }) {
  const [filter,setFilter] = useState("all");
  const [category,setCategory] = useState("all");
  const [q,setQ] = useState("");
  const publicGifts = gifts.filter(gift=>gift.status !== "OCULTO");
  const categories = [...new Set(publicGifts.map(gift=>gift.category).filter((value): value is string=>Boolean(value)))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  const matches = (gift: Gift,value: string) => value === "all" || (value === "available" ? giftAvailable(gift) : giftHasReservation(gift));
  const shown = publicGifts.filter(gift=>matches(gift,filter) && (category === "all" || gift.category === category) && giftSearch(gift.title).includes(giftSearch(q.trim())));
  const reset = () => { setFilter("all");setCategory("all");setQ(""); };
  return <>
    <section className="gift-list-tools" aria-label="Encontrar presentes">
      <div className="chips" role="group" aria-label="Situação dos presentes">{[["all","Todos"],["available","Disponíveis"],["reserved","Reservados"]].map(([value,label])=><button type="button" key={value} className={`chip${filter === value ? " active" : ""}`} aria-pressed={filter === value} onClick={()=>setFilter(value)}>{label} <span>({publicGifts.filter(gift=>matches(gift,value)).length})</span></button>)}</div>
      <div className="gift-list-search"><label>Buscar presente<input type="search" value={q} onChange={event=>setQ(event.target.value)} placeholder="Nome do presente" maxLength={200} /></label><label>Categoria<select value={category} onChange={event=>setCategory(event.target.value)}><option value="all">Todas</option>{categories.map(value=><option key={value}>{value}</option>)}</select></label></div>
      <p className="gift-list-results" aria-live="polite">{shown.length} presente(s){(q || category !== "all" || filter !== "all") && <button type="button" onClick={reset}>Limpar filtros</button>}</p>
    </section>
    <div className="gift-grid">{shown.map(gift=><GiftCard key={gift.id} gift={gift} />)}</div>
    {!shown.length && <div className="gift-list-empty"><h3>Nenhum presente nesta seleção</h3><p>Tente outra categoria, mude a busca ou veja a lista completa.</p><button type="button" className="btn btn-ghost" onClick={reset}>Ver todos os presentes</button></div>}
  </>;
}
