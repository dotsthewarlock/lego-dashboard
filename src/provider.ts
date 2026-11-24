import {DiagnosticError,obj,rows,normalize,qty,text,type Obj,type Snapshot} from './domain.js';
import {mockPages,mockCollection,mockLabels,mockUsage} from './fixtures.js';
export interface Provider { snapshot():Promise<Snapshot>; }
export class FixtureProvider implements Provider {async snapshot(){return normalize('fixture',mockPages,mockCollection,mockLabels,mockUsage,0,[{name:'Synthetic two-page join',matches:6,returned:6,consistent:true}]);}}
const methods=['checkKey','checkUserHash','getKeyUsageStats','getCollection','getUserFlagLabels','getSets'] as const;
type Method=typeof methods[number];
export interface Config {apiKey:string;userHash:string;permissionConfirmed:boolean;remainingCalls:number;year:number;}
export class BricksetProvider implements Provider {
  private calls=0;
  constructor(private config:Config,private transport:typeof fetch=fetch,private timeout=12000){}
  private async request(method:Method,params?:Obj):Promise<Obj>{
    if(!methods.includes(method))throw new DiagnosticError('invalid');
    if(this.calls>=9||this.calls>=this.config.remainingCalls)throw new DiagnosticError('quota');this.calls++;
    const body=new URLSearchParams({apiKey:this.config.apiKey});
    if(method==='getSets') {body.set('userHash','');body.set('params',JSON.stringify(params));}
    else if(['checkUserHash','getCollection','getUserFlagLabels'].includes(method))body.set('userHash',this.config.userHash);
    let r:Response;const signal=AbortSignal.timeout(this.timeout);
    try{r=await this.transport('https://brickset.com/api/v3.asmx/'+method,{method:'POST',body,redirect:'error',signal,cache:'no-store'});}catch{throw new DiagnosticError(signal.aborted?'timeout':'upstream');}
    if(r.status===429)throw new DiagnosticError('quota');if(r.status===401||r.status===403)throw new DiagnosticError('unauthorized');if(!r.ok)throw new DiagnosticError('upstream');
    let o:Obj;try{o=obj(await r.json());}catch{throw new DiagnosticError(signal.aborted?'timeout':'invalid');}
    if(o.status==='error'){const m=typeof o.message==='string'?o.message.toLowerCase():'';throw new DiagnosticError(/limit|quota/.test(m)?'quota':/key|hash|unauthor/.test(m)?'unauthorized':'upstream');}
    if(o.status!=='success')throw new DiagnosticError('invalid');return o;
  }
  async snapshot():Promise<Snapshot>{
    const c=this.config;if(!c.permissionConfirmed||!c.apiKey||!c.userHash||!Number.isInteger(c.remainingCalls)||c.remainingCalls<9||!Number.isInteger(c.year)||c.year<1949||c.year>2100)throw new DiagnosticError('unconfigured');
    await this.request('checkKey');await this.request('checkUserHash');
    const before=rows(await this.request('getKeyUsageStats'),'apiKeyUsage');
    // No timezone/reset inference: user attests remaining budget; decline if latest reported day lacks headroom.
    const latest=[...before.rows].sort((a,b)=>(text(b.dateStamp)??'').localeCompare(text(a.dateStamp)??''))[0];
    if(!latest||qty(latest.count)===null||qty(latest.dailyLimit)===null|| (latest.dailyLimit as number)-(latest.count as number)<6)throw new DiagnosticError('quota');
    const collection=await this.request('getCollection');const flags=await this.request('getUserFlagLabels');
    const params={year:String(c.year),pageSize:25,orderBy:'Number'};
    const first=await this.request('getSets',{...params,pageNumber:1});const a=rows(first,'sets');if(a.rows.length!==Math.min(25,a.matches))throw new DiagnosticError('invalid');
    const pages=[first];if(a.matches>25){const second=await this.request('getSets',{...params,pageNumber:2});if(rows(second,'sets').rows.length!==Math.min(25,a.matches-25))throw new DiagnosticError('invalid');pages.push(second);}
    const probes:Snapshot['probes']=[];if(a.rows.length){const s=a.rows[0];const exact=rows(await this.request('getSets',{setNumber:`${s.number}-${s.numberVariant}`,pageSize:20}),'sets');probes.push({name:'Exact full set number',matches:exact.matches,returned:exact.rows.length,consistent:exact.rows.some(o=>o.setID===s.setID)});}
    const usage=await this.request('getKeyUsageStats');return normalize('live',pages,collection,flags,usage,this.calls,probes);
  }
}
