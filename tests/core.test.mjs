import test from 'node:test';
import assert from 'node:assert/strict';
import {safeURL,search,normalizeInput,makeQuery,loadPins,exportBoard,sha256} from '../site/core.mjs';
const r={id:'one',name:'Certificate logs',description:'Historical domain names',category:'Infrastructure',inputs:['domain'],outputs:['hostname'],review:{status:'documentation-reviewed'}};
test('search AND matches tokens and category',()=>{assert.equal(search([r],'domain logs').length,1);assert.equal(search([r],'domain', {category:'Research'}).length,0);assert.equal(search([r],'unfindable').length,0);});
test('safe URLs reject schemes and embedded credentials',()=>{for(const u of ['javascript:alert(1)','data:text/html,x','https://a:b@host.example'])assert.equal(safeURL(u),null);assert.ok(safeURL('https://example.com'));});
test('domain normalization does not permit query injection',()=>{assert.equal(normalizeInput(' EXAMPLE.com ','domain'),'example.com');for(const value of ['x.com OR country:US','https://example.com','a.com/path','a.com\nnet:0/0','127.0.0.1','-x.com','a..com'])assert.throws(()=>normalizeInput(value,'domain'));});
test('organization names are validated',()=>{assert.equal(normalizeInput('SnailSploit','organization'),'snailsploit');for(const v of ['org:x','a/b','x OR repo:z','-x','x-'])assert.throws(()=>normalizeInput(v,'organization'));});
test('query generation encodes the whole search expression',()=>{const q=makeQuery({input:'domain',kind:'text',template:'hostname:"{domain}"',launch:'https://www.shodan.io/search?query='},'example.com');assert.equal(q.query,'hostname:"example.com"');assert.equal(new URL(q.url).searchParams.get('query'),q.query);});
test('pins accept only known unique IDs',()=>{assert.deepEqual(loadPins('["source:one","bad","source:one"]',new Set(['source:one'])),['source:one']);assert.deepEqual(loadPins('{"x":1}',new Set()),[]);assert.deepEqual(loadPins('not-json',new Set()),[]);});
test('export labels saved items as a plan, not evidence',()=>{assert.match(exportBoard([], {resources:[],chains:[]}),/not evidence/);});

test("SHA-256 matches a standard known vector",async()=>{assert.equal(await sha256(new TextEncoder().encode("abc")),"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");});
