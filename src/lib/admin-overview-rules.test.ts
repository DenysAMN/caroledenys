import { describe, expect, it } from "vitest";
import { buildOverview, filterOverview, percentOf, type OverviewClaim } from "./admin-overview-rules";
import type { Gift } from "./types";
const gift = (id: string, patch: Partial<Gift> = {}): Gift => ({ id, title: id, type:"COTAS", status:"DISPONIVEL", category:"Casa", sort_order:0, image_url:null, description:null, external_url:null, price_cents:null, total_cents:10000, share_cents:1000, total_shares:10, shares_taken:0, min_cents:null, created_at:"2026-01-01", ...patch });
const claim = (gift_id: string, status: string, amount_cents: number | null, name="Ana"): OverviewClaim => ({gift_id,status,amount_cents,shares:1,name});
const filters = { q:"", state:"ALL", type:"ALL", category:"ALL", sort:"CATALOG" };
describe("couple dashboard accounting",()=>{
 it("distinguishes paid, promised, analysis and unpaid amounts",()=>{
  const result=buildOverview([gift("a",{shares_taken:6})],[claim("a","PAGO",2000),claim("a","EM_ANALISE",3000),claim("a","AGUARDANDO_PAGAMENTO",1000)]);
  expect(result.received).toBe(2000);expect(result.reserved).toBe(6000);expect(result.receivedPercent).toBe(20);expect(result.reservedPercent).toBe(60);
  expect(result.missing).toBe(8000);expect(result.unreserved).toBe(4000);expect(result.pixReview).toBe(3000);expect(result.rows[0].available).toBe(4);
 });
 it("never calls fully reserved cotas received before payments are confirmed",()=>{
  const result=buildOverview([gift("a",{status:"CONCLUIDO",shares_taken:10})],[claim("a","EM_ANALISE",10000)]);
  expect(result.completeCount).toBe(0);expect(result.availableCount).toBe(0);expect(result.receivedPercent).toBe(0);expect(result.reservedPercent).toBe(100);
 });
 it("excludes free contributions and hidden gifts from the denominator but retains actual PIX totals",()=>{
  const result=buildOverview([gift("a"),gift("hidden",{status:"OCULTO"}),gift("free",{type:"LIVRE"})],[claim("hidden","PAGO",8000),claim("free","PAGO",5000),claim("a","PAGO",2000)]);
  expect(result.target).toBe(10000);expect(result.pixReceived).toBe(15000);expect(result.received).toBe(2000);expect(result.visibleCount).toBe(2);
 });
 it("counts a LINK gift once and keeps its estimated value out of PIX",()=>{
  const result=buildOverview([gift("link",{type:"LINK",price_cents:9000,status:"CONCLUIDO"})],[claim("link","RECEBIDO",null),claim("link","RECEBIDO",null,"Bruno")]);
  expect(result.received).toBe(9000);expect(result.pixReceived).toBe(0);expect(result.linkReceived).toBe(9000);expect(result.rows[0].names).toEqual(["Ana","Bruno"]);
 });
 it("ignores cancelled and expired promises and protects zero/undefined prices",()=>{
  const result=buildOverview([gift("a"),gift("unknown",{type:"LINK",price_cents:null})],[claim("a","CANCELADO",5000),claim("a","EXPIRADO",4000)]);
  expect(result.reserved).toBe(0);expect(result.reservedCount).toBe(0);expect(result.unknownPriceCount).toBe(1);expect(percentOf(100,0)).toBeNull();expect(percentOf(120,100)).toBe(100);
 });
 it("uses the attainable quota target instead of a different product reference price",()=>{
  const result=buildOverview([gift("a",{total_cents:10500})],[claim("a","PAGO",10000)]);
  expect(result.target).toBe(10000);expect(result.completeCount).toBe(1);
 });
 it("combines search, status, category and type without including hidden gifts accidentally",()=>{
  const result=buildOverview([gift("a"),gift("b",{status:"OCULTO"})],[claim("a","EM_ANALISE",1000,"Álvaro"),claim("b","PAGO",1000)]);
  expect(filterOverview(result.rows,{...filters,q:"álvaro",state:"REVIEW",type:"COTAS",category:"Casa"}).map(r=>r.id)).toEqual(["a"]);
  expect(filterOverview(result.rows,{...filters,state:"HIDDEN"}).map(r=>r.id)).toEqual(["b"]);
  expect(filterOverview(result.rows,{...filters,q:"unknown"})).toEqual([]);
 });
 it("sorts missing value descending and preserves original rows",()=>{
  const result=buildOverview([gift("a"),gift("b")],[claim("a","PAGO",7000)]);
  expect(filterOverview(result.rows,{...filters,sort:"MISSING"}).map(r=>r.id)).toEqual(["b","a"]);
  expect(result.rows.map(r=>r.id)).toEqual(["a","b"]);
 });
});
