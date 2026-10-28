#!/usr/bin/env node
/* Local real executor + static assets. Binds loopback only; tests opt into isolated fixtures. */
import http from 'node:http';import {readFile} from 'node:fs/promises';import {resolve,extname,sep} from 'node:path';import {fileURLToPath} from 'node:url';import {Readable} from 'node:stream';import {once} from 'node:events';
import {handleRequest} from '../server/engine.mjs';
import {handleSynthesis} from '../server/synthesis.mjs';
const root=fileURLToPath(new URL('../_site/',import.meta.url));
const fixtures=process.env.ATLAS_TEST_FIXTURES==='1';
const opts=fixtures?{rateLimit:false,fetcher:(await import('../tests/execution-fixtures.mjs')).fakeFetcher({delay:80})}:{};
const types={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.json':'application/json','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
  try{
    const base='http://127.0.0.1:'+server.address().port,url=new URL(req.url,base);
    if(['/api/investigate','/api/synthesis'].includes(url.pathname)){
      const request=new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Readable.toWeb(req),duplex:'half'})});
      const response=await (url.pathname==='/api/synthesis'?handleSynthesis:handleRequest)(request,opts);res.writeHead(response.status,Object.fromEntries(response.headers));
      if(response.body){const reader=response.body.getReader();res.on('close',()=>reader.cancel().catch(()=>{}));try{while(true){const{value,done}=await reader.read();if(done)break;if(!res.write(value))await once(res,'drain');}}finally{reader.releaseLock();}}
      res.end();return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!path.startsWith(root.endsWith(sep)?root:root+sep))throw new Error('Path denied');
    const body=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:body);
  }catch{if(!res.headersSent)res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT||8080),'127.0.0.1',()=>console.log(JSON.stringify({base:'http://127.0.0.1:'+server.address().port+'/',fixtures})));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
