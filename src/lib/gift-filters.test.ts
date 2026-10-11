import { describe, expect, it } from "vitest";
import { adminGiftMatches, adminGiftReceived, filterAdminCatalog, giftAvailable, giftHasReservation, type AdminCatalogGift } from "./gift-filters";
const gift = (patch: Partial<AdminCatalogGift> = {}): AdminCatalogGift => ({id:"a", title:"Panela de pressão",image_url:null,type:"LINK",status:"DISPONIVEL",category:"Cozinha",sort_order:0,price_cents:10000,min_cents:null,shares_taken:0,total_shares:null,reservedBy:[],paidShares:0,hasReceived:false,hasReservations:false,hasPending:false,...patch});
describe("quick gift filters",()=>{
 it("excludes already reserved store gifts from available gifts",()=>{
  expect(giftAvailable(gift())).toBe(true);expect(giftAvailable(gift({status:"RESERVADO"}))).toBe(false);expect(giftHasReservation(gift({status:"RESERVADO"}))).toBe(true);
 });
 it("keeps partial quota gifts available and reserved",()=>{
  const item=gift({type:"COTAS",shares_taken:3,total_shares:10,hasReservations:true,hasPending:true});
  expect(adminGiftMatches(item,"AVAILABLE")).toBe(true);expect(adminGiftMatches(item,"RESERVED")).toBe(true);
 });
 it("never treats fully booked unpaid quotas as received",()=>{
  const item=gift({type:"COTAS",status:"CONCLUIDO",shares_taken:10,total_shares:10,hasReservations:true,hasPending:true});
  expect(adminGiftMatches(item,"AVAILABLE")).toBe(false);expect(adminGiftMatches(item,"RESERVED")).toBe(true);expect(adminGiftReceived(item)).toBe(false);
  expect(adminGiftReceived({...item,paidShares:10,hasPending:false})).toBe(true);
 });
 it("separates received links from outstanding reservations",()=>{
  const item=gift({status:"CONCLUIDO",hasReservations:true,hasReceived:true});
  expect(adminGiftMatches(item,"RECEIVED")).toBe(true);expect(adminGiftMatches(item,"RESERVED")).toBe(false);
 });
 it("keeps free contributions open after a confirmed payment",()=>{
  const item=gift({type:"LIVRE",hasReceived:true,hasReservations:true});
  expect(adminGiftMatches(item,"AVAILABLE")).toBe(true);expect(adminGiftMatches(item,"RECEIVED")).toBe(true);
 });
 it("shows hidden gifts only under all or hidden filters",()=>{
  const item=gift({status:"OCULTO",hasPending:true,hasReceived:true});
  expect(adminGiftMatches(item,"ALL")).toBe(true);expect(adminGiftMatches(item,"HIDDEN")).toBe(true);
  expect(adminGiftMatches(item,"RESERVED")).toBe(false);expect(adminGiftMatches(item,"RECEIVED")).toBe(false);expect(giftAvailable(item)).toBe(false);
 });
 it("combines instant filters and accent-insensitive guest/title search",()=>{
  const items=[gift({reservedBy:["Álvaro"],status:"RESERVADO",hasPending:true}),gift({id:"b",title:"Lua de mel",type:"LIVRE",category:"Lua de mel"})];
  expect(filterAdminCatalog(items,"RESERVED","alvaro","LINK","Cozinha").map(item=>item.id)).toEqual(["a"]);
  expect(filterAdminCatalog(items,"ALL","pressao")).toHaveLength(1);
  expect(filterAdminCatalog(items,"ALL","", "LIVRE")).toHaveLength(1);
  expect(filterAdminCatalog(items,"ALL","", "ALL","Unknown")).toEqual([]);
 });
});
