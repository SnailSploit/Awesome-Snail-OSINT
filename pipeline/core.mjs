/* Snail OSINT: local-first specialist output -> typed observations -> exact overlaps.
 * No target requests, execution of embedded content, or LLM decisions in this module.
 */
import {createHash} from 'node:crypto';
import {isIP} from 'node:net';

const sha = s => createHash('sha256').update(s).digest('hex');
const safeString = (v,n=4000) => typeof v === 'string' ? v.slice(0,n) : '';
const BOT_HANDLE = /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/;
const DOMAIN = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\b/gi;
const EMAIL = /\b[A-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+\b/gi;
const URL_PATTERN = /https?:\/\/[^\s<>"'`\\]+/gi;
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const ASN_PATTERN = /\bAS[0-9]{1,10}\b/gi;
const IPV6 = /(?<![a-z0-9:])(?:[0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}(?![a-z0-9:])/gi;
const NOT_TLD = new Set(['js','json','css','xml','html','htm','jar','class','txt','png','jpeg','jpg','pdf','zip','exe','dll','map','properties','yaml','yml','gradle','kt','py','go','java','ts','tsx','jsx','sh','sql','lock','svg','webp']);
function domain(v) {
  const s=safeString(v,255).trim().toLowerCase().replace(/\.$/,'');
  if(s.length>253||!s.includes('.')||s.split('.').some(p=>!p||p.length>63||!(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(p)))||NOT_TLD.has(s.split('.').at(-1)))return null;
  if(['local','localhost','internal','invalid','test','example','onion'].includes(s.split('.').at(-1)))return null;
  return s;
}
function ip(v) {
  if(isIP(v)===4)return v;
  if(isIP(v)===6){try{return new URL('https://['+v+']/').hostname.slice(1,-1);}catch{return null;}}
  return null;
}
function email(v) {
  const at=v.lastIndexOf('@');if(at<1)return null;
  const d=domain(v.slice(at+1));return d?v.slice(0,at)+'@'+d:null; // Do not fold case-sensitive local part.
}
function normalize(type,value) {
  if(type==='domain')return domain(value);
  if(type==='ip')return ip(value);
  if(type==='asn')return /^AS[0-9]{1,10}$/i.test(value)&&Number(value.slice(2))<=4294967295&&Number(value.slice(2))>0?'AS'+Number(value.slice(2)):null;
  if(type==='jar_package')return /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*){1,20}$/.test(value)?value:null;
  if(type==='email')return email(value);
  if(type==='url'){
    try{const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||!domain(u.hostname))return null;u.hash='';return u.toString();}catch{return null;}
  }
  if(type==='cert_sha256')return /^[0-9a-f]{64}$/i.test(value)?value.toLowerCase():null;
  if(type==='secret_finding')return /^redacted:[0-9a-f]{16,64}$/.test(value)?value:null;
  if(type==='jar_sha256')return /^[0-9a-f]{64}$/i.test(value)?value.toLowerCase():null;
  return null;
}
function observation(type,value,source){
  const canonical=normalize(type,String(value));
  if(!canonical)return null;
  if(!source||!source.recordId||!source.tool||!source.upstream)throw Error('Missing source lineage');
  return {type,value:canonical,source:{tool:source.tool,upstream:source.upstream,recordId:source.recordId,sourceUrl:source.sourceUrl||null,observedAt:source.observedAt||null,collectionMode:source.collectionMode||'import',caveat:source.caveat||null,locator:source.locator||null}};
}
export function extract(text,source){
  const s=safeString(text,12000),out=[];
  const add=(type,v)=>{const r=observation(type,v,source);if(r)out.push(r);};
  for(const match of s.matchAll(URL_PATTERN)){
    const v=match[0].replace(/[),.;\]]+$/,'');add('url',v);
    try{add('domain',new URL(v).hostname);}catch{}
  }
  for(const match of s.matchAll(EMAIL)){add('email',match[0]);add('domain',match[0].split('@').at(-1));}
  for(const match of s.matchAll(ASN_PATTERN))add('asn',match[0]);
  for(const match of s.matchAll(IPV4))add('ip',match[0]);
  for(const match of s.matchAll(IPV6))add('ip',match[0]);
  for(const match of s.matchAll(DOMAIN))add('domain',match[0]);
  return out;
}
function msgText(msg){
  if(typeof msg.text==='string')return msg.text;
  if(Array.isArray(msg.text))return msg.text.map(v=>typeof v==='string'?v:safeString(v?.text,4000)).join('');
  return '';
}
export function telegramRecords(raw,{handle,mode='public',senderId}={}){
  if(!raw||!Array.isArray(raw.messages)||raw.messages.length>5000)throw Error('Telegram export must contain at most 5000 messages.');
  if(!BOT_HANDLE.test(handle||''))throw Error('Supply an explicit public channel or bot @handle.');
  const name=handle.replace(/^@/,'').toLowerCase();
  if(raw.channelUsername&&String(raw.channelUsername).replace(/^@/,'').toLowerCase()!==name)throw Error('Export channel identity does not match supplied handle.');
  if(mode==='public'&&!['public_channel','public_supergroup','public_group'].includes(raw.type))throw Error('Only declared public Telegram exports may be used as public sources.');
  if(mode==='bot'&&raw.type!=='personal_chat')throw Error('Bot conversation import requires a personal_chat export and explicit --telegram-bot.');
  if(mode==='bot'&&(!senderId||!/^user[0-9]+$/.test(senderId)))throw Error('Bot conversation import requires an explicit bot sender from_id like user12345.');
  if(!['public','bot'].includes(mode))throw Error('Invalid Telegram mode');
  const result=[];
  for(const m of raw.messages){
    if(!Number.isSafeInteger(m.id)||m.id<1||m.type!=='message')continue;
    if(mode==='bot'&&m.from_id!==senderId)continue; // Never turn user prompts into bot assertions.
    const text=msgText(m);
    if(!text)continue;
    const timestamp=typeof m.date_unixtime==='string'&&/^\d{9,12}$/.test(m.date_unixtime)
      ?new Date(Number(m.date_unixtime)*1000).toISOString():null;
    const src={tool:mode==='bot'?'telegram-bot-export':'telegram-public-export',upstream:'telegram:'+name,
      recordId:'telegram:'+name+':'+m.id,sourceUrl:mode==='public'?'https://t.me/'+name+'/'+m.id:null,
      observedAt:timestamp,collectionMode:'import',
      caveat:mode==='bot'?'Unverified third-party bot reply; not independent proof.':'User-provided export; public channel identity not independently authenticated.'};
    result.push(...extract(text,src));
  }
  return result;
}
export function shodanRecords(raw){
  if(!raw||!Array.isArray(raw.matches)||raw.matches.length>5000)throw Error('Expected bounded Shodan matches array.');
  const rows=[];
  for(const [i,m] of raw.matches.entries()){
    const s={tool:'shodan-json',upstream:'shodan',recordId:'shodan:'+i+':'+sha(JSON.stringify([m.ip_str,m.port,m.timestamp])).slice(0,12),
      observedAt:safeString(m.timestamp,40)||null,collectionMode:'import',caveat:'Provider-indexed snapshot; not a live scan or ownership evidence.'};
    if(m.ip_str)rows.push(observation('ip',m.ip_str,s));
    for(const h of Array.isArray(m.hostnames)?m.hostnames.slice(0,50):[])rows.push(observation('domain',h,s));
    for(const h of Array.isArray(m.domains)?m.domains.slice(0,50):[])rows.push(observation('domain',h,s));
    const cert=m.ssl?.cert?.fingerprint?.sha256;
    if(cert)rows.push(observation('cert_sha256',cert,s));
  }
  return rows.filter(Boolean);
}
export function hunterRecords(raw){
  const data=raw?.data;
  if(!data||!Array.isArray(data.emails)||data.emails.length>1000)throw Error('Expected bounded Hunter domain-search JSON.');
  const rows=[];
  for(const [i,item] of data.emails.entries()){
    const s={tool:'hunter-json',upstream:'hunter.io',recordId:'hunter:'+i+':'+sha(safeString(item.value)).slice(0,12),
      collectionMode:'import',caveat:'Provider assertion; email existence and deliverability not independently verified.'};
    const r=observation('email',item.value,s);if(r)rows.push(r);
    for(const ref of Array.isArray(item.sources)?item.sources.slice(0,15):[]){
      if(typeof ref.uri==='string')rows.push(...extract(ref.uri,{...s,recordId:s.recordId+':source:'+sha(ref.uri).slice(0,10),sourceUrl:ref.uri}));
    }
  }
  return rows;
}
export function gitleaksRecords(raw){
  if(!Array.isArray(raw)||raw.length>5000)throw Error('Expected bounded Gitleaks JSON findings array.');
  return raw.map(item=>{
    if(!item||typeof item.RuleID!=='string'||typeof item.File!=='string')return null;
    // Never serialize Secret, Match, or the original provider object.
    const id=sha(JSON.stringify([item.RuleID,item.File,item.StartLine??null,item.Commit??null]));
    return observation('secret_finding','redacted:'+id,{tool:'gitleaks-report',upstream:'locally-authorized-gitleaks',recordId:id,
      collectionMode:'local-import',locator:{file:item.File.slice(0,500),line:Number.isInteger(item.StartLine)?item.StartLine:null,rule:item.RuleID.slice(0,100),commit:safeString(item.Commit,80)},caveat:'Potential exposure only. Secret value deliberately omitted; no token verification.'});
  }).filter(Boolean);
}
export function jarRecords(raw){
  if(!raw||!(/^[0-9a-f]{64}$/.test(raw.sha256))||!Array.isArray(raw.identifiers)||raw.identifiers.length>2000)throw Error('Expected bounded safe JAR inspector JSON.');
  const src={tool:'jar-static',upstream:'local-artifact:'+raw.sha256,recordId:'jar:'+raw.sha256,collectionMode:'local',
    caveat:'Static archive inspection; no Java code executed. Embedded strings may be unused.'};
  return [observation('jar_sha256',raw.sha256,src),...(Array.isArray(raw.packages)?raw.packages.slice(0,100):[]).map(p=>observation('jar_package',p,src)),...raw.identifiers.flatMap(t=>extract(t,src))].filter(Boolean);
}
export function aggregate(records){
  if(!Array.isArray(records)||records.length>60000)throw Error('Too many observations');
  const map=new Map(),originMap=new Map();let accepted=0;
  for(const r of records){
    if(!r||typeof r!=='object'||!r.source)continue;
    const normalized=observation(r.type,r.value,r.source);if(!normalized)continue;
    accepted++;
    const k=normalized.type+':'+normalized.value;
    if(!map.has(k))map.set(k,{type:normalized.type,value:normalized.value,sources:[]});
    const entity=map.get(k);const src=normalized.source;
    const evidenceKey=src.upstream+':'+src.recordId;
    if(!entity.sources.some(e=>e.key===evidenceKey))entity.sources.push({key:evidenceKey,...src});
    if(!originMap.has(src.upstream))originMap.set(src.upstream,0);
    originMap.set(src.upstream,originMap.get(src.upstream)+1);
  }
  const entities=[...map.values()].sort((a,b)=>a.type.localeCompare(b.type)||a.value.localeCompare(b.value));
  const overlaps=entities.flatMap(e=>{
    const independent=[...new Set(e.sources.map(s=>s.upstream))];
    return independent.length>1?[{type:e.type,value:e.value,upstreams:independent,sourceCount:e.sources.length,
      note:'Same exact identifier seen in distinct declared upstream sources; not attribution.'}]:[];
  });
  return {schema:'snail-tool-pipeline/v1',stats:{inputObservations:records.length,accepted,uniqueEntities:entities.length,
    duplicatesRemoved:accepted-entities.length,overlaps:overlaps.length,upstreams:Object.fromEntries(originMap)},
    entities,overlaps,pivots:entities.filter(e=>['domain','ip','asn','url','cert_sha256'].includes(e.type)).map(e=>({type:e.type,value:e.value,sourceCount:e.sources.length})),
    limitations:['Imported results may be incomplete, fabricated or stale.','A shared identifier is not ownership or identity proof.','No third-party bot was queried automatically.']};
}
