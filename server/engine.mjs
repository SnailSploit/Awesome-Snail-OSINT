/* Bounded public-record executor. No model output, arbitrary URL, shell or target-probe surface. */
import {ENGINE_VERSION,WORKFLOWS,requestSpec,initialSteps,observedAddresses,sealObservation,terminalStatus} from '../site/execution-core.mjs';
import {collect,readLimited} from './providers.mjs';
const buckets=new Map();
export function takeSlot(client,now=Date.now()) {
  for(const [key,value] of buckets)if(now-value.start>=60000)buckets.delete(key);
  if(!buckets.has(client)){if(buckets.size>=2048)return false;buckets.set(client,{start:now,count:0});}
  const b=buckets.get(client);if(b.count>=6)return false;b.count++;return true;
}
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{...headers,'Content-Type':'application/json;charset=utf-8'}});}
export async function execute(spec,emit,{fetcher=fetch,signal,timeoutMs=6500,runId=crypto.randomUUID()}={}) {
  const normalized=requestSpec(spec),steps=initialSteps(normalized),observations=[];
  const run={id:runId,version:ENGINE_VERSION,workflow:normalized.workflow,target:normalized.target,startedAt:new Date().toISOString(),status:'running',observations};
  const ctx={fetcher,signal,timeoutMs,remaining:WORKFLOWS[run.workflow].limit};
  await emit({type:'start',run:{...run},steps,policy:{maxProviderRequests:ctx.remaining,maxParallelSteps:2,deadlineSeconds:35,noDirectTargetRequests:true,noAutomaticRetries:true}});
  async function step(s){
    if(signal?.aborted)return;
    await emit({type:'step',step:s});
    const result=await collect(s,ctx);
    const o=await sealObservation({version:ENGINE_VERSION,runId,stepId:s.id,adapter:s.adapter,subject:s.subject,collectedAt:new Date().toISOString(),...result});
    observations.push(o);await emit({type:'observation',observation:o});
  }
  for(let i=0;i<steps.length&&!signal?.aborted;i+=2)await Promise.all(steps.slice(i,i+2).map(step));
  if(run.workflow==='domain'&&!signal?.aborted){
    const addresses=observedAddresses(observations),pivots=addresses.slice(0,2).map((ip,i)=>({id:'route-'+i,adapter:'routing',subject:ip,label:'Route for '+ip}));
    await emit({type:'plan',steps:pivots,note:addresses.length>2?'Routing limited to the first two observed public IPs; other DNS observations are preserved.':'Routing pivots derive only from successful DNS observations.'});
    await Promise.all(pivots.map(step));
  }
  run.finishedAt=new Date().toISOString();run.status=terminalStatus(observations,signal?.aborted);
  await emit({type:'finish',status:run.status,finishedAt:run.finishedAt,providerRequests:WORKFLOWS[run.workflow].limit-ctx.remaining,observationCount:observations.length});
  return run;
}
export async function handleRequest(request,{fetcher=fetch,rateLimit=true,timeoutMs=6500,deadlineMs=35000}={}) {
  if(request.method==='GET')return json({engine:'Snail OSINT execution',version:ENGINE_VERSION,workflows:Object.keys(WORKFLOWS),mode:'bounded-public-records',storage:'no application database',maxSeconds:35});
  if(request.method!=='POST')return json({error:'Use POST for a scoped investigation.'},405);
  const origin=request.headers.get('Origin');
  if(!origin||origin!==new URL(request.url).origin)return json({error:'Same-origin request required.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON request required.'},415);
  let spec;
  try{spec=requestSpec(JSON.parse(await readLimited(request,2048)));}catch(e){return json({error:e.message},400);}
  // Edge-isolate burst control, deliberately not represented as a global quota.
  if(rateLimit&&!takeSlot(request.headers.get('CF-Connecting-IP')||'local'))return json({error:'Request limit reached. Try again in a minute.'},429);
  const abort=new AbortController();let seq=0,closed=false,timer;
  const stream=new ReadableStream({
    start(controller){
      const emit=async event=>{if(closed)return;controller.enqueue(new TextEncoder().encode(JSON.stringify({sequence:seq++,at:new Date().toISOString(),...event})+'\n'));};
      timer=setTimeout(()=>abort.abort(),deadlineMs);
      execute(spec,emit,{fetcher,signal:abort.signal,timeoutMs}).catch(async()=>{await emit({type:'fatal',message:'Execution stopped unexpectedly; collected observations remain available.'});}).finally(()=>{clearTimeout(timer);if(!closed){closed=true;controller.close();}});
    },
    cancel(){closed=true;clearTimeout(timer);abort.abort();},
  });
  return new Response(stream,{headers:{...headers,'Content-Type':'application/x-ndjson;charset=utf-8'}});
}
