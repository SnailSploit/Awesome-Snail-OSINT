/* Explicitly synthetic challenges, never a fallback for failed live collection. */
import {evidence} from './synthesis-core.mjs';
const date=n=>`2026-10-${String(n).padStart(2,'0')}T12:00:00Z`;
export async function challenge(technique){
  const observations=[];
  const add=async(kind,subject,payload,day=20,role='subject',coverage='complete')=>observations.push(await evidence({kind,subject,payload,observedAt:date(day),sourceUrl:kind==='document'?'local:'+subject:'https://'+subject+'/public-fixture',role,coverage}));
  if(technique==='app-trust'){
    const statement=cert=>({relation:['delegate_permission/common.handle_all_urls'],target:{namespace:'android_app',package_name:'com.example.bridge',sha256_cert_fingerprints:[cert.repeat(64)]}});
    await add('assetlinks','old.example.com',{statements:[statement('a')]},10);
    await add('assetlinks','old.example.com',{statements:[statement('a')]});
    await add('assetlinks','new.example.com',{statements:[statement('a')]});
    await add('assetlinks','lookalike.example.com',{statements:[statement('b')]});
  }else if(technique==='document-lineage'){
    const shared='The amber bridge inspection detected seven inverted pressure readings beneath the western support. Investigators recorded an unusual sequence of oscillations before the sealed sensor chamber was opened. The final calibration table retained the distinctive value 7319.42 despite a changed heading.';
    const boiler='This document is prepared solely for information and does not constitute independent professional advice for any specific situation.';
    await add('document','report-a.txt',{text:boiler+' '+shared+' Original discussion of river measurements.',documentId:'uuid:lineage-a',originalDocumentId:'uuid:seed'});
    await add('document','report-b.txt',{text:boiler+' '+shared+' Revised discussion of bridge measurements.',documentId:'uuid:lineage-b',originalDocumentId:'uuid:seed'});
    await add('document','unrelated.txt',{text:boiler+' Banana cultivation in northern fields depends on soil temperatures and rainfall records. Irrigation channels were inspected in spring.',documentId:'uuid:template'});
    await add('document','template.txt',{text:boiler,documentId:'uuid:template'},20,'control');
  }else if(technique==='operational-continuity'){
    for(const host of ['alpha.example.com','beta.example.com','unrelated.example.com'])await add('ads-txt',host,{text:'MANAGERDOMAIN=agency.example.com\nexchange.example.com, pub-001, DIRECT'});
    await add('sellers','exchange.example.com',{sellers:[{seller_id:'pub-001',seller_type:'INTERMEDIARY',domain:'agency.example.com',name:'Synthetic Agency'}]});
    for(const host of ['alpha.example.com','beta.example.com'])for(const[day,c]of[[10,'a'],[12,'b'],[14,'c']])await add('release',host,{signature:c.repeat(64),hashMethod:'sha256:raw-bytes',channel:'application-js',scope:'first-party',commonDependency:false},day);
    for(const[day,c]of[[10,'d'],[12,'e'],[14,'f']])await add('release','control.example.com',{signature:c.repeat(64),hashMethod:'sha256:raw-bytes',channel:'application-js',scope:'first-party',commonDependency:false},day,'control');
  }else throw Error('Unknown challenge.');
  return {schemaVersion:1,technique,observations,context:technique==='app-trust'?{event:{at:date(15),label:'Synthetic business separation',reference:'https://example.com/fictional-event'}}:{},fixture:true};
}
