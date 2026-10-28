/* Fixed-provider adapters. Neither input nor remote JSON may authorize a new destination. */
import {domainName,publicIP,ipParts,inPrefix} from '../site/execution-core.mjs';
const RIR_BASES=['https://rdap.arin.net/registry/','https://rdap.db.ripe.net/','https://rdap.apnic.net/','https://rdap.lacnic.net/rdap/','https://rdap.afrinic.net/rdap/'];
// Used only when the exact base is also present in IANA's current bootstrap file.
const DOMAIN_BASES=['https://rdap.verisign.com/com/v1/','https://rdap.verisign.com/net/v1/','https://rdap.publicinterestregistry.org/rdap/','https://rdap.identitydigital.services/rdap/','https://pubapi.registry.google/rdap/','https://rdap.nic.xyz/','https://rdap.nic.ai/','https://rdap.nic.co/','https://rdap.isoc.org.il/rdap/','https://rdap.nominet.uk/uk/','https://rdap.denic.de/','https://rdap.nic.fr/'];
const TYPES={A:1,AAAA:28,CNAME:5,NS:2,MX:15,TXT:16,CAA:257};
const text=(s,n=512)=>typeof s==='string'?s.slice(0,n):'';
const list=v=>Array.isArray(v)?v:[];
function requireShape(ok){if(!ok)throw new Error('Provider response failed schema or subject validation.');}
function abortError(){return new DOMException('Lookup cancelled or deadline exceeded.','AbortError');}
export function allowedRequest(raw,kind,subject) {
  let u;try{u=new URL(raw);}catch{return false;}
  if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash)return false;
  if(kind==='dns')return u.origin==='https://dns.google'&&u.pathname==='/resolve'&&u.searchParams.get('name')===subject&&Object.hasOwn(TYPES,u.searchParams.get('type'));
  if(kind==='routing')return u.origin==='https://stat.ripe.net'&&u.pathname==='/data/network-info/data.json'&&u.searchParams.get('resource')===subject;
  if(kind==='bootstrap')return u.origin==='https://data.iana.org'&&['/rdap/dns.json','/rdap/ipv4.json','/rdap/ipv6.json'].includes(u.pathname)&&!u.search;
  const bases=kind==='ip-rdap'?RIR_BASES:DOMAIN_BASES,object=kind==='ip-rdap'?'ip/':'domain/';
  return !u.search&&bases.some(base=>u.href===base+object+encodeURIComponent(subject)||u.href===base+object+subject);
}
export async function readLimited(response,maxBytes=524288) {
  if(Number(response.headers.get('content-length'))>maxBytes)throw new Error('Provider response exceeds the byte budget.');
  if(!response.body)return '';
  const reader=response.body.getReader(),chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes)throw new Error('Provider response exceeds the byte budget.');chunks.push(value);}}
  finally{try{await reader.cancel();}catch{}}
  const all=new Uint8Array(size);let pos=0;for(const c of chunks){all.set(c,pos);pos+=c.length;}
  return new TextDecoder('utf-8',{fatal:true}).decode(all);
}
export async function providerJSON(url,kind,subject,ctx,requests) {
  if(!allowedRequest(url,kind,subject))throw new Error('Provider URL denied by egress policy.');
  if(ctx.signal?.aborted)throw abortError();
  if(ctx.remaining<=0)throw new Error('Provider request budget exhausted.');
  ctx.remaining--;
  const controller=new AbortController(),abort=()=>controller.abort();
  ctx.signal?.addEventListener('abort',abort,{once:true});
  const timeout=setTimeout(abort,ctx.timeoutMs??6500);
  try{
    const response=await ctx.fetcher(url,{method:'GET',redirect:'manual',signal:controller.signal,headers:{Accept:'application/rdap+json, application/json','User-Agent':'Snail-OSINT-Atlas/1.0 (bounded public-record research)'},cf:{cacheTtl:0}});
    const record={url,status:response.status,receivedAt:new Date().toISOString()};requests.push(record);
    if(response.status>=300&&response.status<400){
      const location=response.headers.get('location');try{await response.body?.cancel();}catch{}
      if(!kind.endsWith('rdap')||requests.length>=4||!location)throw new Error('Provider redirect not followed.');
      const next=new URL(location,url).href;
      if(!allowedRequest(next,kind,subject))throw new Error('Provider redirect denied by egress policy.');
      return await providerJSON(next,kind,subject,ctx,requests);
    }
    if(response.status===404){try{await response.body?.cancel();}catch{}return {notFound:true};}
    if(!response.ok){try{await response.body?.cancel();}catch{}const e=new Error(response.status===429?'Provider rate-limited this lookup. No automatic retries.':'Provider returned HTTP '+response.status+'.');e.upstream=true;throw e;}
    const content=await readLimited(response,kind==='bootstrap'?1572864:524288);
    let value;try{value=JSON.parse(content);}catch{throw new Error('Provider did not return valid JSON.');}
    return value;
  }catch(e){if(controller.signal.aborted)throw new Error(ctx.signal?.aborted?'Run cancelled or deadline exceeded.':'Provider timed out; no automatic retry.');throw e;}
  finally{clearTimeout(timeout);ctx.signal?.removeEventListener('abort',abort);}
}
export function normalizeDNS(raw,step) {
  requireShape(raw&&Number.isInteger(raw.Status)&&list(raw.Question).some(q=>q.type===TYPES[step.recordType]&&text(q.name).replace(/\.$/,'').toLowerCase()===step.subject));
  const answers=list(raw.Answer).slice(0,96).map(r=>{
    requireShape(typeof r.name==='string'&&Number.isInteger(r.type)&&typeof r.data==='string'&&r.data.length<=4096&&(!Object.hasOwn(r,'TTL')||Number.isFinite(r.TTL)));
    return {name:r.name.replace(/\.$/,'').toLowerCase(),type:r.type,ttl:Number.isFinite(r.TTL)?r.TTL:null,data:r.data};
  });
  const payload={question:step.subject,recordType:step.recordType,rcode:raw.Status,dnssecValidated:raw.AD===true,truncated:raw.TC===true||list(raw.Answer).length>96,answers};
  if(payload.truncated)return {status:'error',payload,note:'Resolver response was truncated; do not treat this as a complete answer.'};
  if(raw.Status===3)return {status:'empty',payload,note:'Resolver reported NXDOMAIN for this exact question at collection time. This is not proof of permanent nonexistence.'};
  if(raw.Status!==0)return {status:'unavailable',payload,note:'DNS error code '+raw.Status+'; not evidence that records do not exist.'};
  return {status:answers.some(r=>r.type===TYPES[step.recordType])?'ok':'empty',payload,note:'Google Public DNS response. Cached/geographic answers may differ; DNS records do not establish ownership or reachability.'};
}
function registryProjection(raw,step) {
  requireShape(raw&&typeof raw==='object');
  const events=list(raw.events).slice(0,12).filter(e=>typeof e.eventAction==='string'&&typeof e.eventDate==='string').map(e=>({action:text(e.eventAction,80),date:text(e.eventDate,80)}));
  if(step.adapter==='domain-rdap'){
    requireShape(raw.objectClassName==='domain'&&text(raw.ldhName).toLowerCase()===step.subject);
    return {domain:step.subject,status:list(raw.status).filter(s=>typeof s==='string').slice(0,16),nameservers:list(raw.nameservers).map(n=>text(n.ldhName).toLowerCase()).filter(Boolean).slice(0,24),events,delegationSigned:typeof raw.secureDNS?.delegationSigned==='boolean'?raw.secureDNS.delegationSigned:null};
  }
  requireShape(raw.objectClassName==='ip network'&&typeof raw.startAddress==='string'&&typeof raw.endAddress==='string');
  const a=ipParts(raw.startAddress),b=ipParts(raw.endAddress),s=ipParts(step.subject);
  requireShape(a.family===s.family&&b.family===s.family&&a.value<=s.value&&s.value<=b.value);
  return {name:text(raw.name),handle:text(raw.handle),startAddress:a.text,endAddress:b.text,ipVersion:text(raw.ipVersion),country:text(raw.country,3),type:text(raw.type),events};
}
export async function collect(step,ctx) {
  const requests=[];
  try{
    if(step.adapter==='dns'){
      requireShape(Object.hasOwn(TYPES,step.recordType));
      const base=step.subject.startsWith('_dmarc.')?domainName(step.subject.slice(7)):domainName(step.subject);
      requireShape(step.subject===base||step.subject==='_dmarc.'+base);
      const url='https://dns.google/resolve?'+new URLSearchParams({name:step.subject,type:step.recordType,edns_client_subnet:'0.0.0.0/0'});
      return {...normalizeDNS(await providerJSON(url,'dns',step.subject,ctx,requests),step),requests};
    }
    if(step.adapter==='routing'){
      publicIP(step.subject);
      const url='https://stat.ripe.net/data/network-info/data.json?'+new URLSearchParams({resource:step.subject});
      const raw=await providerJSON(url,'routing',step.subject,ctx,requests);
      requireShape(raw?.status==='ok'&&raw.data&&Array.isArray(raw.data.asns));
      const prefix=raw.data.prefix||null;
      if(prefix)requireShape(typeof prefix==='string'&&inPrefix(step.subject,prefix));
      const asns=raw.data.asns.slice(0,24).map(n=>{requireShape(/^\d+$/.test(String(n))&&Number(n)>0&&Number(n)<=4294967295);return String(n);});
      return {status:prefix?'ok':'empty',payload:{prefix,asns,sourceTime:text(raw.time)||null},requests,note:'RIPE RIS-derived snapshot (not a live probe). An origin ASN is not proof of a host owner or physical location.'};
    }
    requireShape(['domain-rdap','ip-rdap'].includes(step.adapter));
    const isIP=step.adapter==='ip-rdap';
    const normalized=isIP?publicIP(step.subject):domainName(step.subject);
    requireShape(normalized===step.subject);
    const filename=isIP?(ipParts(step.subject).family===4?'ipv4':'ipv6'):'dns';
    const bootstrap=await providerJSON('https://data.iana.org/rdap/'+filename+'.json','bootstrap',step.subject,ctx,requests);
    requireShape(Array.isArray(bootstrap?.services));
    const matches=bootstrap.services.filter(entry=>Array.isArray(entry)&&Array.isArray(entry[0])&&Array.isArray(entry[1])&&entry[0].some(key=>isIP?inPrefix(step.subject,key):key===step.subject.split('.').at(-1)));
    if(isIP)matches.sort((a,b)=>Math.max(...b[0].filter(p=>inPrefix(step.subject,p)).map(p=>Number(p.split('/')[1])))-Math.max(...a[0].filter(p=>inPrefix(step.subject,p)).map(p=>Number(p.split('/')[1]))));
    const bases=isIP?RIR_BASES:DOMAIN_BASES;
    const base=matches[0]?.[1].find(url=>bases.includes(url));
    if(!base)return {status:'unsupported',payload:{bootstrapPublication:text(bootstrap.publication)},requests,note:'No supported HTTPS registry in the current IANA bootstrap. No guessed registry or parent-domain lookup was attempted.'};
    const raw=await providerJSON(base+(isIP?'ip/':'domain/')+encodeURIComponent(step.subject),step.adapter,step.subject,ctx,requests);
    if(raw.notFound)return {status:'empty',payload:{},requests,note:'Registry returned 404 for this exact object. For domain records, use the registered domain, not an arbitrary subdomain; absence here is not an availability claim.'};
    return {status:'ok',payload:registryProjection(raw,step),requests,note:'IANA-selected registry record. Contacts/entities are omitted. Registration is not proof of current operation, ownership of hosted content, or location.'};
  }catch(e){
    return {status:ctx.signal?.aborted?'cancelled':e.upstream?'unavailable':'error',payload:{},requests,note:text(e.message,300)||'Collection failed.'};
  }
}
