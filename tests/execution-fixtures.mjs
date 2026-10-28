// Deterministic provider responses for tests ONLY. Never imported by production code.
export function fakeFetcher({failRouting=false,delay=0,badDNS=false}={}) {
  return async (url,options={})=>{
    if(delay)await new Promise((resolve,reject)=>{const t=setTimeout(resolve,delay);options.signal?.addEventListener('abort',()=>{clearTimeout(t);reject(new DOMException('aborted','AbortError'));},{once:true});});
    const u=new URL(url);let body;
    if(u.hostname==='digitalassetlinks.googleapis.com'){
      const site=u.searchParams.get('source.web.site');body={maxAge:'60s',statements:[{source:{web:{site}},relation:'delegate_permission/common.handle_all_urls',target:{androidApp:{packageName:'com.example.fixture',certificate:{sha256Fingerprint:(site.includes('lookalike')?'b':'a').repeat(64)}}}}]};
    }else if(u.hostname==='dns.google'){
      const name=u.searchParams.get('name'),type=u.searchParams.get('type'),types={A:1,AAAA:28,CNAME:5,NS:2,MX:15,TXT:16,CAA:257};
      const records={A:['8.8.8.8'],AAAA:['2001:4860:4860::8888'],CNAME:[],NS:['ns1.example.com.'],MX:['10 mail.example.com.'],TXT:name.startsWith('_dmarc.')?['"v=DMARC1; p=none"']:['"v=spf1 -all"'],CAA:['0 issue "example.com"']};
      body={Status:0,TC:false,AD:true,Question:[{name:(badDNS?'unrelated.example':name)+'.',type:types[type]}],Answer:records[type].map(data=>({name:name+'.',type:types[type],TTL:300,data}))};
    }else if(u.hostname==='data.iana.org'){
      body=u.pathname.endsWith('dns.json')?{publication:'2026-10-22T23:00:04Z',services:[[['com'],['https://rdap.verisign.com/com/v1/']]]}:{publication:'2019-06-07T19:00:02Z',services:[[['8.0.0.0/8','2001:4860::/32'],['https://rdap.arin.net/registry/']]]};
    }else if(u.hostname==='rdap.verisign.com'){
      body={objectClassName:'domain',ldhName:decodeURIComponent(u.pathname.split('/').at(-1)).toUpperCase(),status:['active'],nameservers:[{ldhName:'ns1.example.com'}],events:[{eventAction:'registration',eventDate:'2000-01-01T00:00:00Z'}],entities:[{vcardArray:['secret','NEVER RETAIN CONTACT DATA']}],secureDNS:{delegationSigned:true}};
    }else if(u.hostname==='rdap.arin.net'){
      const ipv6=u.pathname.includes('%3A');body={objectClassName:'ip network',name:'TEST-FIXTURE-NETWORK',handle:'FIXTURE',startAddress:ipv6?'2001:4860::':'8.0.0.0',endAddress:ipv6?'2001:4860:ffff:ffff:ffff:ffff:ffff:ffff':'8.255.255.255',ipVersion:ipv6?'v6':'v4',country:'US',entities:[{secret:'NEVER RETAIN CONTACT DATA'}]};
    }else if(u.hostname==='stat.ripe.net'){
      if(failRouting)return new Response('Rate limit',{status:429});
      const ip=u.searchParams.get('resource');body={status:'ok',time:'2026-10-28T12:00:00Z',data:{prefix:ip.includes(':')?'2001:4860::/32':'8.8.8.0/24',asns:['15169']}};
    }else throw new Error('Unexpected test destination: '+url);
    return new Response(JSON.stringify(body),{headers:{'Content-Type':'application/json'}});
  };
}
