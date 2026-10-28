"""Extraction is local; these checks do not authenticate document metadata."""
import importlib.util, tempfile, unittest, subprocess, sys, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('extract_documents',ROOT/'scripts/extract_documents.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
XMP=b'''<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:mm="http://ns.adobe.com/xap/1.0/mm/" xmlns:ref="http://ns.adobe.com/xap/1.0/sType/ResourceRef#"><rdf:RDF><rdf:Description mm:DocumentID="uuid:report" mm:OriginalDocumentID="uuid:original"><mm:DerivedFrom ref:documentID="uuid:parent" /></rdf:Description></rdf:RDF></x:xmpmeta>'''
class DocumentExtractionTests(unittest.TestCase):
    def test_namespace_exact_lineage(self):
        r=m.xmp_fields(XMP);self.assertEqual(r['originalDocumentId'],'uuid:original');self.assertEqual(r['derivedFrom'],['uuid:parent'])
    def test_entities_and_doctype_refused(self):
        for x in [b'<!DOCTYPE x><x/>',b'<!ENTITY x SYSTEM "file:///etc/passwd">',b'x'*500001]:
            with self.assertRaises(ValueError):m.xmp_fields(x)
    def test_text_and_sidecar_hash_original_bytes(self):
        with tempfile.TemporaryDirectory() as t:
            p=Path(t)/'report.txt';p.write_text('Original UTF-8 text.');p.with_suffix('.xmp').write_bytes(XMP)
            r=m.extract(p);self.assertEqual(r['documentId'],'uuid:report');self.assertEqual(len(r['fileSha256']),64)
    def test_cli_captures_missing_file_as_error_without_upload(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);p=root/'report.txt';p.write_text('Original text.');out=root/'evidence.json'
            r=subprocess.run([sys.executable,str(ROOT/'scripts/extract_documents.py'),str(p),str(root/'missing.pdf'),'-o',str(out)],capture_output=True,text=True,timeout=35)
            self.assertEqual(r.returncode,0,r.stderr);v=json.loads(out.read_text());self.assertEqual([x['outcome'] for x in v['observations']],['ok','error']);self.assertTrue(all(x['sourceUrl'].startswith('local:') for x in v['observations']))
    def test_bounded_blank_pdf_is_empty_text_not_ocr(self):
        try:
            from pypdf import PdfWriter
        except ImportError:self.skipTest('Optional pypdf is not installed')
        with tempfile.TemporaryDirectory() as t:
            p=Path(t)/'blank.pdf';writer=PdfWriter();writer.add_blank_page(width=300,height=200)
            with p.open('wb') as f:writer.write(f)
            self.assertFalse(m.extract(p)['text'].strip())
if __name__=='__main__':unittest.main()
