import { REVIEWED, safeURL, search, makeQuery, loadPins, exportBoard, sha256 } from './core.mjs';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const state = {view:'atlas',query:'',category:'',review:'',access:'',limit:24,list:false};
let data, pins=[], known=new Set(), receipt=null, toastTimer;
function h(tag, attributes={}, ...children) {
  const node=document.createElement(tag);
  for(const [key,value] of Object.entries(attributes)) {
    if(value===null||value===undefined) continue;
    if(key==='class') node.className=value;
    else if(key==='onClick') node.addEventListener('click',value);
    else if(key==='text') node.textContent=value;
    else node.setAttribute(key,String(value));
  }
  for(const child of children.flat(Infinity)) if(child!==null&&child!==undefined) node.append(child instanceof Node?child:document.createTextNode(String(child)));
  return node;
}
function external(label,url,attrs={}) {
  const safe=safeURL(url);
  return safe?h('a',{href:safe,target:'_blank',rel:'noopener noreferrer',...attrs},label):h('span',{},label);
}
function notify(message) { const node=$('#toast');node.textContent=message;node.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('visible'),3500); }
function openDialog(node) { for(const d of $$('dialog[open]')) if(d!==node)d.close();if(!node.open)node.showModal();node.scrollTop=0; }
function syncPins(){ $('#boardCount').textContent=pins.length;$$('[data-pin]').forEach(b=>{const saved=pins.includes(b.dataset.pin);b.setAttribute('aria-pressed',saved);b.textContent=saved?'\u2713':'+';b.setAttribute('aria-label',(saved?'Remove ':'Save ')+b.dataset.label+(saved?' from caseboard':' to caseboard'));}); }
function togglePin(key) {
  if(!known.has(key))return;
  if(pins.includes(key))pins=pins.filter(x=>x!==key);
  else {if(pins.length>=250){notify('Caseboard limit reached. Export or remove a saved item.');return;}pins.push(key);}
  try{localStorage.setItem('snail-atlas-pins-v1',JSON.stringify(pins));}catch{notify('Browser storage unavailable; these pins last only for this session.');}
  syncPins();if($('#board').open)renderBoard();
}
function pinButton(key,label){return h('button',{class:'pin','data-pin':key,'data-label':label,'aria-label':'Save '+label+' to caseboard','aria-pressed':pins.includes(key),onClick:()=>togglePin(key)},pins.includes(key)?'\u2713':'+');}
function sourceRef(id){const r=data.resources.find(x=>x.id===id);return r?h('button',{onClick:()=>showSource(r)},r.name):null;}
function reviewBadge(r){return h('span',{class:'review'+(r.review.status===REVIEWED?'':' legacy')},r.review.status===REVIEWED?'Docs reviewed':'Legacy / unreviewed');}
function sourceCard(r) {
  return h('article',{class:'card','data-source':r.id},
    h('div',{class:'cardtop'},h('span',{class:'sourceicon','aria-hidden':'true'},r.name.replace(/[^a-z0-9]/gi,'').slice(0,2).toUpperCase()),h('span',{class:'category'},r.category),pinButton('source:'+r.id,r.name)),
    h('button',{class:'cardtitle',onClick:()=>showSource(r)},r.name),h('p',{class:'carddesc'},r.description),
    h('div',{class:'tags'},...r.inputs.slice(0,2).map(t=>h('span',{class:'tag'},t)),h('span',{class:'tag'},r.access)),
    h('div',{class:'cardfoot'},reviewBadge(r),h('button',{onClick:()=>showSource(r),'aria-label':'Inspect '+r.name},'Inspect source \u2197')));
}
function chainCard(c,i){
  return h('article',{class:'card chaincard'},h('div',{class:'cardtop'},h('span',{class:'category'},c.category),pinButton('chain:'+c.id,c.title)),
    h('span',{class:'chainindex','aria-hidden':'true'},String(i+1).padStart(2,'0')),
    h('button',{class:'cardtitle',onClick:()=>showChain(c)},c.title),h('p',{class:'carddesc'},c.description),
    h('div',{class:'chainpath','aria-label':c.steps.length+' research steps'},...c.steps.flatMap((s,i)=>[i?h('i',{'aria-hidden':'true'}):null,h('span',{},String(i+1).padStart(2,'0'))])),
    h('div',{class:'tags'},h('span',{class:'tag'},'Input: '+c.input),h('span',{class:'tag'},c.difficulty)),
    h('div',{class:'cardfoot'},h('span',{class:'review'},c.steps.length+' evidence-aware pivots'),h('button',{onClick:()=>showChain(c)},'Open chain \u2197')));
}
function craftCard(t,i){return h('article',{class:'card craftcard','data-craft':t.id},h('div',{class:'cardtop'},h('span',{class:'craftnumber'},'FIELD NOTE / '+String(i+1).padStart(2,'0')),h('span',{class:'category'},t.category)),h('h3',{},t.title),h('p',{},t.body),h('div',{class:'craftrefs'},...t.sources.map(sourceRef)));}
function writeHash(){const p=new URLSearchParams({view:state.view});for(const k of ['query','category','review','access'])if(state[k])p.set(k,state[k]);history.replaceState(null,'','#'+p.toString());}
function readHash(){const p=new URLSearchParams(location.hash.slice(1));state.view=['atlas','chains','fieldcraft','lab'].includes(p.get('view'))?p.get('view'):'atlas';for(const k of ['query','category','review','access'])state[k]=(p.get(k)||'').slice(0,150);}
function itemsForView(){return state.view==='atlas'?data.resources:state.view==='chains'?data.chains:data.fieldcraft;}
function renderCategories(items){const names=[...new Set(items.map(r=>r.category))].sort();const wrap=$('#categoryFilters');wrap.replaceChildren(...['',...names].map(name=>h('button',{class:'filter'+(state.category===name?' active':''),'aria-pressed':state.category===name,onClick:()=>{state.category=name;state.limit=24;render();}},name||'All disciplines',h('span',{},name?items.filter(r=>r.category===name).length:items.length))));}
function render(){
  const copy={atlas:['01 / DISCOVERY','The source atlas.','Know what a source can tell you. And what it cannot.'],chains:['02 / CONNECT THE DOTS','Investigation chains.','Every pivot has an output, a failure condition and a fallback. No blind leaps.'],fieldcraft:['03 / BETTER QUESTIONS','Small tricks. Better findings.','Practical research habits that reduce noise, false joins and false certainty.'],lab:['04 / WORKING TOOLS','A little less busywork.','Scoped query recipes and local evidence hashing. Nothing runs against a target automatically.']}[state.view];
  $('#hero').hidden=state.view!=='atlas';$('#sectionEyebrow').textContent=copy[0];$('#sectionTitle').textContent=copy[1];$('#sectionDescription').textContent=copy[2];
  $$('.navitem').forEach(b=>{b.classList.toggle('active',b.dataset.view===state.view);if(b.dataset.view===state.view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  $('#searchControls').hidden=state.view==='lab';$('.resultshead').hidden=state.view==='lab';$('#layoutToggle').hidden=state.view!=='atlas';
  $('#reviewFilter').parentElement.hidden=state.view!=='atlas';$('#accessFilter').parentElement.hidden=state.view!=='atlas';
  $('#search').value=state.query;$('#reviewFilter').value=state.review;$('#accessFilter').value=state.access;
  $('#results').className='cards'+(state.list&&state.view==='atlas'?' list':'');$('#results').setAttribute('aria-busy','false');
  if(state.view==='lab'){renderLab();$('#loadMore').hidden=true;writeHash();return;}
  const items=itemsForView();renderCategories(items);
  const filtered=search(items,state.query,{category:state.category,review:state.view==='atlas'?state.review:'',access:state.view==='atlas'?state.access:''});
  const count=filtered.length;
  $('#resultCount').textContent=count+' '+(state.view==='atlas'?'sources':state.view==='chains'?'chains':'field notes')+' / '+items.length+' total'+(state.query?' \u00b7 local search':'');
  if(!count)$('#results').replaceChildren(h('div',{class:'empty'},h('h3',{},'A dead end? Change the question.'),h('p',{},'Try fewer terms, another discipline or reset your filters.'),h('button',{class:'secondary',onClick:resetFilters},'Reset filters')));
  else $('#results').replaceChildren(...filtered.slice(0,state.limit).map((r,i)=>state.view==='atlas'?sourceCard(r):state.view==='chains'?chainCard(r,i):craftCard(r,i)));
  $('#loadMore').hidden=count<=state.limit;$('#loadMore').textContent='Show '+Math.min(24,count-state.limit)+' more';
  syncPins();writeHash();
}
function resetFilters(){Object.assign(state,{query:'',category:'',review:'',access:'',limit:24});render();}
function setView(view,scroll=true){Object.assign(state,{view,query:'',category:'',review:'',access:'',limit:24});render();if(scroll)$('#workspace').scrollIntoView({behavior:'smooth'});}
function metaGrid(entries){return h('dl',{class:'meta'},...entries.map(([k,v])=>h('div',{},h('dt',{},k),h('dd',{},v))));}
function showSource(r){
  const related=data.chains.filter(c=>c.steps.some(s=>s.sources.includes(r.id)));
  $('#detailBody').replaceChildren(h('p',{class:'eyebrow'},'SOURCE DOSSIER / '+r.category),h('h2',{},r.name),h('p',{class:'lede'},r.description),
    h('div',{class:'detailactions'},external('Open source \u2197',r.url),external('Publisher / provenance \u2197',r.reference),pinButton('source:'+r.id,r.name)),
    metaGrid([['Input',r.inputs.join(', ')||'Not classified'],['Output',r.outputs.join(', ')||'Not classified'],['Access',r.access],['Upstream lineage',r.origin]]),
    h('h3',{},'The inference boundary'),h('p',{class:'caution'},r.caveat),h('h3',{},'Review record'),reviewBadge(r),h('p',{},r.review.scope),h('p',{class:'reviewnote'},'Documentation date: '+(r.review.date||'No dated review')+'. Access tiers and capabilities can change. A documentation review does not certify availability or accuracy.'),
    related.length?h('div',{},h('h3',{},'Where this source takes you'),...related.map(c=>h('button',{class:'sourcebutton',onClick:()=>showChain(c)},c.title+' \u2192'))):h('p',{},'No authored chain links this entry yet. Suggest one through the repository.'),
    r.legacyLocations?.length?h('p',{class:'reviewnote'},'Also appears in the original directory: '+[...new Set(r.legacyLocations.map(l=>l.section))].join(', ')):null);
  openDialog($('#detail'));syncPins();
}
function showChain(c){
  $('#detailBody').replaceChildren(h('p',{class:'eyebrow'},'INVESTIGATION CHAIN / '+c.category),h('h2',{},c.title),h('p',{class:'lede'},c.description),
    metaGrid([['Start with',c.input],['Intended outcome',c.outcome],['Depth',c.difficulty],['Method',c.steps.length+' manual research steps']]),
    h('div',{class:'detailactions'},h('button',{onClick:()=>{togglePin('chain:'+c.id);notify(pins.includes('chain:'+c.id)?'Chain saved to your caseboard.':'Chain removed from your caseboard.');}},'Save / unsave chain'),h('button',{onClick:()=>download(c.id+'.md',exportBoard(['chain:'+c.id],data),'text/markdown')},'Export this playbook')),
    h('p',{class:'caution'},'This is an authored research plan, not an executed investigation. Confirm purpose and scope first. No scans, target requests or paid API calls run automatically.'),
    ...c.steps.map((s,i)=>h('section',{class:'step','data-number':i+1},h('h4',{},s.title),h('p',{},s.action),h('small',{},'EXPECTED OUTPUT'),h('p',{class:'stepnote'},s.output),h('small',{},'WHAT COULD BREAK THE LINK'),h('p',{},s.trap),h('p',{class:'fallback'},'Dead-end recovery: '+s.fallback),h('div',{class:'craftrefs'},...s.sources.map(sourceRef)))));
  openDialog($('#detail'));
}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type:type+';charset=utf-8'}));const a=h('a',{href:url,download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function renderBoard(){
  const selected=[...data.resources.map(r=>({key:'source:'+r.id,label:r.name,kind:'SOURCE',open:()=>showSource(r)})),...data.chains.map(c=>({key:'chain:'+c.id,label:c.title,kind:'CHAIN',open:()=>showChain(c)}))].filter(x=>pins.includes(x.key));
  $('#boardBody').replaceChildren(h('p',{class:'eyebrow'},'YOUR LOCAL CASEBOARD'),h('h2',{},'Keep the useful connections.'),h('p',{class:'lede'},'Save sources and research plans. Only their catalog IDs are stored in this browser. No target values, file bytes or evidence notes are saved.'),
    selected.length?h('div',{class:'detailactions'},h('button',{onClick:()=>download('snail-osint-plan.md',exportBoard(pins,data),'text/markdown')},'Export Markdown'),h('button',{onClick:()=>download('snail-osint-plan.json',JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),purpose:'Research plan, not collected evidence',resources:data.resources.filter(r=>pins.includes('source:'+r.id)),chains:data.chains.filter(c=>pins.includes('chain:'+c.id))},null,2),'application/json')},'Export JSON'),h('button',{onClick:()=>{if(!confirm('Remove all saved items from this browser? Export first to keep a copy.'))return;pins=[];try{localStorage.removeItem('snail-atlas-pins-v1');}catch{}syncPins();renderBoard();}},'Clear caseboard')):null,
    ...selected.map(x=>h('div',{class:'boarditem'},h('button',{onClick:x.open},h('small',{},x.kind),x.label),h('button',{class:'remove','aria-label':'Remove '+x.label,onClick:()=>togglePin(x.key)},'\u00d7'))),
    !selected.length?h('div',{class:'empty'},h('h3',{},'Start with one useful source.'),h('p',{},'Use the + button on a source or chain. Your plan stays on this device.')):null,
    h('p',{class:'reviewnote'},'This is not encrypted case-management software. Browser storage can be cleared or accessed by other users of this device. Exported plans contain catalog information, not proof of research.'));
}
function showBoard(){renderBoard();openDialog($('#board'));}
function showPalette(){openDialog($('#palette'));$('#paletteInput').value='';renderPalette();$('#paletteInput').focus();}
function renderPalette(){
  const term=$('#paletteInput').value;
  const combined=[...data.chains.map(x=>({...x,_kind:'CHAIN',_open:()=>showChain(x)})),...data.resources.map(x=>({...x,_kind:'SOURCE',_open:()=>showSource(x)})),...data.fieldcraft.map(x=>({...x,_kind:'FIELD NOTE',_open:()=>{setView('fieldcraft');state.query=x.title;render();}}))];
  const found=search(combined,term).slice(0,14);
  $('#paletteResults').replaceChildren(...found.map(x=>h('button',{class:'paletteresult',onClick:()=>{$('#palette').close();x._open();}},h('small',{},x._kind),h('strong',{},x.name||x.title))),!found.length?h('p',{class:'palettehint'},'No matching sources or methods. Try a shorter query.'):null);
}
async function copy(text){try{await navigator.clipboard.writeText(text);notify('Copied to clipboard.');}catch{notify('Clipboard access unavailable. Select the displayed text to copy it.');}}
function renderLab(){
  receipt=null;
  const queryInput=h('input',{id:'queryInput',placeholder:'example.com',autocomplete:'off',spellcheck:'false',maxlength:253});
  const kind=h('select',{id:'queryKind'},h('option',{value:'domain'},'I have a domain'),h('option',{value:'organization'},'I have a GitHub organization'));
  const queryOut=h('div',{id:'queryOutput','aria-live':'polite'});
  const generate=()=>{try{const recipes=data.queries.filter(q=>q.input===kind.value);const results=recipes.map(q=>({q,...makeQuery(q,queryInput.value)}));queryOut.replaceChildren(...results.map(({q,query,url})=>h('div',{class:'queryrow'},h('h4',{},q.engine+' / '+q.name),h('code',{class:'querycode'},query),h('p',{},q.note),h('div',{class:'queryactions'},h('button',{onClick:()=>copy(query)},'Copy query'),external('Open search \u2197',url),h('button',{onClick:()=>showSource(data.resources.find(r=>r.id===q.reference))},'Source notes')))));}catch(e){queryOut.replaceChildren(h('p',{class:'laberror',role:'alert'},e.message));}};
  kind.addEventListener('change',()=>{queryInput.value='';queryInput.placeholder=kind.value==='domain'?'example.com':'your-organization';queryOut.replaceChildren();});queryInput.addEventListener('keydown',e=>{if(e.key==='Enter')generate();});
  const file=h('input',{id:'evidenceFile',type:'file'});
  const fileResult=h('div',{id:'hashResult',class:'hashresult','aria-live':'polite'});
  file.addEventListener('change',async()=>{
    receipt=null;const selected=file.files?.[0];if(!selected){fileResult.replaceChildren();return;}
    if(selected.size>25*1024*1024){fileResult.replaceChildren(h('p',{class:'laberror',role:'alert'},'Use a file of 25 MiB or less here. Hash larger artifacts with an offline tool.'));file.value='';return;}
    if(!crypto.subtle){fileResult.replaceChildren(h('p',{class:'laberror',role:'alert'},'Local SHA-256 requires HTTPS or localhost. Serve the atlas securely.'));return;}
    file.disabled=true;fileResult.replaceChildren(h('p',{},'Hashing locally...'));
    try {
      const digest=await sha256(await selected.arrayBuffer());
      receipt={schemaVersion:1,filename:selected.name,bytes:selected.size,sha256:digest,recordedAt:new Date().toISOString(),timestampSource:'Browser clock; not a trusted timestamp',method:'SHA-256 via Web Crypto; original bytes not uploaded',limitation:'Unsigned local integrity record. Does not establish authenticity, acquisition time, chain of custody, or truth of contents.'};
      const record=receipt;
      fileResult.replaceChildren(h('p',{},record.filename+' / '+record.bytes+' bytes'),h('code',{class:'querycode'},record.sha256),h('div',{class:'queryactions'},h('button',{onClick:()=>copy(record.sha256)},'Copy SHA-256'),h('button',{onClick:()=>download('evidence-receipt.json',JSON.stringify(record,null,2),'application/json')},'Export receipt')),h('p',{class:'progressnote'},'Bytes stayed in this browser. Receipt uses your device clock and is not signed.'));
    }catch{fileResult.replaceChildren(h('p',{class:'laberror',role:'alert'},'Could not read or hash that file. No receipt was created.'));}
    finally{file.disabled=false;file.value='';}
  });
  $('#results').replaceChildren(h('div',{class:'labgrid'},
    h('section',{class:'labpanel'},h('span',{class:'localbadge'},'BUILD LOCALLY / OPEN EXPLICITLY'),h('h3',{},'A clue into a query.'),h('p',{},'Build a scoped search recipe. Generating it is local; opening a link sends the query to the selected provider. Nothing is submitted until you choose.'),h('label',{class:'lablabel',for:'queryKind'},'INPUT TYPE'),kind,h('label',{class:'lablabel',for:'queryInput'},'AUTHORIZED DOMAIN OR PUBLIC ORGANIZATION'),queryInput,h('button',{class:'primary',id:'generateQueries',onClick:generate},'Build query recipes \u2192'),queryOut),
    h('section',{class:'labpanel'},h('span',{class:'localbadge'},'LOCAL FILE / NO UPLOAD'),h('h3',{},'An integrity receipt.'),h('p',{},'Calculate a SHA-256 digest of a file already on your device. Export a simple integrity record, not a claim that the contents are authentic.'),h('label',{class:'lablabel',for:'evidenceFile'},'CHOOSE AN ARTIFACT / MAX 25 MIB'),file,fileResult,h('p',{class:'caution'},'A hash can detect later changes to the same bytes. It does not prove provenance, truth, lawful acquisition or the time an event occurred. Preserve collection context separately.'))));
}
function bind(){
  $$('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view,b.classList.contains('navitem'))));
  $('#startChain').addEventListener('click',()=>setView('chains'));$('#jumpSources').addEventListener('click',()=>$('#workspace').scrollIntoView({behavior:'smooth'}));
  $('#search').addEventListener('input',e=>{state.query=e.target.value;state.limit=24;render();$('#search').focus();});
  for(const [id,key] of [['reviewFilter','review'],['accessFilter','access']])$('#'+id).addEventListener('change',e=>{state[key]=e.target.value;state.limit=24;render();});
  $('#resetFilters').addEventListener('click',resetFilters);$('#loadMore').addEventListener('click',()=>{state.limit+=24;render();});
  $('#gridView').addEventListener('click',()=>{state.list=false;$('#gridView').setAttribute('aria-pressed','true');$('#listView').setAttribute('aria-pressed','false');render();});
  $('#listView').addEventListener('click',()=>{state.list=true;$('#gridView').setAttribute('aria-pressed','false');$('#listView').setAttribute('aria-pressed','true');render();});
  $('#boardOpen').addEventListener('click',showBoard);$('#commandOpen').addEventListener('click',showPalette);$('#paletteInput').addEventListener('input',renderPalette);
  $$('.dialogclose').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  $$('dialog').forEach(d=>d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))d.close();}));
  window.addEventListener('hashchange',()=>{readHash();render();});
  document.addEventListener('keydown',e=>{const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'');if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();showPalette();}else if(e.key==='/'&&!typing&&!$('dialog[open]')){e.preventDefault();if(state.view==='lab')setView('atlas');$('#search').focus();}});
}
async function start(){
  try{
    const response=await fetch('./data.json',{credentials:'omit'});if(!response.ok)throw new Error('Catalog request returned '+response.status);data=await response.json();
    if(!['resources','chains','fieldcraft','queries'].every(k=>Array.isArray(data[k])))throw new Error('Catalog schema is incomplete.');
    known=new Set([...data.resources.map(r=>'source:'+r.id),...data.chains.map(c=>'chain:'+c.id)]);
    try{pins=loadPins(localStorage.getItem('snail-atlas-pins-v1'),known);}catch{pins=[];}
    $('#heroStats').replaceChildren(...[[data.resources.length,'INDEXED SOURCES'],[data.chains.length,'RESEARCH CHAINS'],[data.resources.filter(r=>r.review.status===REVIEWED).length,'DOCS REVIEWED']].map(([n,l])=>h('span',{},h('strong',{},n),l)));
    readHash();bind();render();syncPins();
  }catch(error){$('#resultCount').textContent='The atlas could not load.';$('#results').setAttribute('aria-busy','false');$('#results').replaceChildren(h('div',{class:'errorbox',role:'alert'},h('h3',{},'The static catalog is unavailable.'),h('p',{},'Run python3 scripts/build_atlas.py and serve the generated _site directory over HTTP. The Markdown repository remains available.'),h('p',{},error.message),external('Open the original directory','https://github.com/SnailSploit/Awesome-Snail-OSINT')));}
}
start();
