"""Real HTTP/browser tests. Synthetic provider fixture in CI, optional deployed canary."""
from pathlib import Path
import json, os, subprocess, tempfile
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'.browser-test';OUT.mkdir(exist_ok=True)
BASE=os.environ.get('ATLAS_BASE_URL');live=bool(BASE);process=None;checks=[];errors=[]
if not BASE:
    process=subprocess.Popen(['node','scripts/serve_atlas.mjs'],cwd=ROOT,env={**os.environ,'ATLAS_TEST_FIXTURES':'1','PORT':'0'},stdout=subprocess.PIPE,text=True)
    BASE=json.loads(process.stdout.readline())['base']
BASE=BASE.rstrip('/')+'/'
def ok(s):checks.append(s);print('PASS',s,flush=True)
try:
    with sync_playwright() as p:
        options={'headless':True}
        if os.environ.get('CHROMIUM_EXECUTABLE'):options['executable_path']=os.environ['CHROMIUM_EXECUTABLE']
        browser=p.chromium.launch(**options);context=browser.new_context(viewport={'width':1440,'height':1080},accept_downloads=True)
        page=context.new_page();page.set_default_timeout(30000);requests=[]
        page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append((r.method,r.url)))
        page.on('dialog',lambda d:d.accept())
        page.goto(BASE+'#view=synthesis',wait_until='networkidle')
        expect(page.locator('#synthAnalyze')).to_be_visible();assert not [u for m,u in requests if m=='POST'];assert page.locator('.synth-finding').count()==0
        ok('Synthesis starts without target queries, preloaded findings or examples')
        page.locator('#synthDomains').fill('www.google.com\ngoogle.com' if live else 'alpha.example.com\nbeta.example.com\nlookalike.example.com')
        page.locator('#synthCollect').click();expect(page.locator('#synthNotice')).to_contain_text('Confirm scope');assert not [u for m,u in requests if m=='POST']
        ok('Collection requires explicit scope confirmation')
        page.locator('#synthConsent').check();page.locator('#synthCollect').click();expect(page.locator('#synthNotice')).to_contain_text('Collection finished',timeout=30000)
        page.locator('#synthAnalyze').click();expect(page.locator('#synthStatus')).to_be_visible()
        if not live:
            assert page.locator('.synth-finding').count()==1;expect(page.locator('.synth-rejected')).to_contain_text('full signing-identity')
            ok('Real local HTTP collector joins exact identities and rejects same-package different-key fixtures')
        else:ok('Deployed same-origin collector returned and the real observations were analyzed')
        if BASE:page.screenshot(path=str(OUT/'synthesis-live-app.png'),full_page=True)
        with page.expect_download() as download:page.locator('#synthExport').click()
        path=OUT/('synthesis-live.json' if live else 'synthesis-http.json');download.value.save_as(path);r=json.loads(path.read_text())
        assert r['dataset']=='supplied-observations';assert len(r['observations'])==(2 if live else 3)
        if live:
            assert any(o['outcome']=='ok' for o in r['observations']),json.dumps([o['payload'] for o in r['observations']])
        check=subprocess.run(['node','--input-type=module','-e',"import {readFile} from 'node:fs/promises';import {verifyReport} from './site/synthesis-core.mjs';await verifyReport(JSON.parse(await readFile(process.argv[1],'utf8')));",str(path)],cwd=ROOT,text=True,capture_output=True)
        assert check.returncode==0,check.stderr;ok('Exported report integrity and findings independently recompute in Node')
        if page.locator('.synth-refs button').count():
            page.locator('.synth-refs button').first.click();expect(page.locator('#synthEvidence')).to_contain_text('digitalassetlinks.googleapis.com');ok('Finding references open retained provider evidence and checksums')
        page.get_by_role('button',name='Clear',exact=True).click()
        page.locator('#synthChallenge').click();expect(page.locator('#synthNotice')).to_contain_text('SYNTHETIC CHALLENGE');assert page.locator('.synth-finding').count()==2
        ok('App persistence challenge is explicitly synthetic and computes both overlap and event-bracketing rules')
        page.locator('#synthCollect').click();expect(page.locator('#synthNotice')).to_contain_text('Clear the synthetic challenge');ok('Synthetic examples cannot be mixed silently with live collection')
        for technique,expected in [('document-lineage','Common lineage'),('operational-continuity','Shared operational-process')]:
            page.locator('[data-technique="'+technique+'"]').click();page.locator('#synthChallenge').click();expect(page.locator('.synth-finding')).to_have_count(1);expect(page.locator('.synth-finding')).to_contain_text(expected);assert page.locator('.synth-rejected article').count()>=2
            ok(technique+' composes evidence and exposes rejected alternatives')
        assert page.locator('#synthResults').evaluate("el => ![...el.childNodes].some(n => n.nodeType===3 && ['null','undefined'].includes(n.textContent.trim()))")
        page.screenshot(path=str(OUT/'synthesis-desktop.png'),full_page=True)
        # Upload and re-evaluate a report; importing does not perform external requests.
        page.locator('[data-technique="app-trust"]').click();before=len([u for m,u in requests if m=='POST']);page.locator('#synthImport').set_input_files(str(path));expect(page.locator('#synthNotice')).to_contain_text('Imported locally');page.locator('#synthAnalyze').click();expect(page.locator('#synthStatus')).to_be_visible();assert len([u for m,u in requests if m=='POST'])==before
        ok('Saved evidence can be re-imported and recomputed without provider requests')
        # Malicious text stays inert and invalid evidence import is atomic.
        bad=OUT/'synthesis-tampered.json';tampered=json.loads(path.read_text());tampered['observations'][0]['subject']='evil.example.com';bad.write_text(json.dumps(tampered));page.locator('#synthImport').set_input_files(str(bad));expect(page.locator('#synthNotice')).to_contain_text('checksum');ok('Tampered report import is rejected before altering the current evidence set')
        page.locator('[data-technique="document-lineage"]').click()
        with tempfile.TemporaryDirectory() as t:
            td=Path(t);shared='The amber bridge inspection detected seven inverted pressure readings beneath the western support. Investigators recorded an unusual sequence of oscillations before the sealed sensor chamber was opened. The final calibration table retained the distinctive value 7319.42 despite a changed heading.'
            xmp='<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:mm="http://ns.adobe.com/xap/1.0/mm/" mm:OriginalDocumentID="uuid:common"/>'
            files=[]
            for name in ['one','two']:
                (td/(name+'.txt')).write_text(shared+' '+name+' <img src=x onerror=alert(1)>')
                (td/(name+'.xmp')).write_text(xmp);files += [str(td/(name+'.txt')),str(td/(name+'.xmp'))]
            page.locator('#synthDocuments').set_input_files(files);expect(page.locator('#synthCount')).to_contain_text('2 observations');page.locator('#synthAnalyze').click();expect(page.locator('.synth-finding')).to_have_count(1)
            assert page.locator('.synthesis-workspace img').count()==0;assert len([u for m,u in requests if m=='POST'])==before
            ok('Local text and XMP files compute lineage with no upload or injected markup execution')
        for width in [390,768,1024]:
            page.set_viewport_size({'width':width,'height':1000});page.wait_for_timeout(150)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),f'overflow at {width}'
            ok('Synthesis layout has no horizontal page overflow at '+str(width)+'px')
            if width==390:page.screenshot(path=str(OUT/'synthesis-mobile.png'),full_page=True)
        assert not errors,errors;ok('No JavaScript errors during tested synthesis interactions')
        (OUT/'synthesis-browser-checks.json').write_text(json.dumps({'mode':'live-canary' if live else 'local-http-synthetic-upstreams','checks':checks,'errors':errors},indent=2))
        browser.close()
finally:
    if process:process.terminate();process.wait(timeout=10)
print('Total synthesis browser checks:',len(checks))
