#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {analyze,evidence,markdown} from '../site/synthesis-core.mjs';
try{
  const file=process.argv[2],i=process.argv.indexOf('--out'),out=i>=0?process.argv[i+1]:null;
  if(!file||!out)throw Error('Usage: node scripts/analyze_research.mjs evidence.json --out report.json');
  const text=await readFile(file,'utf8');if(text.length>2*1024*1024)throw Error('Evidence set exceeds 2 MiB.');const input=JSON.parse(text);
  if(!Array.isArray(input.observations))throw Error('Missing observations.');
  input.observations=await Promise.all(input.observations.map(r=>r.id?r:evidence(r)));
  const report=await analyze(input);await writeFile(out,JSON.stringify(report,null,2)+'\n');await writeFile(out.replace(/\.json$/,'')+'.md',markdown(report));
  console.log(JSON.stringify({status:report.status,findings:report.findings.length,rejected:report.rejected.length,inputDigest:report.inputDigest}));
}catch(e){console.error(e.message);process.exitCode=1;}
