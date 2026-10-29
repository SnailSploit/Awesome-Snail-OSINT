import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {telegramRecords,shodanRecords,hunterRecords,gitleaksRecords,jarRecords,aggregate,extract} from '../pipeline/core.mjs';

const channel={type:'public_channel',messages:[
  {id:11,type:'message',date_unixtime:'1760000000',text:'Archived on https://api.example.org/release; seller example.org'},
  {id:12,type:'message',date_unixtime:'1760001000',text:[{type:'plain',text:'API api.EXAMPLE.org'}]},
  {id:11,type:'message',date_unixtime:'1760000000',text:'Archived on https://api.example.org/release'}
]};
const bot={type:'personal_chat',messages:[{id:91,type:'message',from_id:'user9988',text:'A bot claims api.example.org exists.'},{id:92,type:'message',from_id:'user1234',text:'Operator asked about evil.example.net'}]};

test('public Telegram import preserves message identity and dedups identical evidence',()=>{
  const rows=telegramRecords(channel,{handle:'@public_feed',mode:'public'});
  const result=aggregate(rows);
  const host=result.entities.find(x=>x.type==='domain'&&x.value==='api.example.org');
  assert.equal(host.sources.length,2);
  assert.equal(host.sources[0].sourceUrl,'https://t.me/public_feed/11');
  assert.equal(result.overlaps.length,0); // A single public channel is not two independent sources.
  assert.ok(result.stats.duplicatesRemoved>0);
});

test('private Telegram chats cannot be imported as public channels; bot claims remain qualified',()=>{
  assert.throws(()=>telegramRecords(bot,{handle:'@public_feed',mode:'public'}));
  const rows=telegramRecords(bot,{handle:'@some_bot',mode:'bot',senderId:'user9988'});
  assert.ok(rows.some(x=>x.value==='api.example.org'));
  assert.ok(rows.every(x=>x.source.sourceUrl===null));
  assert.ok(rows.every(x=>/Unverified/.test(x.source.caveat)));
  assert.ok(!rows.some(x=>x.value==='evil.example.net'));
  assert.throws(()=>telegramRecords(bot,{handle:'@some_bot',mode:'bot'}));
  assert.throws(()=>telegramRecords(channel,{handle:'@some_bot',mode:'bot'}));
});

test('overlaps only different upstream sources, not multiple tool wrappers',()=>{
  const t=telegramRecords(channel,{handle:'@public_feed',mode:'public'});
  const h=shodanRecords({matches:[{ip_str:'8.8.8.8',hostnames:['api.example.org'],port:443,timestamp:'2026-10-28T12:00:00Z'}]});
  const both=aggregate([...t,...h,...h]);
  assert.deepEqual(both.overlaps.filter(x=>x.value==='api.example.org').map(x=>x.upstreams),[['telegram:public_feed','shodan']]);
  assert.ok(both.entities.some(x=>x.type==='ip'&&x.value==='8.8.8.8'));
});

test('Hunter import preserves local email case and normalizes domain only',()=>{
  const rows=hunterRecords({data:{emails:[{value:'Jane@Example.org',sources:[]},{value:'jane@EXAMPLE.ORG',sources:[]}]}});
  const result=aggregate(rows);
  assert.ok(result.entities.some(x=>x.value==='Jane@example.org'));
  assert.ok(result.entities.some(x=>x.value==='jane@example.org'));
});

test('Gitleaks import never copies secrets, matches or full provider payload',()=>{
  const raw=[{RuleID:'generic-api-key',File:'src/secret.py',StartLine:4,Commit:'abcd',Secret:'sk-super-sensitive-example',Match:'token: sk-super-sensitive-example'}];
  const rows=gitleaksRecords(raw);
  assert.equal(rows.length,1);
  assert.ok(!JSON.stringify(rows).includes('sk-super'));
  assert.ok(rows[0].value.startsWith('redacted:'));
  assert.deepEqual(rows[0].source.locator,{file:'src/secret.py',line:4,rule:'generic-api-key',commit:'abcd'});
});

test('ASNs and IPv6 are normalized and not dropped',()=>{
  assert.ok(extract('AS15169',{tool:'test',upstream:'x',recordId:'asn1'}).some(x=>x.type==='asn'&&x.value==='AS15169'));
  const rows=extract('2001:db8::1', {tool:'test',upstream:'source',recordId:'ip1'});
  assert.ok(rows.some(x=>x.type==='ip'&&x.value==='2001:db8::1'));
});

test('rejects malformed input and local TLD lookalikes',()=>{
  assert.throws(()=>shodanRecords({matches:'not array'}));
  assert.ok(!extract('file pom.xml API foo.local', {tool:'test',upstream:'x',recordId:'1'}).some(x=>x.type==='domain'));
});

test('static JAR inspector and CLI produce a merged pipeline without executing archive content',async()=>{
  const folder=await mkdtemp(join(tmpdir(),'snail-osint-test-'));
  const jar=join(folder,'app.jar'),channelPath=join(folder,'telegram.json'),out=join(folder,'result.json');
  const py=`import zipfile,sys\nwith zipfile.ZipFile(sys.argv[1],'w') as z:\n z.writestr('META-INF/MANIFEST.MF','Main-Class: org.acme.Main\\nImplementation-Version: 1.0\\n')\n z.writestr('config/app.properties','backend=https://api.example.org/v1\\n')\n z.writestr('org/acme/Main.class',b'not executable\\x00https://api.example.org/v1')\n`;
  let p=spawnSync('python3',['-c',py,jar],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);
  await writeFile(channelPath,JSON.stringify(channel));
  p=spawnSync('node',['scripts/osint_pipeline.mjs','--telegram-public',channelPath,'@public_feed','--jar',jar,'--out',out],{cwd:new URL('..',import.meta.url).pathname,encoding:'utf8'});
  assert.equal(p.status,0,p.stderr);
  const result=JSON.parse(await readFile(out,'utf8'));
  assert.equal(result.runs.length,2);
  assert.ok(result.entities.some(x=>x.type==='jar_sha256'));
  assert.ok(result.overlaps.some(x=>x.value==='api.example.org'));
  const again=spawnSync('node',['scripts/osint_pipeline.mjs','--telegram-public',channelPath,'@public_feed','--out',out],{cwd:new URL('..',import.meta.url).pathname,encoding:'utf8'});
  assert.notEqual(again.status,0); // No clobbering investigation outputs.
});

test('live collection requires explicit scope acknowledgment',()=>{
  const p=spawnSync('node',['scripts/osint_pipeline.mjs','--live-domain','example.org','--out','/tmp/do-not-write.json'],{cwd:new URL('..',import.meta.url).pathname,encoding:'utf8'});
  assert.notEqual(p.status,0);
  assert.match(p.stderr,/confirm-scope/);
});
