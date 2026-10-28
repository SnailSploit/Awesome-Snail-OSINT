/* Shared, dependency-free execution contracts. No network or DOM authority. */
export const ENGINE_VERSION = '1.0.0';
export const WORKFLOWS = Object.freeze({
  domain: {name:'Domain footprint', input:'domain', description:'DNS records -> registry context -> routing for up to two observed public IPs.', limit:12},
  mail: {name:'Mail DNS evidence', input:'domain', description:'MX + SPF-related TXT + DMARC TXT. Record collection, not a deliverability or spoofing verdict.', limit:3},
  ip: {name:'IP routing context', input:'ip', description:'Registry allocation + observed BGP prefix and origin ASNs. No probing or geolocation claims.', limit:5},
});
export const OUTCOMES = new Set(['ok','empty','unavailable','unsupported','error','cancelled']);
export function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
}
export async function digest(value) {
  const bytes = new TextEncoder().encode(canonical(value));
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function domainName(raw) {
  if(typeof raw!=='string') throw new Error('Enter a plain public domain.');
  const v=raw.trim().toLowerCase().replace(/\.$/,'');
  if(v.length>253 || !v.includes('.') || !v.split('.').every(x=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(x)) || /^\d+(?:\.\d+)+$/.test(v) || !/[a-z]/.test(v.split('.').at(-1))) throw new Error('Use a plain domain, without a URL, path, port or operators. IDNs must use punycode.');
  if(['localhost','local','internal','test','invalid','onion','arpa'].some(s=>v===s||v.endsWith('.'+s))) throw new Error('Only public DNS names are supported.');
  return v;
}
export function ipParts(raw) {
  if(typeof raw!=='string') throw new Error('Enter a literal IP address.');
  const v=raw.trim().toLowerCase();
  if(/^\d+\.\d+\.\d+\.\d+$/.test(v)) {
    const parts=v.split('.');
    if(parts.some(x=>(x.length>1&&x[0]==='0')||Number(x)>255))throw new Error('Invalid IPv4 address.');
    return {family:4,bits:32,value:parts.reduce((n,x)=>(n<<8n)+BigInt(x),0n),text:v};
  }
  if(!v.includes(':')||!/^[0-9a-f:]+$/.test(v))throw new Error('Enter an IPv4 or IPv6 address, not a URL, port or range.');
  let text;try{text=new URL('https://['+v+']/').hostname.slice(1,-1);}catch{throw new Error('Invalid IPv6 address.');}
  const halves=text.split('::');
  const left=halves[0]?halves[0].split(':'):[],right=halves[1]?halves[1].split(':'):[];
  const parts=halves.length===2?[...left,...Array(8-left.length-right.length).fill('0'),...right]:left;
  if(parts.length!==8)throw new Error('Invalid IPv6 address.');
  return {family:6,bits:128,value:parts.reduce((n,x)=>(n<<16n)+BigInt('0x'+x),0n),text};
}
export function inPrefix(ip,prefix) {
  try {
    const [base,size,...extra]=prefix.split('/'),a=ipParts(ip),b=ipParts(base),n=Number(size);
    if(extra.length||size===undefined||!/^\d+$/.test(size)||a.family!==b.family||n<0||n>a.bits)return false;
    const shift=BigInt(a.bits-n);return (a.value>>shift)===(b.value>>shift);
  }catch{return false;}
}
export function publicIP(raw) {
  const p=ipParts(raw);
  const denied4=['0.0.0.0/8','10.0.0.0/8','100.64.0.0/10','127.0.0.0/8','169.254.0.0/16','172.16.0.0/12','192.0.0.0/24','192.0.2.0/24','192.88.99.0/24','192.168.0.0/16','198.18.0.0/15','198.51.100.0/24','203.0.113.0/24','224.0.0.0/3'];
  if(p.family===4&&denied4.some(x=>inPrefix(p.text,x)))throw new Error('Private, special-use and documentation IPs are excluded.');
  if(p.family===6&&(!inPrefix(p.text,'2000::/3')||['2001::/23','2001:db8::/32','2002::/16','3fff::/20'].some(x=>inPrefix(p.text,x))))throw new Error('Only global unicast IPv6 addresses are supported.');
  return p.text;
}
export function requestSpec(raw) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!['workflow','target','consent'].includes(k)))throw new Error('Unknown request fields.');
  if(!Object.hasOwn(WORKFLOWS,raw.workflow))throw new Error('Unknown workflow.');
  if(raw.consent!==true)throw new Error('Confirm scope and provider disclosure before running.');
  return {workflow:raw.workflow,target:raw.workflow==='ip'?publicIP(raw.target):domainName(raw.target),consent:true};
}
export function initialSteps(spec) {
  const dns=(type,name=spec.target)=>({id:'dns-'+type.toLowerCase()+(name.startsWith('_dmarc.')?'-dmarc':''),adapter:'dns',subject:name,recordType:type,label:name.startsWith('_dmarc.')?'DMARC TXT':'DNS '+type});
  if(spec.workflow==='ip')return [{id:'ip-registry',adapter:'ip-rdap',subject:spec.target,label:'IP registry allocation'},{id:'routing',adapter:'routing',subject:spec.target,label:'BGP routing context'}];
  if(spec.workflow==='mail')return [dns('MX'),dns('TXT'),dns('TXT','_dmarc.'+spec.target)];
  return [...['A','AAAA','CNAME','NS','MX','CAA'].map(t=>dns(t)),{id:'domain-registry',adapter:'domain-rdap',subject:spec.target,label:'Domain registry record'}];
}
export async function sealObservation(body) {
  const sha256=await digest(body);return {...body,id:'obs-'+sha256,sha256};
}
export async function verifyObservation(o,runId) {
  if(!o||o.runId!==runId||o.version!==ENGINE_VERSION||!OUTCOMES.has(o.status)||typeof o.stepId!=='string'||!['dns','domain-rdap','ip-rdap','routing'].includes(o.adapter)||typeof o.collectedAt!=='string'||!Number.isFinite(Date.parse(o.collectedAt))||!Array.isArray(o.requests)||o.requests.length>4||!o.payload||typeof o.payload!=='object')throw new Error('Invalid observation contract.');
  const {id,sha256,...body}=o;
  if(!/^[a-f0-9]{64}$/.test(sha256)||id!=='obs-'+sha256||await digest(body)!==sha256)throw new Error('Observation integrity check failed.');
  return o;
}
// Only a successful DNS response and a reachable owner can seed an IP pivot.
export function observedAddresses(observations) {
  const result=[];
  for(const o of observations.filter(o=>o.adapter==='dns'&&o.status==='ok')){
    const names=new Set([o.subject]);
    for(let i=0;i<8;i++)for(const r of o.payload.answers||[])if(r.type===5&&names.has(r.name))names.add(r.data.replace(/\.$/,'').toLowerCase());
    for(const r of o.payload.answers||[])if([1,28].includes(r.type)&&names.has(r.name))try{result.push(publicIP(r.data));}catch{}
  }
  return [...new Set(result)];
}
export function graphFor(run) {
  const nodes=new Map(),edges=new Map();
  function node(type,label){const key=type+':'+label;if(!nodes.has(key))nodes.set(key,{id:key,type,label});return key;}
  const root=node(run.workflow==='ip'?'ip':'domain',run.target);
  function edge(a,b,relation,o){const key=[a,b,relation].join('|');if(!edges.has(key))edges.set(key,{from:a,to:b,relation,evidence:[]});const e=edges.get(key);if(!e.evidence.includes(o.id))e.evidence.push(o.id);}
  for(const o of run.observations||[]) {
    if(o.status!=='ok')continue;
    const p=o.payload;
    if(o.adapter==='dns'){
      if(o.subject==='_dmarc.'+run.target)edge(root,node('domain',o.subject),'Queried DMARC name',o);
      const names=new Set([o.subject]);
      for(let i=0;i<8;i++)for(const r of p.answers||[])if(r.type===5&&names.has(r.name))names.add(r.data.replace(/\.$/,'').toLowerCase());
      for(const r of p.answers||[]){
        if(!names.has(r.name))continue;
        const from=node('domain',r.name);
        if([1,28].includes(r.type)){try{edge(from,node('ip',publicIP(r.data)),'DNS address',o);}catch{}}
        else if([2,5,15].includes(r.type)){
          const raw=r.type===15?r.data.split(/\s+/).slice(1).join(' '):r.data;
          try{edge(from,node('domain',domainName(raw)),({2:'DNS nameserver',5:'DNS alias',15:'Mail exchanger'})[r.type],o);}catch{}
        }else if(r.type===16||r.type===257){edge(from,node('record',r.data),'DNS '+(r.type===16?'TXT':'CAA'),o);}
      }
    }else if(o.adapter==='domain-rdap'&&p.domain===run.target){edge(root,node('registration',p.domain),'Registry record',o);}
    else if(o.adapter==='ip-rdap'&&p.startAddress&&p.endAddress){edge(node('ip',o.subject),node('allocation',p.startAddress+' - '+p.endAddress),'Registry allocation',o);}
    else if(o.adapter==='routing'&&p.prefix&&inPrefix(o.subject,p.prefix)){
      const net=node('prefix',p.prefix);edge(node('ip',o.subject),net,'Observed covering prefix',o);
      for(const asn of p.asns||[])if(/^\d+$/.test(String(asn)))edge(net,node('asn','AS'+asn),'RIS-observed origin',o);
    }
  }
  return {root,nodes:[...nodes.values()],edges:[...edges.values()],meaning:'Provider-reported relationships, not shared ownership, physical location or a vulnerability verdict.'};
}
export function terminalStatus(observations,cancelled=false) {
  if(cancelled)return 'cancelled';
  if(!observations.length)return 'failed';
  if(observations.every(o=>o.status==='ok'||o.status==='empty'))return 'completed';
  return observations.some(o=>o.status==='ok'||o.status==='empty')?'partial':'failed';
}
export async function bundleFor(run) {
  for(const o of run.observations)await verifyObservation(o,run.id);
  const payload={schema:'snail-investigation/v1',engineVersion:ENGINE_VERSION,run,graph:graphFor(run),limitations:['Unsigned local integrity envelope, not source authentication or a trusted timestamp.','Provider data may be cached or incomplete. Shared infrastructure does not establish ownership.','Only normalized public record projections are retained; raw provider responses are not archived.']};
  return {...payload,sha256:await digest(payload)};
}
export async function verifyBundle(bundle) {
  const {sha256,...payload}=bundle||{};
  if(payload.schema!=='snail-investigation/v1'||payload.engineVersion!==ENGINE_VERSION||!payload.run||!Array.isArray(payload.run.observations)||payload.run.observations.length>12||await digest(payload)!==sha256)throw new Error('Invalid or altered evidence bundle.');
  const r=payload.run;requestSpec({workflow:r.workflow,target:r.target,consent:true});
  for(const o of r.observations)await verifyObservation(o,r.id);
  if(canonical(graphFor(r))!==canonical(payload.graph))throw new Error('Graph does not match its observations.');
  return r;
}
const md=v=>String(v).replace(/[\\`*_{}\[\]()<>#|]/g,'\\$&').replace(/\r?\n/g,' ');
export function markdownFor(run) {
  const g=graphFor(run),lines=['# Snail OSINT / Executed investigation','',`Workflow: ${md(WORKFLOWS[run.workflow].name)}`,`Target: ${md(run.target)}`,`Run: ${md(run.id)}`,`Status: ${md(run.status)}`,`Started (server clock): ${md(run.startedAt)}`,'','## Scope and limitations','Public-source queries only. No direct target probes, ownership attribution, location claim or vulnerability verdict. Normalized response projections are retained; source JSON is not archived. Hashes are unsigned integrity checks, not authenticity proofs.','','## Source observations'];
  for(const o of run.observations){lines.push('',`### ${md(o.stepId)} / ${md(o.status)}`,`Collected: ${md(o.collectedAt)}`,`Subject: ${md(o.subject)}`,`Observation: ${o.id}`,`Note: ${md(o.note)}`);for(const q of o.requests)lines.push(`Source: ${q.url} / HTTP ${q.status} / received ${q.receivedAt}`);lines.push('','```json',JSON.stringify(o.payload,null,2).replace(/`/g,'\\u0060'),'```');}
  lines.push('','## Derived relationships (not ownership)');for(const e of g.edges)lines.push(`- ${md(e.from)} -> ${md(e.to)}: ${md(e.relation)}; observations: ${e.evidence.join(', ')}`);
  return lines.join('\n')+'\n';
}
