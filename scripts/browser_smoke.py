from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import threading, json, hashlib, os
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]/'_site'
OUT=ROOT.parent/'.browser-test'; OUT.mkdir(exist_ok=True); report=[]
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/'
errors=[]
def ok(label): report.append(label); print('PASS',label)
try:
 with sync_playwright() as p:
  launch={'headless':True}
  if os.environ.get('CHROMIUM_EXECUTABLE'):launch['executable_path']=os.environ['CHROMIUM_EXECUTABLE']
  browser=p.chromium.launch(**launch)
  context=browser.new_context(viewport={'width':1440,'height':1120},device_scale_factor=1)
  page=context.new_page();errors=[];requests=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:requests.append(r.url))
  page.goto(BASE,wait_until='networkidle')
  page.get_by_role('button',name='Inspect crt.sh',exact=True).wait_for()
  assert page.locator('.card').count()==24
  ok('Initial catalog loads and paginates')
  page.screenshot(path=str(OUT/'atlas-desktop.png'),full_page=False)
  assert not [u for u in requests if not u.startswith(BASE)]
  ok('No automatic third-party requests, remote fonts or analytics')
  page.get_by_role('button',name='Save crt.sh to caseboard',exact=True).click()
  assert page.locator('#boardCount').inner_text()=='1'
  page.reload(wait_until='networkidle');assert page.locator('#boardCount').inner_text()=='1'
  ok('Caseboard pins persist through reload')
  page.locator('#search').fill('certificate');assert page.locator('.card').count()>0
  page.locator('#search').fill('no-match-xyz');assert page.locator('.empty').is_visible()
  page.locator('#resetFilters').click()
  page.locator('#accessFilter').select_option('Local / open source');assert page.locator('.card').count()==2
  page.locator('#resetFilters').click()
  ok('Search, empty state, access filters and reset work')
  page.get_by_role('button',name='Inspect crt.sh',exact=True).click();assert page.locator('#detail[open]').count()==1
  assert page.locator('#detailBody').get_by_text('The inference boundary').is_visible()
  page.keyboard.press('Escape');assert page.locator('#detail[open]').count()==0
  ok('Source dossier and native Escape dismissal work')
  page.keyboard.press('Control+k');page.locator('#paletteInput').fill('domain beginning')
  page.locator('.paletteresult').first.click();assert 'A domain is only' in page.locator('#detailBody h2').inner_text()
  assert page.locator('.step').count()==4
  page.screenshot(path=str(OUT/'atlas-chain.png'),full_page=False)
  page.keyboard.press('Escape')
  ok('Command palette finds chains and opens four-step playbook')
  page.locator('#boardOpen').click()
  with page.expect_download() as d:page.get_by_role('button',name='Export Markdown',exact=True).click()
  d.value.save_as(str(OUT/'sample-plan.md'));assert 'crt.sh' in (OUT/'sample-plan.md').read_text()
  page.keyboard.press('Escape')
  ok('Caseboard Markdown export contains selected sources')
  page.locator('.navitem[data-view="chains"]').click();assert page.locator('.chaincard').count()==10
  page.locator('.navitem[data-view="fieldcraft"]').click();assert page.locator('.craftcard').count()==20
  ok('Chains and fieldcraft navigation renders complete collections')
  page.locator('.navitem[data-view="lab"]').click();page.locator('#queryInput').fill('example.com');page.locator('#generateQueries').click()
  assert page.locator('.queryrow').count()==4
  page.locator('#queryInput').fill('example.com OR port:22');page.locator('#generateQueries').click();assert page.locator('.laberror').count()==1
  page.locator('#queryKind').select_option('organization');page.locator('#queryInput').fill('SnailSploit');page.locator('#generateQueries').click();assert page.locator('.queryrow').count()==2
  ok('Six domain/org recipes work; query-injection input is rejected')
  page.locator('#evidenceFile').set_input_files({'name':'evidence.txt','mimeType':'text/plain','buffer':b'abc'})
  page.locator('#hashResult code').wait_for();assert page.locator('#hashResult code').inner_text()==hashlib.sha256(b'abc').hexdigest()
  with page.expect_download() as d:page.get_by_role('button',name='Export receipt',exact=True).click()
  d.value.save_as(str(OUT/'sample-receipt.json'));assert json.loads((OUT/'sample-receipt.json').read_text())['bytes']==3
  ok('SHA-256 matches known vector and local receipt exports')
  page.goto(BASE+'#view=atlas&query=crt.sh',wait_until='networkidle');expect(page.locator('.card')).to_have_count(1)
  ok('Shareable catalog hash links restore search state')
  page.goto(BASE+'#view=atlas&query=%3Cscript%3E',wait_until='networkidle');assert page.locator('.empty').is_visible();assert not errors
  ok('HTML-like search input is treated as inert text')
  for width in [390,768,1024]:
   page.set_viewport_size({'width':width,'height':844})
   page.goto(BASE,wait_until='networkidle')
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(width,page.evaluate('document.documentElement.scrollWidth'))
   if width==390:
    page.screenshot(path=str(OUT/'atlas-mobile.png'),full_page=True)
    page.locator('.navitem[data-view="lab"]').click();assert page.locator('#queryInput').is_visible()
   ok(f'Responsive layout fits {width}px without horizontal overflow')
  assert not errors,errors
  ok('No browser JavaScript errors during tested interactions')
  browser.close()
finally:
 server.shutdown()
 (OUT/'browser-results.json').write_text(json.dumps({'passed':len(report),'checks':report,'errors':errors},indent=2))
print('Total browser checks:',len(report))
