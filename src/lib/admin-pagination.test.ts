import { describe, expect, it } from "vitest";
import { readAllRows } from "./admin-pagination";
describe("complete admin totals",()=>{
 it("loads every page when there are more than 1,000 records",async()=>{
  const input=Array.from({length:2005},(_,index)=>index);
  const ranges: number[][]=[];
  const output=await readAllRows<number>(async(from,to)=>{ranges.push([from,to]);return {data:input.slice(from,to+1),error:null};});
  expect(output).toEqual(input);expect(ranges).toEqual([[0,999],[1000,1999],[2000,2999]]);
 });
 it("refuses to return incomplete money totals when a later page fails",async()=>{
  await expect(readAllRows(async from=>from===0 ? {data:Array(1000).fill(1),error:null} : {data:null,error:{message:"failed"}})).rejects.toThrow("dados incompletos");
 });
 it("handles an empty catalog without fabricated values",async()=>{
  expect(await readAllRows(async()=>({data:[],error:null}))).toEqual([]);
 });
});
