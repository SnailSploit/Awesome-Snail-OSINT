#!/usr/bin/env node
/* Bounded, local-first specialist pipeline. Imports never initiate third-party lookups. */
import {readFile,writeFile,lstat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {aggregate,telegramRecords,shodanRecords,hunterRecords,gitleaksRecords,jarRecords,extract} from '../pipeline/core.mjs';

const SCRIPT_DIR=dirname(fileURLToPath(import.meta.url));
const HELP=`Snail OSINT tool pipeline (Node 22+, Python 3 for JAR inspection)
  --telegram-public FILE @channel   Import Telegram Desktop public-channel export
  --telegram-bot FILE @bot FROM_ID  Import only the bot sender's replies (unverified)
  --jar FILE                        Static JAR inspection; never executes code
  --shodan-json FILE                Import Shodan API search JSON
  --hunter-json FILE                Import Hunter domain-search JSON
  --gitleaks-json FILE              Import redacted Gitleaks findings (no secret values)
  --investigation FILE              Import an integrity-verified Atlas evidence bundle
  --live-domain DOMAIN              Use the existing bounded DNS/RDAP/routing runner
  --live-mail DOMAIN                Use the existing bounded mail DNS runner
  --live-ip IP                      Use the existing bounded IP/RDAP/routing runner
  --confirm-scope                   Mandatory for live network lookups
  --list-tools                      Print the current specialist adapter registry
  --out FILE                        Save local JSON, fail if file already exists

To collect public channel posts (optional local Telethon client):
  TG_API_ID=... TG_API_HASH=... python3 scripts/telegram_public.py --channel @publicname --limit 50 --out channel.json --confirm-public
`;
function parse(argv){
  const tasks=[];let out=null,confirm=false;
  for(let i=0;i<argv.length;i++){
    const a=argv[i];if(a==='--help')return {help:true};
    if(a==='--list-tools')return {list:true};
    if(a==='--confirm-scope'){confirm=true;continue;}
    if(a==='--out'){out=argv[++i];if(!out)throw Error('--out requires a path');continue;}
    const kinds={'--telegram-public':'telegram-public','--telegram-bot':'telegram-bot','--jar':'jar','--shodan-json':'shodan','--hunter-json':'hunter','--gitleaks-json':'gitleaks','--investigation':'investigation',
      '--live-domain':'domain','--live-ip':'ip','--live-mail':'mail'};
    if(!kinds[a])throw Error('Unknown option '+a+'\n'+HELP);
    const value=argv[++i];if(!value||value.startsWith('--'))throw Error(a+' requires a value');
    const task={kind:kinds[a],value};
    if(a.startsWith('--telegram-')){task.handle=argv[++i];if(!task.handle||task.handle.startsWith('--'))throw Error('Telegram import needs @channel or @bot');
      if(a==='--telegram-bot'){task.senderId=argv[++i];if(!task.senderId||task.senderId.startsWith('--'))throw Error('Telegram bot import needs FROM_ID from the export.');}}
    tasks.push(task);
  }
  if(!out||!tasks.length)throw Error('Provide at least one tool input and --out.\n'+HELP);
  if(tasks.some(t=>['domain','ip','mail'].includes(t.kind))&&!confirm)throw Error('Live lookups require --confirm-scope.');
  if(tasks.length>20)throw Error('Maximum 20 sources per run.');
  return {tasks,out,confirm};
}
async function readJson(name){const bytes=await readFile(name);if(bytes.length>8_000_000)throw Error('Imported JSON exceeds 8MB');return JSON.parse(bytes.toString('utf8'));}
async function importAtlas(path){
  const {verifyBundle,graphFor}=await import('../site/execution-core.mjs');
  const bundle=await readJson(path),run=await verifyBundle(bundle),g=graphFor(run);
  const records=[];
  for(const e of g.edges){
    for(const oid of e.evidence){
      const o=run.observations.find(o=>o.id===oid);
      if(!o||o.status!=='ok')continue;
      const url=o.requests.find(q=>typeof q.url==='string')?.url||null;
      const upstream=url?new URL(url).hostname:'unknown-atlas-provider';
      const src={tool:'atlas-evidence-bundle',upstream,recordId:o.id,sourceUrl:url,observedAt:null,collectionMode:'verified-local-import',
        caveat:'Provider capture verified for local integrity, not source authenticity. Observation time '+o.collectedAt};
      for(const nodeId of [e.from,e.to]){
        const n=g.nodes.find(n=>n.id===nodeId);if(n&&['ip','domain','asn'].includes(n.type))records.push(...extract(n.label,src));
      }
    }
  }
  return records;
}
async function runTask(task){
  if(task.kind==='telegram-public')return telegramRecords(await readJson(task.value),{handle:task.handle,mode:'public'});
  if(task.kind==='telegram-bot')return telegramRecords(await readJson(task.value),{handle:task.handle,mode:'bot',senderId:task.senderId});
  if(task.kind==='shodan')return shodanRecords(await readJson(task.value));
  if(task.kind==='hunter')return hunterRecords(await readJson(task.value));
  if(task.kind==='gitleaks')return gitleaksRecords(await readJson(task.value));
  if(task.kind==='investigation')return importAtlas(task.value);
  if(task.kind==='jar'){
    const p=spawnSync('python3',[resolve(SCRIPT_DIR,'inspect_jar.py'),task.value],{encoding:'utf8',timeout:12000,maxBuffer:1500000});
    if(p.error||p.status!==0)throw Error('JAR inspector: '+(p.error?.message||p.stderr||'failed').slice(0,300));
    return jarRecords(JSON.parse(p.stdout));
  }
  const {execute}=await import('../server/engine.mjs');
  const {bundleFor}=await import('../site/execution-core.mjs');
  const run=await execute({workflow:task.kind,target:task.value,consent:true},async()=>{});
  return importAtlasBundle(await bundleFor(run));
}
async function importAtlasBundle(bundle){
  // Reuse the same verification path for fresh live results and imported bundles.
  const {verifyBundle,graphFor}=await import('../site/execution-core.mjs');
  const run=await verifyBundle(bundle),g=graphFor(run),out=[];
  for(const o of run.observations){
    if(o.status!=='ok')continue;
    const origin=o.requests?.find(x=>x.url)?.url||null;
    const src={tool:'atlas-live-runner',upstream:origin?new URL(origin).hostname:'atlas',recordId:o.id,sourceUrl:origin,
      observedAt:null,collectionMode:'provider-query',caveat:'Collected '+o.collectedAt+'; provider time is not necessarily event time.'};
    for(const e of g.edges.filter(e=>e.evidence.includes(o.id))){
      for(const n of g.nodes.filter(n=>n.id===e.from||n.id===e.to)){
        if(['domain','ip','asn'].includes(n.type))out.push(...extract(n.label,src));
      }
    }
  }
  return out;
}
export async function main(argv=process.argv.slice(2)){
  const args=parse(argv);if(args.help){console.log(HELP);return 0;}
  if(args.list){console.log(await readFile(resolve(SCRIPT_DIR,'../pipeline/registry.json'),'utf8'));return 0;}
  const records=[],runs=[];
  for(const task of args.tasks){
    try{const rows=await runTask(task);records.push(...rows);runs.push({tool:task.kind,status:'ok',observations:rows.length});}
    catch(e){runs.push({tool:task.kind,status:'error',error:String(e.message).slice(0,240)});}
  }
  const report={...aggregate(records),runs};
  // No raw Telegram messages, credential values or Gitleaks matches in the output.
  const dest=resolve(args.out);
  try{await lstat(dest);throw Error('Refusing to overwrite existing output');}
  catch(e){if(e.code!=='ENOENT')throw e;}
  await writeFile(dest,JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});
  console.log(JSON.stringify({file:dest,tools:runs.length,failures:runs.filter(x=>x.status==='error').length,...report.stats}));
  return runs.some(x=>x.status==='error')?1:0;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().then(code=>{process.exitCode=code;}).catch(e=>{console.error(e.message);process.exitCode=1;});
}
