/* Deterministic composition rules. No network, DOM, model, or executable input. */
import {canonical,digest,domainName} from './execution-core.mjs';
export const SYNTHESIS_VERSION='1.0.0';
export const TECHNIQUES=Object.freeze({
  'app-trust':{name:'Trust after the transition',inputs:'Android association declarations + dated snapshots',question:'What app relationships are shared, changed, or still observed after an event?'},
  'document-lineage':{name:'Independent reports, shared ancestry?',inputs:'Document text + XMP lineage + template controls',question:'Do different documents carry both common lineage and non-template text?'},
  'operational-continuity':{name:'Different brands, shared operations?',inputs:'ads.txt + sellers.json + release histories + controls',question:'Does a declared sales relationship coincide with repeated uncommon release changes?'}
});
const KINDS=new Set(['assetlinks','ads-txt','sellers','release','document']);
const HEX=/^[a-f0-9]{64}$/i;
const fail=m=>{throw new Error(m);};
const list=(x,n=500)=>Array.isArray(x)&&x.length<=n?x:fail('Expected a bounded array.');
const str=(x,n=2048)=>typeof x==='string'&&x.length<=n?x:fail('Expected bounded text.');
export function timestamp(v){str(v,40);if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,19)!==v.slice(0,19))fail('Use a real UTC ISO timestamp, ending in Z.');return Date.parse(v);}
function source(v){str(v,2000);if(v.startsWith('local:'))return v;if(!/^https:\/\//.test(v))fail('Evidence source must be HTTPS or local:filename.');const u=new URL(v);if(u.username||u.password)fail('Do not include credentials in source URLs.');return v;}
export async function evidence(body){
  const clean={kind:body.kind,subject:body.subject,observedAt:body.observedAt,sourceUrl:body.sourceUrl,outcome:body.outcome??'ok',coverage:body.coverage??'unknown',role:body.role??'subject',payload:body.payload};
  validateBody(clean);const sha256=await digest(clean);return {...clean,id:'ev-'+sha256,sha256};
}
function validateBody(r){
  if(!r||typeof r!=='object'||Array.isArray(r)||!KINDS.has(r.kind))fail('Unknown evidence kind.');
  str(r.subject,253);if(!r.subject)fail('Evidence subject is required.');
  if(r.kind!=='document'&&domainName(r.subject)!==r.subject)fail('Evidence subjects must be normalized exact domains.');
  timestamp(r.observedAt);source(r.sourceUrl);
  if(!['ok','empty','error'].includes(r.outcome)||!['complete','partial','unknown'].includes(r.coverage)||!['subject','control'].includes(r.role))fail('Invalid outcome, coverage or role.');
  if(!r.payload||typeof r.payload!=='object'||Array.isArray(r.payload))fail('Evidence payload must be an object.');
  if(canonical(r.payload).length>300000)fail('One observation exceeds 300,000 characters.');
  if(r.outcome==='error')return;
  if(r.kind==='assetlinks')list(r.payload.statements,500);
  if(r.kind==='ads-txt')str(r.payload.text,200000);
  if(r.kind==='sellers')list(r.payload.sellers,2000);
  if(r.kind==='release'){
    if(!HEX.test(r.payload.signature)||r.payload.hashMethod!=='sha256:raw-bytes')fail('Release signatures must be SHA-256 of raw bytes.');
    str(r.payload.channel,100);if(!r.payload.channel||!['first-party','third-party','unknown'].includes(r.payload.scope)||typeof r.payload.commonDependency!=='boolean')fail('Release needs a channel, scope and commonDependency flag.');
  }
  if(r.kind==='document'){
    str(r.payload.text,100000);
    for(const k of ['documentId','originalDocumentId','instanceId'])if(r.payload[k]!=null)str(r.payload[k],256);
    for(const id of list(r.payload.derivedFrom??[],20))str(id,256);
    if(r.payload.fileSha256&&!HEX.test(r.payload.fileSha256))fail('Invalid original-file digest.');
  }
}
export async function verifyEvidence(r){
  validateBody(r);const {id,sha256,...body}=r;
  if(Object.keys(body).some(k=>!['kind','subject','observedAt','sourceUrl','outcome','coverage','role','payload'].includes(k)))fail('Unexpected evidence field.');
  if(!HEX.test(sha256)||id!=='ev-'+sha256||await digest(body)!==sha256)fail('Evidence checksum mismatch. Hashes do not authenticate a source.');
  return r;
}
function fingerprint(s){if(typeof s!=='string'||!(/^[a-fA-F0-9]{64}$/.test(s)||/^(?:[a-fA-F0-9]{2}:){31}[a-fA-F0-9]{2}$/.test(s)))return null;return s.replaceAll(':','').toUpperCase();}
export function parseAssetLinks(payload){
  const rows=[],warnings=[];let invalid=0;
  for(const s of list(payload.statements,500)){
    if(s?.include){warnings.push('An include statement was not expanded; absence comparisons are disabled.');invalid++;continue;}
    const t=s?.target;
    if(t?.namespace==='web')continue;
    if(t?.namespace!=='android_app'||typeof t.package_name!=='string'||!/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+$/.test(t.package_name)||!Array.isArray(s.relation)||!s.relation.length||s.relation.length>30||!Array.isArray(t.sha256_cert_fingerprints)||!t.sha256_cert_fingerprints.length||t.sha256_cert_fingerprints.length>20){invalid++;continue;}
    for(const relation of s.relation)for(const original of t.sha256_cert_fingerprints){
      const cert=fingerprint(original);
      if(!cert||typeof relation!=='string'||!/^[a-z0-9_.]+\/[a-z0-9_.]+$/.test(relation)){invalid++;continue;}
      if(rows.length>=1500)fail('Too many application declarations.');
      rows.push({package:t.package_name,certificate:cert,relation,key:canonical([t.package_name,cert,relation]),constrained:Boolean(s.relation_extensions)});
    }
  }
  if(invalid)warnings.push(invalid+' unsupported or malformed declaration elements; no negative inference from this file.');
  return {rows:[...new Map(rows.map(r=>[r.key,r])).values()],complete:invalid===0,warnings};
}
export function parseAds(text){
  str(text,200000);const accounts=[],owners=[],managers=[];let invalid=0;
  for(const raw of text.split(/\r?\n/)){
    const line=raw.split('#')[0].trim();if(!line)continue;
    if(line.includes('=')){
      const at=line.indexOf('='),name=line.slice(0,at).trim().toUpperCase(),parts=line.slice(at+1).trim().split(',').map(x=>x.trim());
      try{if(name==='OWNERDOMAIN')owners.push(domainName(parts[0]));if(name==='MANAGERDOMAIN'){
        const region=parts[1]||'';if(parts.length>2||region&&!/^[A-Z]{2}$/.test(region))throw Error();managers.push({domain:domainName(parts[0]),region});
      }}catch{invalid++;}continue;
    }
    const p=line.split(',').map(s=>s.trim());
    try{if(p.length<3||p.length>4||!p[1]||p[1].length>256||!['DIRECT','RESELLER'].includes(p[2].toUpperCase()))throw Error();
      const system=domainName(p[0]);accounts.push({system,sellerId:p[1],relationship:p[2].toUpperCase(),key:canonical([system,p[1]])});
    }catch{invalid++;}
  }
  return {accounts:[...new Map(accounts.map(a=>[a.key+'|'+a.relationship,a])).values()],owners:[...new Set(owners)],managers,invalid};
}
function pairs(items){const out=[];for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)out.push([items[i],items[j]]);return out;}
function latest(records){return [...records].sort((a,b)=>timestamp(a.observedAt)-timestamp(b.observedAt)).at(-1);}
function group(records,key){const m=new Map();for(const r of records){const k=key(r);if(!m.has(k))m.set(k,[]);m.get(k).push(r);}return m;}
function claim(rule,title,statement,refs,metrics,alternatives,limits){return {rule,title,statement,evidence:[...new Set(refs.map(r=>r.id))],metrics,alternatives,limits};}
function reject(rule,subjects,reason,refs=[]){return {rule,subjects,reason,evidence:[...new Set(refs.map(r=>r.id))]};}
function appTrust(records,context){
  const findings=[],rejected=[],warnings=[];const ok=records.filter(r=>r.kind==='assetlinks'&&r.outcome!=='error'&&r.role==='subject');
  const by=group(ok,r=>r.subject),last=[...by.values()].map(latest);if(by.size>8)fail('At most eight exact domains per app comparison.');
  const parsed=new Map(ok.map(r=>[r.id,parseAssetLinks(r.payload)]));for(const r of ok)for(const w of parsed.get(r.id).warnings)warnings.push(r.subject+': '+w);
  for(const [a,b] of pairs(last)){
    if(Math.abs(timestamp(a.observedAt)-timestamp(b.observedAt))>86400000){rejected.push(reject('A1',[a.subject,b.subject],'Observations are more than 24 hours apart; no current-overlap assertion.',[a,b]));continue;}
    const ar=parsed.get(a.id).rows,br=parsed.get(b.id).rows,shared=ar.filter(x=>br.some(y=>x.key===y.key));
    if(shared.length)findings.push(claim('A1','Exact application identity overlap',a.subject+' and '+b.subject+' declare '+shared.length+' matching package, signing-fingerprint and relation tuples in these observations.',[a,b],{shared},['An intentionally shared application or service','A transitional or stale declaration'],['Website declarations alone do not verify app-side entitlements, effective permissions or legal ownership.','Path/extension constraints may differ; tuple overlap is not equivalent authorization scope.']));
    else rejected.push(reject('A1',[a.subject,b.subject],ar.some(x=>br.some(y=>x.package===y.package))?'Package name overlap exists but the full signing-identity/relation tuple does not match.':'No exact application identity overlap in the supplied records. This is not evidence of unrelated ownership.',[a,b]));
  }
  for(const [subject,history]of by){
    if(history.length<2)continue;const sorted=[...history].sort((a,b)=>timestamp(a.observedAt)-timestamp(b.observedAt)),a=sorted[0],b=sorted.at(-1);
    const ar=parsed.get(a.id),br=parsed.get(b.id),retained=ar.rows.filter(x=>br.rows.some(y=>x.key===y.key));
    const added=br.rows.filter(x=>!ar.rows.some(y=>x.key===y.key)),missing=ar.rows.filter(x=>!br.rows.some(y=>x.key===y.key));
    const bracket=context.event&&timestamp(a.observedAt)<timestamp(context.event.at)&&timestamp(context.event.at)<timestamp(b.observedAt);
    if(retained.length)findings.push(claim('A2',bracket?'Declaration observed on both sides of the supplied event':'Declaration retained across two observations',subject+' has '+retained.length+' identical declaration tuples in the earliest and latest supplied snapshots.',[a,b],{before:a.observedAt,after:b.observedAt,retained,eventContext:bracket?context.event:null},['An intended transition arrangement','A stale declaration','Removal and later reappearance between observations'],['This does not establish continuous persistence between captures.','Event context is investigator-supplied and not independently verified.']));
    if(added.length||missing.length){
      const canCompare=a.coverage==='complete'&&b.coverage==='complete'&&ar.complete&&br.complete;
      if(canCompare)findings.push(claim('A3','Declaration-set difference',subject+': '+added.length+' tuples appear only in the later snapshot; '+missing.length+' only in the earlier snapshot.',[a,b],{added,missing,before:a.observedAt,after:b.observedAt},['Normal key rotation or application migration','Collection-specific variation'],['An absent tuple is not proof of revoked or exploitable access.','An observation timestamp is not the time of the actual change.']));
      else rejected.push(reject('A3',[subject],'At least one snapshot has incomplete/unknown coverage; added or removed declarations cannot be established.',[a,b]));
    }
    if(context.event&&!bracket)warnings.push(subject+': available snapshots do not bracket the supplied event; no post-event persistence conclusion.');
  }
  return {findings,rejected,warnings,eligible:ok.length};
}
function shingles(text){const words=str(text,100000).normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];const out=new Set();for(let i=0;i+4<words.length;i++)out.add(words.slice(i,i+5).join(' '));return out;}
function lineages(p){return new Set([p.documentId,p.originalDocumentId,...(p.derivedFrom||[])].filter(v=>typeof v==='string'&&v.trim()).map(v=>v.trim()));}
function documentLineage(records){
  const docs=records.filter(r=>r.kind==='document'&&r.outcome==='ok'),subjects=docs.filter(r=>r.role==='subject'),controls=docs.filter(r=>r.role==='control');
  if(docs.length>16)fail('Document analysis is limited to 16 files.');
  const sets=new Map(docs.map(r=>[r.id,shingles(r.payload.text)])),frequency=new Map();
  for(const s of sets.values())for(const sh of s)frequency.set(sh,(frequency.get(sh)||0)+1);
  const boilerplate=new Set(controls.flatMap(r=>[...sets.get(r.id)]));
  if(subjects.length>=3)for(const [sh,n]of frequency)if(n>=Math.max(3,Math.ceil(subjects.length*0.8)))boilerplate.add(sh);
  const commonIds=new Set(controls.flatMap(r=>[...lineages(r.payload)]));
  const findings=[],rejected=[];
  for(const [a,b]of pairs(subjects)){
    const lhs=new Set([...sets.get(a.id)].filter(s=>!boilerplate.has(s))),rhs=new Set([...sets.get(b.id)].filter(s=>!boilerplate.has(s)));
    const shared=[...lhs].filter(s=>rhs.has(s)),denom=Math.min(lhs.size,rhs.size),containment=denom?shared.length/denom:0;
    const ids=[...lineages(a.payload)].filter(s=>lineages(b.payload).has(s)&&!commonIds.has(s));
    const duplicate=a.payload.fileSha256&&a.payload.fileSha256===b.payload.fileSha256;
    if(duplicate){findings.push(claim('D0','Identical artifact digest',a.subject+' and '+b.subject+' have the same supplied original-file SHA-256.',[a,b],{sha256:a.payload.fileSha256},['The same file distributed twice'],['This is duplicate detection, not evidence of a new relationship or independent corroboration.','Imported file digests are claims unless the original bytes were hashed locally.']));continue;}
    if(ids.length&&shared.length>=6&&containment>=0.25)findings.push(claim('D1','Common lineage supported by non-template text',a.subject+' and '+b.subject+' share lineage identifiers and '+shared.length+' five-word sequences outside the supplied template controls.',[a,b,...controls],{lineageIds:ids,sharedShingles:shared.length,containment:Number(containment.toFixed(4)),textSamples:shared.slice(0,6),controlCount:controls.length},['A licensed source document or shared production vendor','An earlier common source rather than direct copying','Copied or editable metadata'],['This does not establish authorship, direction of copying, misconduct or independent witnesses.','No controls means common-template rejection is weaker. Thresholds are experimental, not calibrated probabilities.']));
    else rejected.push(reject('D1',[a.subject,b.subject],ids.length?'Lineage metadata alone is insufficient: non-template text support is below the rule threshold.':shared.length>=6?'Text reuse alone does not establish document ancestry: no non-control lineage identifier matches.':'No combined lineage-and-distinctive-text support; template/common text is excluded.',[a,b,...controls]));
  }
  return {findings,rejected,warnings:controls.length?[]:['No template-control documents supplied. Shared boilerplate remains a confounder.'],eligible:subjects.length};
}
function transitions(records){
  const result=[];
  for(const [channel,rs]of group(records.filter(r=>r.kind==='release'&&r.outcome==='ok'&&r.payload.scope==='first-party'&&!r.payload.commonDependency),r=>canonical([r.subject,r.payload.channel]))){
    const sorted=[...rs].sort((a,b)=>timestamp(a.observedAt)-timestamp(b.observedAt));
    for(let i=1;i<sorted.length;i++){
      const a=sorted[i-1],b=sorted[i];if(a.payload.signature===b.payload.signature)continue;
      if(timestamp(b.observedAt)-timestamp(a.observedAt)>7*86400000)continue;
      result.push({channel,from:a.payload.signature.toLowerCase(),to:b.payload.signature.toLowerCase(),start:timestamp(a.observedAt),end:timestamp(b.observedAt),refs:[a,b]});
    }
  }return result;
}
function operational(records){
  const findings=[],rejected=[],warnings=[];const ads=records.filter(r=>r.kind==='ads-txt'&&r.outcome==='ok'&&r.role==='subject'),latestAds=[...group(ads,r=>r.subject).values()].map(latest);
  const controls=records.filter(r=>r.role==='control'),controlsTransitions=transitions(controls);
  for(const [a,b]of pairs(latestAds)){
    if(Math.abs(timestamp(a.observedAt)-timestamp(b.observedAt))>14*86400000){rejected.push(reject('O1',[a.subject,b.subject],'Advertising declarations are over 14 days apart.',[a,b]));continue;}
    const pa=parseAds(a.payload.text),pb=parseAds(b.payload.text);if(pa.invalid||pb.invalid)warnings.push('Malformed ads.txt lines were excluded from '+a.subject+' / '+b.subject+'.');
    const managers=pa.managers.filter(x=>pb.managers.some(y=>x.domain===y.domain&&x.region===y.region));
    const accounts=pa.accounts.filter(x=>pb.accounts.some(y=>x.key===y.key));
    const sellerMatches=[];
    for(const account of accounts){
      const sr=latest(records.filter(r=>r.kind==='sellers'&&r.subject===account.system&&r.outcome==='ok'&&Math.abs(timestamp(r.observedAt)-timestamp(a.observedAt))<=14*86400000&&Math.abs(timestamp(r.observedAt)-timestamp(b.observedAt))<=14*86400000));
      if(!sr)continue;
      const matches=sr.payload.sellers.filter(s=>s&&typeof s.seller_id==='string'&&s.seller_id===account.sellerId);
      if(matches.length!==1)continue;const seller=matches[0];
      if(seller.is_confidential===1||seller.is_confidential===true||seller.is_confidential==='1'||!['PUBLISHER','INTERMEDIARY','BOTH'].includes(seller.seller_type))continue;
      let domain;try{domain=domainName(seller.domain);}catch{continue;}
      sellerMatches.push({system:account.system,sellerId:account.sellerId,sellerDomain:domain,sellerType:seller.seller_type,record:sr});
    }
    const ta=transitions(records.filter(r=>r.subject===a.subject&&r.role==='subject')),tb=transitions(records.filter(r=>r.subject===b.subject&&r.role==='subject'));
    const matches=[];
    for(const x of ta){const y=tb.find(y=>x.from===y.from&&x.to===y.to&&Math.max(x.start,y.start)<Math.min(x.end,y.end));
      if(!y)continue;
      if(controlsTransitions.some(z=>z.from===x.from&&z.to===x.to)){rejected.push(reject('O-control',[a.subject,b.subject],'A matching transition also appears in a control; it is not distinctive.',[...x.refs,...y.refs,...controls]));continue;}
      if(matches.some(m=>m.from===x.from&&m.to===x.to))continue;
      matches.push({from:x.from,to:x.to,start:Math.max(x.start,y.start),end:Math.min(x.end,y.end),refs:[...x.refs,...y.refs]});
    }
    // Two chronologically non-overlapping, distinct transitions, not two asset files from one release.
    const ordered=matches.sort((x,y)=>x.end-y.end),independent=[];for(const m of ordered)if(!independent.length||m.start>=independent.at(-1).end)independent.push(m);
    const recent=independent.filter(m=>Math.abs(timestamp(a.observedAt)-m.end)<=90*86400000&&Math.abs(timestamp(b.observedAt)-m.end)<=90*86400000);
    const supportedSales=managers.length||sellerMatches.length;
    if(supportedSales&&recent.length>=2&&controlsTransitions.length>0){
      findings.push(claim('O1','Shared operational-process hypothesis',a.subject+' and '+b.subject+' combine a declared sales relationship with '+recent.length+' distinct, overlapping release-change windows not seen in the supplied controls.',[a,b,...sellerMatches.map(s=>s.record),...recent.flatMap(m=>m.refs),...controls],{managers,sellers:sellerMatches.map(({record,...s})=>s),transitions:recent.map(({refs,...m})=>({...m,start:new Date(m.start).toISOString(),end:new Date(m.end).toISOString()})),controlCount:controls.length},['A shared agency or technology supplier','A legitimate commercial collaboration','Unobserved common upstream automation'],['This supports a hypothesis of shared operations, not common ownership, intent or actual revenue flows.','First-party classification is supplied, not independently certified. Controls do not establish global rarity.','Crawl windows bound changes; they do not provide exact deployment times.']));
    }else rejected.push(reject('O1',[a.subject,b.subject],!supportedSales?'No matching scoped manager or uniquely resolved seller account.':recent.length<2?'Sales overlap exists, but fewer than two distinctive time-aligned release transitions support it.':'No release control supplied; a shared library/template cannot be excluded.',[a,b,...sellerMatches.map(s=>s.record)]));
  }
  return {findings,rejected,warnings,eligible:latestAds.length};
}
export async function analyze(input){
  if(!input||input.schemaVersion!==1||!Object.hasOwn(TECHNIQUES,input.technique))fail('Unsupported synthesis input.');
  const records=list(input.observations,160),context=input.context??{};
  if(canonical(input).length>2*1024*1024)fail('Evidence set exceeds 2 MiB.');
  if(context.event){timestamp(context.event.at);str(context.event.label,200);source(context.event.reference);}
  const unique=new Map(),slots=new Map();
  for(const r of records){await verifyEvidence(r);if(unique.has(r.id))continue;
    const slot=canonical([r.kind,r.subject,r.observedAt,r.kind==='release'?r.payload.channel:'']);
    if(slots.has(slot))fail('Conflicting observations share the same subject, kind and timestamp.');slots.set(slot,r.id);unique.set(r.id,r);
  }
  const observations=[...unique.values()];
  const result=input.technique==='app-trust'?appTrust(observations,context):input.technique==='document-lineage'?documentLineage(observations):operational(observations);
  const failed=observations.filter(r=>r.outcome==='error');
  const report={schemaVersion:1,engine:SYNTHESIS_VERSION,technique:input.technique,createdAt:new Date().toISOString(),dataset:input.fixture===true?'synthetic-fixture':'supplied-observations',status:result.findings.length?'findings':result.eligible<2?'insufficient-evidence':'no-supported-finding',inputDigest:await digest({technique:input.technique,observations,context}),...result,
    coverage:{total:observations.length,failed:failed.length,controls:observations.filter(r=>r.role==='control').length},
    boundary:'Deterministic experimental rules over supplied observations. Integrity hashes are not authenticity, confidence probabilities or a claim of globally novel intelligence.',
    context,observations};
  for(const r of failed)report.warnings.push(r.subject+': collection failed; no absence inference was made.');
  return {...report,sha256:await digest(report)};
}
export async function verifyReport(report){const{sha256,...body}=report;if(await digest(body)!==sha256)fail('Report checksum mismatch.');const fresh=await analyze({schemaVersion:1,technique:report.technique,observations:report.observations,context:report.context,fixture:report.dataset==='synthetic-fixture'});for(const k of ['status','findings','rejected','warnings','inputDigest'])if(canonical(fresh[k])!==canonical(report[k]))fail('Report does not match the current rules.');return fresh;}
export function markdown(report){
  const clean=s=>String(s).replace(/[\r\n]/g,' ').replace(/[<>]/g,'');
  return ['# Snail OSINT / Synthesis report','',`Technique: ${TECHNIQUES[report.technique].name}`,`Rule version: ${report.engine}`,`Dataset: ${report.dataset}`,`Status: ${report.status}`,`Input digest: ${report.inputDigest}`,'',report.boundary,'','## Supported outputs',...report.findings.flatMap(f=>['',`### ${f.title}`,clean(f.statement),`Rule: ${f.rule}`,`Evidence: ${f.evidence.join(', ')}`,'','Limits: '+f.limits.map(clean).join(' '),'Alternatives: '+f.alternatives.map(clean).join('; ')]),'','## Rejected connections',...report.rejected.map(r=>`${r.rule} | ${r.subjects.map(clean).join(' / ')} | ${clean(r.reason)}`),'','## Coverage and warnings',...report.warnings.map(clean),'','## Evidence provenance',...report.observations.map(r=>`${r.id} | ${clean(r.subject)} | ${r.observedAt} | ${r.outcome} | ${clean(r.sourceUrl)}`),'','Unsigned report checksum: '+report.sha256].join('\n');
}
