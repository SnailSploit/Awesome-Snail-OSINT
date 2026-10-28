/* Live execution workspace. Targets remain out of URLs and storage unless explicitly saved. */
import {WORKFLOWS,ENGINE_VERSION,requestSpec,verifyObservation,terminalStatus,graphFor,bundleFor,verifyBundle,markdownFor} from './execution-core.mjs';
let root,run=null,controller=null,running=false,selected=null,imported=false;
let form,results,notice,workflow,target,consent,runButton,stopButton,savedList;
const $=(q)=>root.querySelector(q);
function el(tag,attrs={},...children){const n=document.createElement(tag);for(const [k,v]of Object.entries(attrs)){if(k==='class')n.className=v;else if(k==='onClick')n.addEventListener('click',v);else if(k==='onChange')n.addEventListener('change',v);else if(k==='checked')n.checked=v;else if(k==='disabled')n.disabled=v;else n.setAttribute(k,String(v));}for(const c of children.flat(Infinity))if(c!==null&&c!==undefined)n.append(c instanceof Node?c:document.createTextNode(String(c)));return n;}
function message(text,error=false){notice.textContent=text;notice.className='run-notice'+(error?' error':'');}
function download(name,body,type){const url=URL.createObjectURL(new Blob([body],{type})),a=el('a',{href:url,download:name});a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function link(url){try{const u=new URL(url);if(u.protocol==='https:'&&!u.username&&!u.password)return el('a',{href:u.href,target:'_blank',rel:'noopener noreferrer'},u.hostname+' / source response');}catch{}return el('span',{},'Source URL unavailable');}
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open('snail-investigations-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('runs',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function store(action,key,value){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('runs',action==='get'||action==='getAll'?'readonly':'readwrite'),s=tx.objectStore('runs');const r=action==='put'?s.put(value):action==='getAll'?s.getAll():s[action](key);let output;r.onsuccess=()=>{output=r.result;};tx.oncomplete=()=>{d.close();resolve(output);};tx.onerror=()=>{d.close();reject(tx.error);};});}
async function listSaved(){
  try{const all=(await store('getAll')).sort((a,b)=>b.savedAt.localeCompare(a.savedAt));savedList.replaceChildren(...all.map(item=>el('div',{class:'saved-run'},el('button',{class:'textbutton',onClick:async()=>{if(running)return;try{run=await verifyBundle(item.bundle);imported=true;selected=null;renderResults();message('Saved snapshot loaded. Integrity checked locally; this is not a new lookup or an authenticity guarantee.');}catch(e){message(e.message,true);}}},item.target+' / '+item.workflow+' / '+new Date(item.savedAt).toLocaleString()),el('button',{'aria-label':'Delete saved run '+item.target,onClick:async()=>{await store('delete',item.id);await listSaved();}},'Delete'))),!all.length?el('p',{class:'muted'},'No saved investigations on this browser.'):null);}catch{savedList.replaceChildren(el('p',{class:'muted'},'Local storage unavailable. JSON exports still work.'));}
}
async function save(){try{const all=await store('getAll');if(all.length>=20&&!all.some(x=>x.id===run.id))throw new Error('20 saved snapshots reached. Delete one or export instead.');const bundle=await bundleFor(run);await store('put',null,{id:run.id,target:run.target,workflow:run.workflow,savedAt:new Date().toISOString(),bundle});await listSaved();message('Snapshot saved on this browser only. It is not encrypted; use Delete to remove it.');}catch(e){message('Could not save: '+e.message,true);}}
function svgNode(tag,attrs={},text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text)n.textContent=text;return n;}
function graphView(g){
  const host=el('div',{class:'run-graph-wrap'}),svg=svgNode('svg',{class:'run-graph',role:'img','aria-label':'Observed relationship graph. Use the relationship table below for a keyboard-accessible equivalent.'});
  const shown=g.nodes.slice(0,30),positions=new Map(),cols=[[],[],[],[]];
  for(const n of shown){let col=n.id===g.root?0:['prefix','allocation','registration'].includes(n.type)?2:n.type==='asn'?3:1;cols[col].push(n);}
  const height=Math.max(340,...cols.map(c=>c.length*68+70));svg.setAttribute('viewBox',`0 0 1080 ${height}`);
  cols.forEach((nodes,i)=>nodes.forEach((n,j)=>positions.set(n.id,{x:20+i*270,y:40+j*68+(i===0?(height-140)/2:0)})));
  for(const e of g.edges){const a=positions.get(e.from),b=positions.get(e.to);if(!a||!b)continue;const path=svgNode('path',{d:`M${a.x+228} ${a.y+23} C${a.x+258} ${a.y+23},${b.x-30} ${b.y+23},${b.x} ${b.y+23}`,class:'run-edge'+(selected&&e.evidence.includes(selected)?' selected':''),'data-relation':e.relation});path.append(svgNode('title',{},e.relation));path.addEventListener('click',()=>{selected=e.evidence[0];renderResults();});svg.append(path);}
  for(const n of shown){const p=positions.get(n.id),group=svgNode('g',{transform:`translate(${p.x},${p.y})`,class:'run-node '+(n.id===g.root?'root-node':''),'data-node':n.type});group.append(svgNode('rect',{width:228,height:48,rx:9}),svgNode('text',{x:12,y:16,class:'run-node-type'},n.type.toUpperCase()),svgNode('text',{x:12,y:35},n.label.length>27?n.label.slice(0,24)+'...':n.label),svgNode('title',{},n.label));svg.append(group);}
  host.append(svg);if(g.nodes.length>30)host.append(el('p',{class:'reviewnote'},'Graph preview shows 30 nodes. The JSON export contains every derived relationship.'));return host;
}
function inspect(o){
  return el('section',{class:'run-inspector',id:'runEvidenceDetail'},el('p',{class:'eyebrow'},'OBSERVATION / '+o.status.toUpperCase()),el('h3',{},o.stepId),el('p',{},o.note),el('dl',{class:'run-metadata'},el('dt',{},'Observed subject'),el('dd',{},o.subject),el('dt',{},'Collected (server clock)'),el('dd',{},o.collectedAt),el('dt',{},'Integrity SHA-256'),el('dd',{class:'run-hash'},o.sha256)),...o.requests.map(q=>el('p',{},link(q.url),' / HTTP '+q.status+' / '+q.receivedAt)),el('details',{},el('summary',{},'Inspect captured record projection'),el('pre',{},JSON.stringify(o.payload,null,2))),el('p',{class:'reviewnote'},'This digest covers the normalized observation and provenance metadata, not a signed source statement. Provider contacts and full raw responses are not retained.'));
}
function renderResults(){
  if(!run){results.replaceChildren(el('div',{class:'run-idle'},el('span',{class:'eyebrow'},'NOT A DEMO'),el('h3',{},'Your first evidence trail starts here.'),el('p',{},'Choose a workflow and a public domain or IP. The graph is built only after source responses arrive. Nothing runs on page load.')));return;}
  const g=graphFor(run),done=run.observations.length,fail=run.observations.filter(o=>!['ok','empty'].includes(o.status)).length;
  const tools=el('div',{class:'run-export'});
  for(const [label,action]of [['Export evidence JSON',async()=>download('snail-'+run.id+'.json',JSON.stringify(await bundleFor(run),null,2),'application/json')],['Export report Markdown',async()=>download('snail-'+run.id+'.md',markdownFor(run),'text/markdown')],['Save on this browser',save]])tools.append(el('button',{class:'secondary',disabled:running,onClick:()=>action().catch(e=>message(e.message,true))},label));
  const head=el('div',{class:'run-result-head'},el('div',{},el('p',{class:'eyebrow'},(imported?'SAVED / IMPORTED SNAPSHOT':'EXECUTED PUBLIC-SOURCE WORKFLOW')),el('h3',{},run.target),el('p',{class:'reviewnote'},run.id)),el('span',{class:'run-status '+run.status,id:'runStatus'},run.status));
  const ledger=el('div',{class:'run-ledger',role:'list','aria-label':'Captured observations'},...run.observations.map(o=>el('button',{class:'run-observation'+(selected===o.id?' selected':''),role:'listitem','data-status':o.status,onClick:()=>{selected=o.id;renderResults();}},el('span',{class:'run-dot '+o.status}),el('strong',{},o.stepId),el('span',{},o.status),el('small',{},o.subject))));
  const relationRows=g.edges.slice(0,120).map(e=>el('tr',{},el('td',{},g.nodes.find(n=>n.id===e.from)?.label),el('td',{},el('button',{class:'textbutton',onClick:()=>{selected=e.evidence[0];renderResults();}},e.relation)),el('td',{},g.nodes.find(n=>n.id===e.to)?.label),el('td',{},e.evidence.length+' observation'+(e.evidence.length>1?'s':''))));
  const chosen=run.observations.find(o=>o.id===selected)||run.observations.at(-1);
  results.replaceChildren(head,el('div',{class:'run-counts'},el('span',{},el('strong',{},done),' observations'),el('span',{},el('strong',{},g.edges.length),' relationships'),el('span',{},el('strong',{},fail),' incomplete lookups')),el('p',{class:'caution'},imported?'Loaded evidence is locally integrity-checked, not authenticated. It has not been fetched again.':g.meaning),tools,el('div',{class:'run-split'},el('section',{},el('h3',{},'Collection journal'),ledger),el('section',{},el('h3',{},'Evidence-linked relationships'),graphView(g))),g.edges.length?el('details',{class:'run-relations'},el('summary',{},'Read '+g.edges.length+' relationships as a table'),el('div',{class:'run-table-scroll'},el('table',{},el('thead',{},el('tr',{},...['From','Observed relationship','To','Support'].map(s=>el('th',{},s)))),el('tbody',{},...relationRows)))):null,chosen?inspect(chosen):null,el('p',{class:'reviewnote'},'Completed means scheduled lookups finished, not that a vulnerability or ownership claim was proved. Empty results and failed requests are recorded separately.'));
}
async function start(){
  let spec;try{spec=requestSpec({workflow:workflow.value,target:target.value,consent:consent.checked});}catch(e){message(e.message,true);return;}
  controller=new AbortController();running=true;run=null;imported=false;selected=null;runButton.disabled=true;stopButton.disabled=false;workflow.disabled=true;target.disabled=true;message('Connecting to the bounded research executor...');renderResults();
  const started=Date.now(),timeout=setTimeout(()=>controller.abort('timeout'),45000);let complete=false,seq=0,bytes=0;
  try{
    const response=await fetch('./api/investigate',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(spec),signal:controller.signal});
    if(!response.ok){let error;try{error=(await response.json()).error;}catch{}throw new Error(error||'Executor unavailable (HTTP '+response.status+').');}
    if(!response.headers.get('content-type')?.includes('application/x-ndjson'))throw new Error('This host has no live execution backend. Use the Cloudflare deployment or the documented local server.');
    const reader=response.body.getReader(),decoder=new TextDecoder();let pending='';
    try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>3*1024*1024)throw new Error('Stream size limit exceeded.');pending+=decoder.decode(value,{stream:true});let newline;
      while((newline=pending.indexOf('\n'))>=0){const line=pending.slice(0,newline);pending=pending.slice(newline+1);if(!line)continue;const e=JSON.parse(line);if(e.sequence!==seq++)throw new Error('Missing or reordered execution event.');
        if(e.type==='start'){
          if(run||e.run?.workflow!==spec.workflow||e.run?.target!==spec.target||e.run?.version!==ENGINE_VERSION||typeof e.run?.id!=='string')throw new Error('Executor returned the wrong run.');
          run={...e.run,observations:[],journal:[]};
        }
        if(!run)throw new Error('Execution started without a run envelope.');
        if(e.type==='observation'){
          await verifyObservation(e.observation,run.id);
          if(run.observations.length>=12||run.observations.some(o=>o.stepId===e.observation.stepId))throw new Error('Unexpected or duplicate observation.');
          run.observations.push(e.observation);renderResults();
        }else if(e.type==='step')message('Collecting '+e.step.label+'...');
        else if(e.type==='plan')message(e.note);
        else if(e.type==='fatal')throw new Error(e.message);
        else if(e.type==='finish'){
          if(!['completed','partial','failed','cancelled'].includes(e.status)||e.observationCount!==run.observations.length||e.status!==terminalStatus(run.observations,e.status==='cancelled'))throw new Error('Invalid completion verdict.');
          run.status=e.status;run.finishedAt=e.finishedAt;run.providerRequests=e.providerRequests;complete=true;
        }
        run.journal.push({sequence:e.sequence,at:e.at,type:e.type,stepId:e.step?.id||e.observation?.stepId||null,observationId:e.observation?.id||null});
      }
    }}finally{try{await reader.cancel();}catch{}}
    if(!complete||pending.trim())throw new Error('Stream ended before a validated completion event.');
    message('Run '+run.status+'. '+run.observations.length+' observations captured in '+Math.round((Date.now()-started)/1000)+'s. Select a relationship to inspect its evidence.');
  }catch(e){
    if(run){run.status=controller.signal.aborted?'cancelled':'interrupted';run.finishedAt=new Date().toISOString();}
    message(controller.signal.aborted?'Run stopped. Already received observations remain available for export.':'Run interrupted: '+e.message,true);
  }finally{clearTimeout(timeout);running=false;runButton.disabled=false;stopButton.disabled=true;workflow.disabled=false;target.disabled=false;renderResults();}
}
export function mountInvestigation(container){
  if(root){container.replaceChildren(root);return;}
  root=el('div',{class:'execution-workspace'});
  workflow=el('select',{id:'runWorkflow','aria-label':'Investigation workflow'},...Object.entries(WORKFLOWS).map(([k,v])=>el('option',{value:k},v.name)));
  target=el('input',{id:'runTarget',type:'text',autocomplete:'off',spellcheck:'false',maxlength:253,placeholder:'snailsploit.com','aria-label':'Public domain or IP'});
  consent=el('input',{id:'runConsent',type:'checkbox'});
  notice=el('p',{class:'run-notice',id:'runNotice',role:'status','aria-live':'polite'},'Ready. No provider queries have been sent.');
  runButton=el('button',{class:'primary',type:'submit',id:'runExecute'},'Run investigation');stopButton=el('button',{class:'secondary',type:'button',id:'runStop',disabled:true,onClick:()=>controller?.abort('user')},'Stop');
  const description=el('p',{class:'run-plan',id:'runPlan'},WORKFLOWS.domain.description);
  workflow.addEventListener('change',()=>{description.textContent=WORKFLOWS[workflow.value].description;target.placeholder=workflow.value==='ip'?'8.8.8.8':'snailsploit.com';});
  form=el('form',{class:'run-control'},el('p',{class:'eyebrow'},'LIVE COLLECTION / BOUNDED BY DESIGN'),el('h3',{},'A clue in. An evidence trail out.'),el('div',{class:'run-fields'},el('label',{},'WORKFLOW',workflow),el('label',{},'PUBLIC DOMAIN OR IP',target)),description,el('label',{class:'run-consent'},consent,el('span',{},'I am authorized to research this subject and understand that the lookup is sent to Google Public DNS, IANA/registry services and/or RIPE NCC.')),el('p',{class:'run-disclosure'},'Public records only. DNS resolution may contact authoritative DNS servers through the resolver. No target HTTP requests, ports, logins, paid APIs or automated subdomain scans. Max 12 upstream requests; 35-second server deadline.'),el('div',{class:'run-actions'},runButton,stopButton),notice);
  form.addEventListener('submit',e=>{e.preventDefault();if(!running)start();});
  results=el('div',{class:'run-results',id:'runResults'});savedList=el('div',{id:'savedRuns'});
  const input=el('input',{type:'file',id:'runImport',accept:'.json,application/json','aria-label':'Import evidence JSON'});
  input.addEventListener('change',async()=>{if(running)return;try{const f=input.files[0];if(!f)return;if(f.size>2*1024*1024)throw new Error('Import is limited to 2 MiB.');run=await verifyBundle(JSON.parse(await f.text()));imported=true;selected=null;renderResults();message('Imported locally. Hash consistency checked; unsigned content is not authenticated. No network query was made.');}catch(e){message(e.message,true);}finally{input.value='';}});
  root.append(form,results,el('details',{class:'run-library'},el('summary',{},'Saved investigations & local JSON replay'),el('p',{class:'reviewnote'},'Saving is opt-in. Snapshots include investigated domains/IPs and observations; browser storage is not encrypted or shared across devices. Imported bundles are never executed.'),savedList,el('label',{class:'run-import'},'Import an evidence bundle',input)));
  container.replaceChildren(root);renderResults();listSaved();
}
