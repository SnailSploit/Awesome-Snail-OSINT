/* Pure functions: deterministic search, safe query generation and export. No network. */
export const REVIEWED = 'documentation-reviewed';
export function safeURL(raw) {
  try { const u = new URL(raw); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null; }
  catch { return null; }
}
export const textOf = r => [r.name,r.title,r.category,r.description,r.body,r.origin,...(r.inputs||[]),...(r.outputs||[])].filter(Boolean).join(' ').toLowerCase();
export function search(items, term='', filters={}) {
  const words = term.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(r => (!filters.category || r.category === filters.category)
    && (!filters.access || r.access === filters.access)
    && (!filters.review || r.review?.status === filters.review)
    && (!filters.input || r.inputs?.some(t => t.toLowerCase() === filters.input.toLowerCase()) || r.input?.toLowerCase() === filters.input.toLowerCase())
    && words.every(w => textOf(r).includes(w)))
    .map((r,i) => ({r,i,score:words.reduce((v,w)=>v+((r.name||r.title||'').toLowerCase().includes(w)?8:1),0)+(r.review?.status===REVIEWED?2:0)}))
    .sort((a,b)=>b.score-a.score||a.i-b.i).map(x=>x.r);
}
export function normalizeInput(value, kind) {
  const v = value.trim().toLowerCase();
  if (kind === 'organization') {
    if (!/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(v) || v.includes('--')) throw new Error('Enter a GitHub organization name, without a URL or search operators.');
    return v;
  }
  if (v.length>253 || !v.includes('.') || /[\s/:@?#%]/.test(v) || !v.split('.').every(s=>s.length>0&&s.length<=63&&/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(s)) || /^\d+(\.\d+){3}$/.test(v)) {
    throw new Error('Enter a plain domain such as example.com. Do not include a URL, path, IP address or search operators.');
  }
  return v;
}
export function makeQuery(spec, raw) {
  const value = normalizeInput(raw,spec.input);
  const query = spec.template.replaceAll('{'+spec.input+'}',value);
  const url = spec.kind==='url' ? query : spec.launch+encodeURIComponent(query);
  if (!safeURL(url)) throw new Error('Unsafe query destination.');
  return {query,url};
}
export function loadPins(raw, known) {
  try { const v=JSON.parse(raw||'[]'); return Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string'&&known.has(x)))].slice(0,250):[]; }
  catch { return []; }
}
export function exportBoard(pins, data) {
  const sources=data.resources.filter(x=>pins.includes('source:'+x.id));
  const chains=data.chains.filter(x=>pins.includes('chain:'+x.id));
  const lines=['# Snail OSINT / Research plan','','This is a saved plan, not evidence that any research was performed.','Exported: '+new Date().toISOString(),'','## Sources'];
  for (const r of sources) lines.push('',`### ${r.name}`,r.url,`Purpose: ${r.description}`,`Provenance: ${r.origin}`,`Review: ${r.review.status}; ${r.review.date||'not dated'}`,`Limitation: ${r.caveat}`,`Reference: ${r.reference}`);
  lines.push('','## Investigation chains');
  for(const c of chains){lines.push('',`### ${c.title}`,`Input: ${c.input}`,`Intended outcome: ${c.outcome}`);c.steps.forEach((s,i)=>lines.push('',`${i+1}. ${s.title}`,s.action,`Expected output: ${s.output}`,`Do not infer: ${s.trap}`,`Fallback: ${s.fallback}`,`Sources: ${s.sources.map(id=>data.resources.find(r=>r.id===id)?.url||id).join(', ')}`));}
  return lines.join('\n')+'\n';
}

export async function sha256(bytes) {
  if (!globalThis.crypto?.subtle) throw new Error("SHA-256 requires HTTPS or localhost.");
  const digest=await globalThis.crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
