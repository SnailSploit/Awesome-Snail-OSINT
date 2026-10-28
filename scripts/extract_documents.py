#!/usr/bin/env python3
"""Local-only PDF/text/XMP extraction for Synthesis. Never uploads, executes PDF code, or OCRs."""
from __future__ import annotations
import argparse, hashlib, json, subprocess, sys, datetime
from pathlib import Path
from xml.etree import ElementTree

MM = '{http://ns.adobe.com/xap/1.0/mm/}'
REF = '{http://ns.adobe.com/xap/1.0/sType/ResourceRef#}'

def xmp_fields(data: bytes) -> dict:
    if len(data) > 500_000 or b'<!DOCTYPE' in data.upper() or b'<!ENTITY' in data.upper():
        raise ValueError('XMP byte limit or prohibited XML declaration.')
    root = ElementTree.fromstring(data)
    def field(name):
        for node in root.iter():
            if MM+name in node.attrib:
                return node.attrib[MM+name]
            if node.tag == MM+name:
                return (node.text or '').strip()
        return ''
    derived=[]
    for parent in root.iter(MM+'DerivedFrom'):
        for node in parent.iter():
            for name in ['documentID', 'originalDocumentID']:
                if REF+name in node.attrib: derived.append(node.attrib[REF+name])
                if node.tag == REF+name and node.text: derived.append(node.text.strip())
    return dict(documentId=field('DocumentID'), originalDocumentId=field('OriginalDocumentID'), instanceId=field('InstanceID'), derivedFrom=derived)

def extract(path: Path) -> dict:
    if path.stat().st_size > 10*1024*1024: raise ValueError('File exceeds 10 MiB.')
    raw = path.read_bytes()
    metadata = {}
    if path.suffix.lower() == '.pdf':
        from pypdf import PdfReader
        reader = PdfReader(path, strict=True)
        if reader.is_encrypted: raise ValueError('Encrypted PDFs are not opened.')
        if len(reader.pages) > 80: raise ValueError('PDF exceeds 80 pages.')
        text = ''
        for page in reader.pages:
            text += (page.extract_text() or '') + '\n'
            if len(text) > 100_000: raise ValueError('Extracted text exceeds 100,000 characters.')
        stream = reader.trailer['/Root'].get('/Metadata')
        if stream:
            metadata = xmp_fields(stream.get_object().get_data())
    elif path.suffix.lower() in ('.txt', '.md'):
        text = raw.decode('utf-8')
        sidecar = path.with_suffix('.xmp')
        if sidecar.exists(): metadata = xmp_fields(sidecar.read_bytes())
    else: raise ValueError('Use PDF, UTF-8 TXT, or Markdown with an optional same-name XMP sidecar.')
    if len(text) > 100_000: raise ValueError('Extracted text exceeds 100,000 characters.')
    return {'text':text, 'fileSha256':hashlib.sha256(raw).hexdigest(), **metadata}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('files', nargs='*', type=Path)
    p.add_argument('--control', nargs='*', type=Path, default=[])
    p.add_argument('-o', '--out', type=Path)
    p.add_argument('--worker', type=Path, help=argparse.SUPPRESS)
    args=p.parse_args()
    if args.worker:
        # Resource caps bound parsing of hostile/compressed files on POSIX hosts.
        try:
            import resource
            resource.setrlimit(resource.RLIMIT_AS,(1024**3,1024**3))
            resource.setrlimit(resource.RLIMIT_CPU,(20,20))
        except (ImportError, ValueError, OSError):
            pass
        print(json.dumps(extract(args.worker), ensure_ascii=False));return
    if not args.files or not args.out or len(args.files)+len(args.control)>16:
        p.error('Provide 1-16 subject/control files and -o evidence.json.')
    observations=[]
    for path,role in [(x,'subject') for x in args.files]+[(x,'control') for x in args.control]:
        outcome='ok';coverage='complete'
        try:
            child=subprocess.run([sys.executable,str(Path(__file__).resolve()),'--worker',str(path.resolve())],capture_output=True,text=True,timeout=25,check=True)
            payload=json.loads(child.stdout)
            if not payload.get('text','').strip(): outcome='empty'
        except (subprocess.SubprocessError,OSError,ValueError) as e:
            outcome='error';coverage='unknown'
            payload={'error':'Extraction failed or exceeded limits. '+type(e).__name__}
            print(f'{path.name}: {payload["error"]}',file=sys.stderr)
        observations.append(dict(kind='document',subject=path.name,observedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),sourceUrl='local:'+path.name,outcome=outcome,coverage=coverage,role=role,payload=payload))
    result={'schemaVersion':1,'technique':'document-lineage','observations':observations,'context':{},'extraction':'Local parser; extracted text can be incomplete. No OCR. Metadata is editable. Rendering/manual inspection is required for substantive claims.'}
    args.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Wrote {len(observations)} local observations to {args.out}. Import into Synthesis or run analyze_research.mjs.')
if __name__=='__main__': main()
