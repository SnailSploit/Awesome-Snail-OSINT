import copy
import importlib.util
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('atlas',ROOT/'scripts/build_atlas.py')
atlas=importlib.util.module_from_spec(spec);spec.loader.exec_module(atlas)

class AtlasTests(unittest.TestCase):
    def test_catalog_and_references(self):
        d=atlas.load_data(ROOT,True)
        self.assertGreaterEqual(len(d['resources']),31)
        self.assertEqual(len(d['chains']),10)
        self.assertEqual(len(d['fieldcraft']),20)
    def test_legacy_import_keeps_status_and_merges_urls(self):
        md='## Website Security\n- [One](https://a.example/)\n- [Same](https://www.a.example)\n## Table of Contents\n- [Ignore](https://ignore.example)\n```\n- [Fake](https://fake.example)\n```\n'
        records=atlas.import_legacy(md,[])
        self.assertEqual(len(records),1)
        self.assertEqual(records[0]['review']['status'],'legacy-unreviewed')
        self.assertIsNone(records[0]['review']['date'])
        self.assertEqual(len(records[0]['legacyLocations']),2)
    def test_enriched_precedence(self):
        d=atlas.load_data(ROOT,True)
        r=d['resources'][0]
        result=atlas.import_legacy('## Website Security\n- [Alias]('+r['url']+')\n',[r])
        self.assertEqual(len(result),1)
        self.assertEqual(result[0]['review']['status'],'documentation-reviewed')
    def test_unsafe_urls(self):
        for url in ['javascript:alert(1)','data:text/html,hi','https://user:pass@example.com','https://bad host.example']:
            self.assertFalse(atlas.http_url(url))
    def test_rejects_broken_chain_reference(self):
        d=atlas.load_data(ROOT,True)
        d['chains'][0]['steps'][0]['sources']=['missing']
        with self.assertRaises(ValueError):atlas.validate(d)
    def test_rejects_undated_review(self):
        d=atlas.load_data(ROOT,True);d['resources'][0]['review']['date']=None
        with self.assertRaises(ValueError):atlas.validate(d)
    def test_rejects_duplicate_resource(self):
        d=atlas.load_data(ROOT,True);d['resources'].append(copy.deepcopy(d['resources'][0]))
        with self.assertRaises(ValueError):atlas.validate(d)
    def test_import_ignores_fenced_examples(self):
        md='## Website Security\n~~~md\n- [Fake](https://fake.example)\n~~~\n- [Real](https://real.example)\n'
        self.assertEqual([r['name'] for r in atlas.import_legacy(md,[])],['Real'])
if __name__=='__main__':unittest.main()
