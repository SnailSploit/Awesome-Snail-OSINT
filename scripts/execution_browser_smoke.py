"""Real HTTP/UI integration. Local runs use fixture upstreams; ATLAS_BASE_URL tests production."""
from pathlib import Path
import os, subprocess, json, hashlib
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'.browser-test';OUT.mkdir(exist_ok=True)
BASE=os.environ.get('ATLAS_BASE_URL'); live=bool(BASE); process=None; report=[]; errors=[]
if not BASE:
    process=subprocess.Popen(['node','scripts/serve_atlas.mjs'],cwd=ROOT,env={**os.environ,'ATLAS_TEST_FIXTURES':'1','PORT':'0'},stdout=subprocess.PIPE,text=True)
    BASE=json.loads(process.stdout.readline())['base']
BASE=BASE.rstrip('/')+'/'
def ok(name):report.append(name);print('PASS',name,flush=True)
try:
    with sync_playwright() as p:
        launch={'headless':True}
        if os.environ.get('CHROMIUM_EXECUTABLE'):launch['executable_path']=os.environ['CHROMIUM_EXECUTABLE']
        browser=p.chromium.launch(**launch); context=browser.new_context(viewport={'width':1440,'height':1120},accept_downloads=True)
        page=context.new_page();page.set_default_timeout(60000);requests=[]
        page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append((r.method,r.url)))
        page.goto(BASE+'#view=run',wait_until='networkidle');expect(page.locator('#runExecute')).to_be_visible()
        assert not [u for m,u in requests if m=='POST'];ok('No investigation or provider query starts on page load')
        page.locator('#runTarget').fill('snailsploit.com' if live else 'atlas.example.com');page.locator('#runExecute').click();expect(page.locator('#runNotice')).to_contain_text('Confirm scope')
        assert not [u for m,u in requests if m=='POST'];ok('Consent is required before issuing a request')
        page.locator('#runConsent').check();page.locator('#runWorkflow').select_option('ip');page.locator('#runTarget').fill('127.0.0.1');page.locator('#runExecute').click();expect(page.locator('#runNotice')).to_contain_text('excluded')
        assert not [u for m,u in requests if m=='POST'];ok('Private and loopback targets are rejected before execution')
        page.locator('#runWorkflow').select_option('domain');page.locator('#runTarget').fill('snailsploit.com' if live else 'atlas.example.com');page.locator('#runExecute').click()
        expect(page.locator('#runExecute')).to_be_enabled(timeout=65000)
        assert page.locator('#runStatus').text_content() in ['completed','partial'],page.locator('#runNotice').inner_text()
        assert page.locator('.run-observation[data-status="ok"]').count()>=3
        assert page.locator('svg.run-graph .run-edge').count()>0
        assert 'snailsploit.com' not in page.url and 'example.com' not in page.url
        ok('Domain workflow produces captured observations and an evidence-linked graph')
        page.screenshot(path=str(OUT/('execution-live.png' if live else 'execution-fixture.png')),full_page=False)
        page.locator('.run-observation').first.click();expect(page.locator('#runEvidenceDetail')).to_be_visible();expect(page.locator('.run-hash')).to_have_text(__import__('re').compile(r'^[a-f0-9]{64}$'))
        ok('Observation inspector exposes timestamps, provider URLs and integrity digests')
        with page.expect_download() as d:page.get_by_role('button',name='Export evidence JSON',exact=True).click()
        file=OUT/('execution-live.json' if live else 'execution-fixture.json');d.value.save_as(str(file));bundle=json.loads(file.read_text());digest=bundle.pop('sha256')
        assert hashlib.sha256(json.dumps(bundle,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()==digest
        assert bundle['graph']['edges'];assert all(e['evidence'] for e in bundle['graph']['edges'])
        ok('Downloaded evidence bundle hash independently verifies in Python')
        with page.expect_download() as d:page.get_by_role('button',name='Export report Markdown',exact=True).click()
        d.value.save_as(str(OUT/'execution-report.md'));assert '## Source observations' in (OUT/'execution-report.md').read_text()
        ok('Markdown report contains executed observations rather than a saved plan')
        page.get_by_role('button',name='Save on this browser',exact=True).click();expect(page.locator('#runNotice')).to_contain_text('Snapshot saved')
        before=sum(m=='POST' for m,u in requests);page.reload(wait_until='networkidle');page.locator('.run-library summary').click();page.locator('#savedRuns .saved-run .textbutton').first.click();expect(page.locator('#runNotice')).to_contain_text('snapshot loaded')
        assert sum(m=='POST' for m,u in requests)==before;ok('IndexedDB snapshot survives reload and loads without network execution')
        page.locator('#runImport').set_input_files(str(file));expect(page.locator('#runNotice')).to_contain_text('Imported locally');assert sum(m=='POST' for m,u in requests)==before
        altered=json.loads(file.read_text());altered['run']['target']='changed.example.com';page.locator('#runImport').set_input_files({'name':'tampered.json','mimeType':'application/json','buffer':json.dumps(altered).encode()});expect(page.locator('#runNotice')).to_contain_text('Invalid or altered')
        ok('Local JSON replay works; tampered evidence is rejected')
        for kind,value in [('mail','snailsploit.com' if live else 'atlas.example.com'),('ip','8.8.8.8')]:
            page.locator('#runWorkflow').select_option(kind);page.locator('#runTarget').fill(value);page.locator('#runConsent').check();page.locator('#runExecute').click();expect(page.locator('#runExecute')).to_be_enabled(timeout=65000)
            assert page.locator('#runStatus').text_content() in ['completed','partial'],page.locator('#runNotice').inner_text()
            assert page.locator('.run-observation').count()==(3 if kind=='mail' else 2)
            ok(kind+' workflow executes its actual bounded collector plan')
        page.locator('#runWorkflow').select_option('domain');page.locator('#runTarget').fill('snailsploit.com' if live else 'atlas.example.com');page.locator('#runExecute').click();expect(page.locator('#runStop')).to_be_enabled();page.locator('#runStop').click();expect(page.locator('#runExecute')).to_be_enabled();expect(page.locator('#runNotice')).to_contain_text('stopped')
        ok('Stop aborts browser collection without discarding received observations')
        for width in [390,768,1024]:
            page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
            ok('Execution workspace fits '+str(width)+'px')
        assert not errors,errors;ok('No JavaScript errors across execution, replay, exports or cancellation')
        browser.close()
finally:
    if process:process.terminate();process.wait(timeout=5)
    (OUT/('execution-live-results.json' if live else 'execution-browser-results.json')).write_text(json.dumps({'mode':'live providers' if live else 'real local HTTP with deterministic test providers','passed':len(report),'checks':report,'errors':errors},indent=2))
print('Execution browser checks:',len(report))
