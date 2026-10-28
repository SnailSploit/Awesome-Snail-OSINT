#!/usr/bin/env node
/* Explicit local collection. HTTPS only, pinned public IP, fixed declarations, no redirects. */
import https from 'node:https';
import {lookup} from 'node:dns/promises';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {domainName,publicIP} from '../site/execution-core.mjs';
import {evidence,analyze,verifyEvidence,parseAssetLinks,parseAds} from '../site/synthesis-core.mjs';
export function scopeManifest(m){
  if(!m||m.schemaVersion!==1||!['app-trust','operational-continuity'].includes(m.technique)||!Array.isArray(m.targets)||m.targets.length<1||m.targets.length>4)throw Error('Manifest requires schemaVersion 1, a supported technique and 1-4 targets.');
  const targets=m.targets.map(t=>{const domain=domainName(t.domain),role=t.role??'subject';if(!['subject','control'].includes(role))throw Error('Invalid target role.');
    const releases=t.releases??[];if(!Array.isArray(releases)||releases.length>2)throw Error('At most two explicitly scoped release artifacts per host.');
    for(const r of releases){if(typeof r.path!=='string'||!r.path.startsWith('/')||r.path.startsWith('//')||/[?#\\\s]/.test(r.path)||r.path.length>1024||!r.channel||r.channel.length>100||typeof r.commonDependency!=='boolean')throw Error('Release paths must be explicit same-host paths, with a channel and commonDependency flag.');const u=new URL(r.path,'https://'+domain);if(u.hostname!==domain||u.pathname!==r.path)throw Error('Noncanonical release path.');}
    return {domain,role,releases};});
  if(new Set(targets.map(t=>t.domain)).size!==targets.length)throw Error('Duplicate target domains.');
  const sellers=(m.sellerSystems??[]).map(domainName);if(sellers.length>4)throw Error('At most four explicitly scoped seller systems.');
  return {schemaVersion:1,technique:m.technique,targets,sellerSystems:[...new Set(sellers)]};
}
export async function publicBytes(domain,path,{resolver=lookup,transport=https,timeoutMs=8000,maxBytes=2097152}={}){
  domainName(domain);
  const parsed=new URL(path,'https://'+domain);
  if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//')||/[?#\\\s]/.test(path)||parsed.hostname!==domain||parsed.pathname!==path)throw Error('Noncanonical collection path.');
  let dnsTimer;
  const answers=await Promise.race([resolver(domain,{all:true,verbatim:true}),new Promise((_,reject)=>{dnsTimer=setTimeout(()=>reject(Error('DNS resolution timed out.')),timeoutMs);})]).finally(()=>clearTimeout(dnsTimer));
  if(!answers.length)throw Error('DNS returned no address.');for(const a of answers)publicIP(a.address); // Any private/special answer denies the request.
  const pinned=answers[0];
  return await new Promise((resolve,reject)=>{
    let timer,finished=false,bytes=0,chunks=[];const done=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);error?reject(error):resolve(value);};
    const req=transport.request({hostname:domain,servername:domain,path,method:'GET',port:443,agent:false,
      lookup:(host,options,callback)=>options?.all?callback(null,[pinned]):callback(null,pinned.address,pinned.family),
      headers:{Accept:'application/json,text/plain,application/javascript','User-Agent':'Snail-OSINT-Atlas/1.0 (explicit public declaration collection)'}},res=>{
      if(res.statusCode!==200){res.destroy();done(Error('HTTP '+res.statusCode+'; redirects and error bodies are not followed.'));return;}
      if(Number(res.headers['content-length'])>maxBytes){res.destroy();done(Error('Response exceeds byte budget.'));return;}
      res.on('data',chunk=>{bytes+=chunk.length;if(bytes>maxBytes){res.destroy();done(Error('Response exceeds byte budget.'));}else chunks.push(chunk);});
      res.on('end',()=>done(null,Buffer.concat(chunks)));res.on('error',e=>done(e));
    });
    timer=setTimeout(()=>{req.destroy();done(Error('Collection timed out.'));},timeoutMs);req.on('error',e=>done(e));req.end();
  });
}
export async function collectManifest(raw,{get=publicBytes}={}){
  const m=scopeManifest(raw),observations=[];
  async function capture(kind,domain,path,project,role='subject'){
    let payload,outcome='ok',coverage='complete';
    try{const bytes=await get(domain,path);payload=project(bytes);payload.rawSha256=createHash('sha256').update(bytes).digest('hex');}
    catch(e){payload={error:String(e.message).slice(0,300)};outcome='error';coverage='unknown';}
    observations.push(await evidence({kind,subject:domain,observedAt:new Date().toISOString(),sourceUrl:'https://'+domain+path,payload,outcome,coverage,role}));
  }
  const decode=bytes=>new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  for(const t of m.targets){
    if(m.technique==='app-trust')await capture('assetlinks',t.domain,'/.well-known/assetlinks.json',bytes=>{const statements=JSON.parse(decode(bytes));if(!Array.isArray(statements))throw Error('Expected a JSON statement list.');parseAssetLinks({statements});return {statements};},t.role);
    else{
      await capture('ads-txt',t.domain,'/ads.txt',bytes=>{const text=decode(bytes),p=parseAds(text);if(p.invalid&&!p.accounts.length&&!p.managers.length&&!p.owners.length)throw Error('No usable declarations; malformed/HTML response.');return {text};},t.role);
      for(const r of t.releases)await capture('release',t.domain,r.path,bytes=>({signature:createHash('sha256').update(bytes).digest('hex'),hashMethod:'sha256:raw-bytes',channel:r.channel,scope:'first-party',commonDependency:r.commonDependency}),t.role);
    }
  }
  if(m.technique==='operational-continuity')for(const system of m.sellerSystems)await capture('sellers',system,'/sellers.json',bytes=>{const raw=JSON.parse(decode(bytes));if(!Array.isArray(raw.sellers)||raw.sellers.length>2000)throw Error('Expected at most 2000 sellers; use a scoped retained subset for larger files.');return {sellers:raw.sellers.map(s=>({seller_id:s.seller_id,seller_type:s.seller_type,domain:s.domain??'',is_confidential:s.is_confidential??0}))};});
  return {schemaVersion:1,technique:m.technique,observations,context:{},collection:{mode:'explicit-local-https',note:'First-party classification is investigator-supplied. Bytes were not executed. DNS pinned after public-address validation.'}};
}
async function main(){
  const args=process.argv.slice(2),get=k=>{const i=args.indexOf(k);return i<0?null:args[i+1];};
  if(!args.includes('--confirm-scope')||!get('--manifest')||!get('--out'))throw Error('Usage: node scripts/collect_research.mjs --manifest scope.json --confirm-scope --out evidence.json [--previous earlier.json]');
  const manifest=JSON.parse(await readFile(get('--manifest'),'utf8')),result=await collectManifest(manifest);
  if(get('--previous')){const old=JSON.parse(await readFile(get('--previous'),'utf8'));if(old.fixture===true||old.dataset==='synthetic-fixture')throw Error('Synthetic challenge data cannot be merged with live collection.');if(old.schemaVersion!==1||old.technique!==result.technique||!Array.isArray(old.observations))throw Error('Previous capture has an incompatible schema.');for(const r of old.observations)await verifyEvidence(r);result.observations.unshift(...old.observations);}
  await analyze(result);await writeFile(get('--out'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({output:get('--out'),observations:result.observations.length,failed:result.observations.filter(r=>r.outcome==='error').length}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
