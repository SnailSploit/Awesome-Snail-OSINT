/* Only Google's fixed DAL endpoint is reachable here; no arbitrary origin proxy. */
import {domainName} from '../site/execution-core.mjs';
import {evidence,parseAssetLinks} from '../site/synthesis-core.mjs';
import {readLimited} from './providers.mjs';
import {takeSlot} from './engine.mjs';
const H={'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const answer=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:H});
export function appRequest(value){
  if(!value||typeof value!=='object'||Object.keys(value).some(k=>!['domains','consent'].includes(k))||value.consent!==true)throw Error('Confirm scope before collection. Only domains and consent are accepted.');
  if(!Array.isArray(value.domains)||value.domains.length<1||value.domains.length>4)throw Error('Collect one to four exact public domains.');
  return [...new Set(value.domains.map(domainName))];
}
export function fromGoogle(raw,domain){
  if(!raw||typeof raw!=='object'||typeof raw.maxAge!=='string'||!/^\d+(?:\.\d+)?s$/.test(raw.maxAge)||!Array.isArray(raw.statements??[])||(raw.statements??[]).length>500)throw Error('Unexpected Digital Asset Links response shape.');
  const statements=[];let excluded=0;
  for(const row of raw.statements??[]){
    let site;try{site=new URL(row?.source?.web?.site);if((site.protocol!=='https:'||site.hostname.replace(/\.$/,'')!==domain||site.port)||!['','/'].includes(site.pathname)||site.search||site.hash||site.username||site.password)throw Error();}catch{throw Error('Provider source identity does not match the requested domain.');}
    if(row.target?.web)continue;
    const app=row.target?.androidApp;
    if(!app||typeof app.packageName!=='string'||typeof row.relation!=='string'||typeof app.certificate?.sha256Fingerprint!=='string'){excluded++;continue;}
    statements.push({relation:[row.relation],target:{namespace:'android_app',package_name:app.packageName,sha256_cert_fingerprints:[app.certificate.sha256Fingerprint]},...(row.relationExtensions?{relation_extensions:row.relationExtensions}:{})});
  }
  const parsed=parseAssetLinks({statements});
  return {statements,providerMaxAge:raw.maxAge,publisherUrl:'https://'+domain+'/.well-known/assetlinks.json',excluded,warnings:parsed.warnings,note:'Google provider observation at retrieval time, not statement issuance. Provider cache/coverage is unknown; an empty response is not proof of absence.'};
}
export async function collectApps(domains,{fetcher=fetch,timeoutMs=8000,signal}={}){
  const observations=[];
  async function one(domain){
    const url='https://digitalassetlinks.googleapis.com/v1/statements:list?'+new URLSearchParams({'source.web.site':'https://'+domain});
    const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,timeoutMs);
    let payload,outcome='error';
    try{
      if(signal?.aborted)throw Error('Collection cancelled.');
      const r=await fetcher(url,{redirect:'error',credentials:'omit',signal:controller.signal,headers:{Accept:'application/json','User-Agent':'Snail-OSINT-Atlas/1.0 (explicit bounded research)'}});
      if(!r.ok){try{await r.body?.cancel();}catch{}throw Error('Provider returned HTTP '+r.status+'. No retry or fallback query was made.');}
      payload=fromGoogle(JSON.parse(await readLimited(r,524288)),domain);outcome=payload.statements.length?'ok':'empty';
    }catch(e){payload={error:controller.signal.aborted?'Lookup cancelled or timed out.':String(e.message).slice(0,300)};}
    finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
    observations.push(await evidence({kind:'assetlinks',subject:domain,observedAt:new Date().toISOString(),sourceUrl:url,outcome,coverage:'unknown',payload}));
  }
  for(let i=0;i<domains.length&&!signal?.aborted;i+=2)await Promise.all(domains.slice(i,i+2).map(one));
  return {schemaVersion:1,technique:'app-trust',observations,context:{},collection:{mode:'provider-query',requests:observations.length,provider:'Google Digital Asset Links',coverage:'unknown',directTargetHTTP:false}};
}
export async function handleSynthesis(request,{fetcher=fetch,rateLimit=true,timeoutMs=8000}={}){
  if(request.method==='GET')return answer({version:'1.0.0',liveCollectors:['app-trust'],localAnalyzers:['app-trust','document-lineage','operational-continuity'],maxDomains:4});
  if(request.method!=='POST')return answer({error:'Use POST to collect.'},405);
  if(request.headers.get('Origin')!==new URL(request.url).origin)return answer({error:'Same-origin request required.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return answer({error:'JSON required.'},415);
  let domains;try{domains=appRequest(JSON.parse(await readLimited(request,2048)));}catch(e){return answer({error:e.message},400);}
  if(rateLimit&&!takeSlot('synthesis:'+(request.headers.get('CF-Connecting-IP')||'local')))return answer({error:'Burst limit reached; retry later.'},429);
  const result=await collectApps(domains,{fetcher,timeoutMs,signal:request.signal});return answer(result);
}
