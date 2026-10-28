import test from 'node:test';import assert from 'node:assert/strict';
import {domainName,publicIP,requestSpec,initialSteps,verifyObservation,observedAddresses,graphFor,bundleFor,verifyBundle,terminalStatus,inPrefix} from '../site/execution-core.mjs';
import {collect,allowedRequest,readLimited,normalizeDNS} from '../server/providers.mjs';
import {execute,handleRequest,takeSlot} from '../server/engine.mjs';
import {fakeFetcher} from './execution-fixtures.mjs';
const spec=(workflow='domain',target='atlas.example.com')=>({workflow,target,consent:true});
const context=(fetcher=fakeFetcher())=>({fetcher,remaining:12,signal:new AbortController().signal,timeoutMs:100});
const req=body=>new Request('https://atlas.test/api/investigate',{method:'POST',headers:{Origin:'https://atlas.test','Content-Type':'application/json'},body:JSON.stringify(body)});
test('domains reject URL, operator, private suffix and ambiguous numeric forms',()=>{
  assert.equal(domainName('SnailSploit.COM.'),'snailsploit.com');
  for(const x of ['https://host.com','foo.com/','foo.com:443','a.com@b.com','foo.com OR x','127.0.0.1','foo.local','a..com','*.*.com','user\n.com'])assert.throws(()=>domainName(x));
});
test('literal public IPv4/IPv6 parser excludes private and special ranges',()=>{
  assert.equal(publicIP('8.8.8.8'),'8.8.8.8');assert.equal(publicIP('2606:4700:4700::1111'),'2606:4700:4700::1111');
  for(const x of ['127.1','2130706433','0x7f000001','010.0.0.1','169.254.169.254','10.1.1.1','100.64.0.1','192.0.2.1','[::1]','::1','fe80::1','::ffff:127.0.0.1','2001:db8::1','2606:4700::1%eth0'])assert.throws(()=>publicIP(x));
  assert.equal(inPrefix('8.8.8.8','8.8.8.0/24'),true);assert.equal(inPrefix('8.8.8.8','1.1.1.0/24'),false);
});
test('request schema is closed and consent is required',()=>{
  assert.throws(()=>requestSpec({...spec(),url:'https://internal/'}));assert.throws(()=>requestSpec({...spec(),consent:false}));assert.throws(()=>requestSpec({...spec(),workflow:'constructor'}));assert.equal(initialSteps(spec('mail')).length,3);
});
test('egress accepts only exact provider endpoints and typed targets',()=>{
  assert.equal(allowedRequest('https://dns.google/resolve?name=example.com&type=A','dns','example.com'),true);
  for(const url of ['http://dns.google/resolve?name=example.com&type=A','https://dns.google.evil/resolve?name=example.com&type=A','https://user:pass@dns.google/resolve?name=example.com&type=A','https://dns.google/resolve?name=elsewhere.com&type=A','https://169.254.169.254/'])assert.equal(allowedRequest(url,'dns','example.com'),false);
});
test('DNS mismatch cannot become an observation of the requested name',async()=>{
  const o=await collect(initialSteps(spec())[0],context(fakeFetcher({badDNS:true})));assert.equal(o.status,'error');assert.deepEqual(o.payload,{});
});
test('NXDOMAIN and resolver failure are distinct from successful evidence',()=>{
  const step=initialSteps(spec())[0],base={Question:[{name:step.subject,type:1}]};
  assert.equal(normalizeDNS({...base,Status:3},step).status,'empty');assert.equal(normalizeDNS({...base,Status:2},step).status,'unavailable');assert.equal(normalizeDNS({...base,Status:0,TC:true},step).status,'error');
});
test('RDAP keeps public record projection, not contact entities',async()=>{
  const step=initialSteps(spec()).at(-1),o=await collect(step,context());assert.equal(o.status,'ok');assert.equal(o.payload.domain,spec().target);assert.equal(JSON.stringify(o).includes('NEVER RETAIN'),false);assert.equal(o.requests.length,2);
});
test('RDAP without an allowlisted IANA service stops rather than guessing',async()=>{
  const step={id:'registry',adapter:'domain-rdap',subject:'example.unlisted'};const o=await collect(step,context());assert.equal(o.status,'unsupported');assert.equal(o.requests.length,1);
});
test('RDAP private redirect is denied before a second network call',async()=>{
  let count=0;const f=async(url)=>{count++;if(url.includes('iana'))return fakeFetcher()(url);return new Response('',{status:302,headers:{Location:'http://169.254.169.254/latest/meta-data/'}});};
  const o=await collect(initialSteps(spec()).at(-1),context(f));assert.equal(o.status,'error');assert.equal(count,2);assert.match(o.note,/denied/);
});
test('response-size limit is enforced on streamed bytes as well as headers',async()=>{
  await assert.rejects(readLimited(new Response('12345'),4));await assert.rejects(readLimited(new Response('x',{headers:{'Content-Length':'9999'}}),4));
});
test('domain chain runs real adapter code and only two validated IP pivots',async()=>{
  const events=[],run=await execute(spec(),e=>events.push(e),{fetcher:fakeFetcher()});
  assert.equal(run.status,'completed');assert.equal(run.observations.length,9);assert.equal(run.observations.filter(o=>o.adapter==='routing').length,2);
  for(const o of run.observations)await verifyObservation(o,run.id);
  const g=graphFor(run);assert.ok(g.edges.length>0);assert.ok(g.edges.every(e=>e.evidence.every(id=>run.observations.some(o=>o.id===id))));assert.ok(events.at(-1).providerRequests<=12);
});
test('mail chain collects three DNS questions and never expands other targets',async()=>{
  const run=await execute(spec('mail'),()=>{}, {fetcher:fakeFetcher()});assert.equal(run.observations.length,3);assert.ok(run.observations.every(o=>o.adapter==='dns'));assert.equal(run.observations.at(-1).subject,'_dmarc.atlas.example.com');
});
test('IP chain records registry range and RIS context separately',async()=>{
  const run=await execute(spec('ip','8.8.8.8'),()=>{}, {fetcher:fakeFetcher()});assert.equal(run.status,'completed');assert.equal(run.observations.length,2);assert.equal(graphFor(run).edges.length,3);
});
test('rate-limited upstream gives partial, not a false complete verdict',async()=>{
  const run=await execute(spec(),()=>{}, {fetcher:fakeFetcher({failRouting:true})});assert.equal(run.status,'partial');assert.ok(run.observations.some(o=>o.status==='unavailable'));assert.equal(graphFor(run).nodes.some(n=>n.type==='asn'),false);
});
test('all failed collectors have an explicit failed terminal state',async()=>{
  const run=await execute(spec('mail'),()=>{}, {fetcher:async()=>{throw new Error('network failed');}});assert.equal(run.status,'failed');assert.equal(graphFor(run).edges.length,0);
});
test('unrelated DNS records and error payloads cannot seed routing',()=>{
  const o={adapter:'dns',status:'ok',subject:'example.com',payload:{answers:[{type:1,name:'unrelated.com',data:'8.8.8.8'}]}};assert.deepEqual(observedAddresses([o]),[]);o.status='error';o.payload.answers[0].name='example.com';assert.deepEqual(observedAddresses([o]),[]);
});
test('abort stops scheduling and preserves an explicit cancellation',async()=>{
  const a=new AbortController();a.abort();const run=await execute(spec(),()=>{}, {fetcher:fakeFetcher(),signal:a.signal});assert.equal(run.status,'cancelled');assert.equal(run.observations.length,0);
});
test('provider timeout ends a lookup without automatic retry',async()=>{
  const c=context(fakeFetcher({delay:100}));c.timeoutMs=5;const o=await collect(initialSteps(spec())[0],c);assert.equal(o.status,'error');assert.match(o.note,/timed out/);assert.equal(c.remaining,11);
});
test('evidence bundle integrity rejects altered observations and graph',async()=>{
  const run=await execute(spec('mail'),()=>{}, {fetcher:fakeFetcher()}),bundle=await bundleFor(run);assert.equal((await verifyBundle(bundle)).id,run.id);bundle.run.observations[0].payload.answers[0].data='changed';await assert.rejects(verifyBundle(bundle));
});
test('HTTP interface checks origin, schema, method and content type',async()=>{
  const options={fetcher:fakeFetcher(),rateLimit:false};
  assert.equal((await handleRequest(new Request('https://atlas.test/api/investigate'),options)).status,200);
  assert.equal((await handleRequest(new Request('https://atlas.test/api/investigate',{method:'POST',body:'{}'}),options)).status,403);
  assert.equal((await handleRequest(req({...spec(),consent:false}),options)).status,400);
  assert.equal((await handleRequest(req({...spec(),target:'localhost'}),options)).status,400);
  const response=await handleRequest(req(spec('mail')),options);assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');
  const events=(await response.text()).trim().split('\n').map(JSON.parse);assert.equal(events[0].type,'start');assert.equal(events.at(-1).type,'finish');assert.ok(events.every((e,i)=>e.sequence===i));
});
test('edge-local burst limit expires and does not pretend to be global',()=>{
  const client='unit-test';for(let i=0;i<6;i++)assert.equal(takeSlot(client,1000),true);assert.equal(takeSlot(client,1001),false);assert.equal(takeSlot(client,62000),true);
});
