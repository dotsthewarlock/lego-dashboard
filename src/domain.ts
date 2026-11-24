export type Mode = 'fixture' | 'live';
export type ErrorCode = 'unconfigured' | 'unauthorized' | 'quota' | 'timeout' | 'upstream' | 'invalid';
export class DiagnosticError extends Error { constructor(public code: ErrorCode) { super(code); } }
export type Obj = Record<string, unknown>;
export function obj(x: unknown): Obj { if (!x || typeof x !== 'object' || Array.isArray(x)) throw new DiagnosticError('invalid'); return x as Obj; }
export const optional = (x: unknown): Obj => x == null ? {} : obj(x);
export const text = (x: unknown): string | null => typeof x === 'string' && x.trim() ? x : null;
export const num = (x: unknown): number | null => typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null;
export const qty = (x: unknown): number | null => Number.isSafeInteger(x) && (x as number) >= 0 ? x as number : null;
export const bool = (x: unknown): boolean | null => typeof x === 'boolean' ? x : null;
export function id(x: unknown): number { const n = qty(x); if (n === null || n === 0) throw new DiagnosticError('invalid'); return n; }
export function rows(x: unknown, field: string): {matches: number; rows: Obj[]} {
  const o = obj(x); if (o.status !== 'success' || qty(o.matches) === null) throw new DiagnosticError('invalid');
  const a = o[field]; if (!Array.isArray(a)) throw new DiagnosticError('invalid');
  const matches = o.matches as number; if (a.length > matches || (matches > 0 && a.length === 0)) throw new DiagnosticError('invalid');
  return {matches, rows: a.map(obj)};
}
export interface Personal { setID:number; owned:boolean|null; wanted:boolean|null; qtyOwned:number|null; qtyWanted:number|null; qtyOwnedNew:number|null; qtyOwnedUsed:number|null; qtyOwnedLoose:number|null; wantedPriority:number|null; flags:{flagNo:number;value:boolean}[]|null; }
export interface Region { currency:'CAD'|'USD'; msrp:number|null; firstAvailable:string|null; lastAvailable:string|null; }
export interface SetRecord { setID:number; number:string; variant:number; name:string; theme:string|null; subtheme:string|null; year:number|null; released:boolean|null; launchDate:string|null; exitDate:string|null; availabilityRaw:string|null; CAD:Region; USD:Region; UPC:string|null; EAN:string|null; providerUpdated:string|null; sourceURL:string|null; personal:Personal|null; }
export interface Snapshot { mode:Mode; observedAt:string; sets:SetRecord[]; personal:Personal[]; flagLabels:{flagNo:number;label:string}[]; matches:number; collectionMatches:number; calls:number; usage:{dateStamp:string|null;count:number|null;dailyLimit:number|null}[]; probes:{name:string;matches:number;returned:number;consistent:boolean|null}[]; }
function unique<T>(a:T[], key:(v:T)=>number):T[] { if(new Set(a.map(key)).size!==a.length) throw new DiagnosticError('invalid');return a; }
export function personal(o:Obj):Personal {
  const flags = o.flags == null ? null : Array.isArray(o.flags) ? unique(o.flags.map(v=>{ const f=obj(v);const flagNo=id(f.flagNo);if(flagNo>8 || typeof f.value!=='boolean') throw new DiagnosticError('invalid');return {flagNo,value:f.value}; }), f=>f.flagNo) : (()=>{throw new DiagnosticError('invalid')})();
  return {setID:id(o.setID),owned:bool(o.owned),wanted:bool(o.wanted),qtyOwned:qty(o.qtyOwned),qtyWanted:qty(o.qtyWanted),qtyOwnedNew:qty(o.qtyOwnedNew),qtyOwnedUsed:qty(o.qtyOwnedUsed),qtyOwnedLoose:qty(o.qtyOwnedLoose),wantedPriority:qty(o.wantedPriority),flags};
}
export function flagLabels(x:unknown){const r=rows(x,'flags');if(r.matches!==r.rows.length)throw new DiagnosticError('invalid');return unique(r.rows.map(o=>{const flagNo=id(o.flagNo);const label=typeof o.label==='string'?o.label:null;if(flagNo>8||label===null)throw new DiagnosticError('invalid');return {flagNo,label};}),f=>f.flagNo);}
export function catalogue(o:Obj, p:Map<number,Personal>):SetRecord {
  const setID=id(o.setID), number=text(o.number), variant=qty(o.numberVariant), name=text(o.name);
  if(!number||variant===null||!name)throw new DiagnosticError('invalid');
  const markets=optional(o.LEGOCom), barcode=optional(o.barcode);
  const region=(x:unknown,currency:Region['currency']):Region=>{const a=optional(x);return {currency,msrp:num(a.retailPrice),firstAvailable:text(a.dateFirstAvailable),lastAvailable:text(a.dateLastAvailable)};};
  let sourceURL:string|null=null;try{const u=new URL(text(o.bricksetURL)??'');if(u.origin==='https://brickset.com'&&u.pathname.startsWith('/sets/')&&!u.username&&!u.password){u.search='';u.hash='';sourceURL=u.href;}}catch{}
  return {setID,number,variant,name,theme:text(o.theme),subtheme:text(o.subtheme),year:qty(o.year),released:bool(o.released),launchDate:text(o.launchDate),exitDate:text(o.exitDate),availabilityRaw:text(o.availability),CAD:region(markets.CA,'CAD'),USD:region(markets.US,'USD'),UPC:text(barcode.UPC),EAN:text(barcode.EAN),providerUpdated:text(o.lastUpdated),sourceURL,personal:p.get(setID)??null};
}
export function collectionRecords(response: unknown): Personal[] {
  const result = rows(response, 'sets');
  if (result.matches !== result.rows.length) throw new DiagnosticError('invalid');
  return unique(result.rows.map(personal), record => record.setID);
}
export function normalize(mode:Mode, pages:unknown[], collection:unknown, labels:unknown, usage:unknown, calls:number, probes:Snapshot['probes']=[]):Snapshot {
  const p=collectionRecords(collection);const map=new Map(p.map(v=>[v.setID,v]));
  const parsed=pages.map(x=>rows(x,'sets'));if(!parsed.length||parsed.some(x=>x.matches!==parsed[0].matches))throw new DiagnosticError('invalid');
  const sets=unique(parsed.flatMap(x=>x.rows.map(o=>catalogue(o,map))),s=>s.setID);if(sets.length>parsed[0].matches)throw new DiagnosticError('invalid');
  const u=rows(usage,'apiKeyUsage');if(u.matches!==u.rows.length)throw new DiagnosticError('invalid');
  return {mode,observedAt:new Date().toISOString(),sets,personal:p,flagLabels:flagLabels(labels),matches:parsed[0].matches,collectionMatches:p.length,calls,usage:u.rows.map(o=>({dateStamp:text(o.dateStamp),count:qty(o.count),dailyLimit:qty(o.dailyLimit)})),probes};
}
