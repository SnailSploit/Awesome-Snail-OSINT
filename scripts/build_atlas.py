#!/usr/bin/env python3
"""Build a dependency-free OSINT atlas and import the legacy README without upgrading its review status."""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
IGNORED = {'Start here', 'Choose your starting point', 'Table of Contents', 'Documentation & Author', 'The investigation atlas'}
CATEGORY_MAP = {
    'Alternative Website Security Search': 'Infrastructure', 'Website Security': 'Infrastructure',
    'Email Search': 'Public profiles', 'Android and iOS Emulator': 'Toolkits', 'RSS and Feed': 'News & signals',
    'OSINT Tools & Dashboards': 'Toolkits', 'Credit Card / BIN Info': 'Companies & money', 'WhatsApp': 'Public profiles',
    'Identifying Combatant Affiliation': 'Research', 'Clubhouse': 'Public profiles', 'Facebook': 'Public profiles',
    'Country': 'Public records', 'Note Capture & Screenshots': 'Archives', 'Geo Tools': 'Geospatial',
    'Monitoring News, Conflicts & Web': 'News & signals', 'Drones & Webcams Databases': 'Geospatial',
    'Scientific Search Engines': 'Research', 'OSINT Collections': 'Toolkits', 'License Plate': 'Public records',
    'Phone Numbers': 'Public profiles', 'Toolkits': 'Toolkits', 'Social Media Search': 'Public profiles',
    'ID Generators': 'Toolkits', 'Crypto': 'Companies & money', 'Research and Investigative Tools': 'Research',
    'Search Engine Dorks': 'Search methods', 'Exploits': 'AI & code', 'Others': 'Toolkits',
    'Deep & Dark Web': 'Search methods', 'Telegram': 'Public profiles', 'Instagram': 'Public profiles',
    'Snapchat': 'Public profiles', 'Skype': 'Public profiles', 'Materials / MAC': 'Infrastructure',
    'Default Passwords': 'Infrastructure', 'Document Validation': 'Public records',
    'Training and Learning': 'Toolkits', 'Additional Awesome Repositories': 'Toolkits',
}

def http_url(value: str) -> bool:
    try:
        p = urlsplit(value)
        return (p.scheme in ('http', 'https') and bool(p.hostname) and not p.username and not p.password
                and not any(c.isspace() for c in value))
    except (ValueError, AttributeError):
        return False

def canonical(value: str) -> str:
    p = urlsplit(value)
    host = p.netloc.lower().removeprefix('www.')
    return urlunsplit(('https', host, p.path.rstrip('/'), p.query, ''))

def import_legacy(text: str, enriched: list[dict]) -> list[dict]:
    result = [dict(r) for r in enriched]
    by_url = {canonical(r['url']): r for r in result}
    section, subsection, fence = '', '', None
    for number, line in enumerate(text.splitlines(), 1):
        f = re.match(r'^\s{0,3}(`{3,}|~{3,})', line)
        if f:
            token = f[1]
            if fence is None:
                fence = token
            elif token[0] == fence[0] and len(token) >= len(fence):
                fence = None
            continue
        if fence:
            continue
        if line.startswith('## '):
            section, subsection = line[3:].strip(), ''
            continue
        if line.startswith('### '):
            subsection = line[4:].strip()
        match = re.match(r'^[-*] \[([^\]]+)\]\((https?://[^\s)]+)\)', line)
        if not match or section not in CATEGORY_MAP:
            continue
        name, url = match.groups()
        if not http_url(url):
            continue
        key = canonical(url)
        location = {'section': section, 'subsection': subsection, 'line': number, 'name': name, 'url': url}
        if key in by_url:
            by_url[key].setdefault('legacyLocations', []).append(location)
            continue
        item = dict(id='legacy-' + hashlib.sha256(key.encode()).hexdigest()[:16], name=name,
                    category=CATEGORY_MAP[section], url=url,
                    reference='https://github.com/SnailSploit/Awesome-Snail-OSINT/blob/main/README.md#L'+str(number),
                    access='Unknown', inputs=[], outputs=[], origin='Legacy directory / provenance not reviewed',
                    description=f'Imported from {section}. Original listing preserved; purpose and current availability need review.',
                    caveat='Unreviewed legacy entry. Independently check the publisher, destination, privacy implications and current terms before use.',
                    review={'status':'legacy-unreviewed','date':None,'scope':'Imported listing only; no service or documentation review.'},
                    legacyLocations=[location])
        result.append(item)
        by_url[key] = item
    return result

def load_data(root: Path, allow_missing_readme: bool=False) -> dict:
    result = {n: json.loads((root/'data'/f'{n}.json').read_text()) for n in ['resources','chains','fieldcraft','queries']}
    validate(result)
    readme = root/'README.md'
    if not readme.is_file() and not allow_missing_readme:
        raise ValueError('README.md is required for a complete build. Use --curated-only explicitly for an enriched-data preview.')
    result['resources'] = import_legacy(readme.read_text() if readme.is_file() else '', result['resources'])
    validate(result)
    result['meta'] = {'schemaVersion':1, 'reviewDate':'2026-10-28', 'legacyImported':readme.is_file(),
                      'reviewMeaning':'Publisher documentation reviewed, not a live-service certification.',
                      'counts':{n:len(result[n]) for n in result}}
    return result

def validate(data: dict) -> None:
    ids = set()
    for r in data['resources']:
        required = ['id','name','category','url','reference','description','caveat','origin','inputs','outputs','access','review']
        if any(k not in r for k in required):
            raise ValueError('Incomplete resource: '+str(r.get('id')))
        if r['id'] in ids or not re.fullmatch('[a-z0-9-]+', r['id']):
            raise ValueError('Invalid or duplicate resource ID: '+r['id'])
        ids.add(r['id'])
        if not http_url(r['url']) or not http_url(r['reference']):
            raise ValueError('Unsafe URL: '+r['id'])
        review = r['review']
        if review['status'] not in ('documentation-reviewed','legacy-unreviewed'):
            raise ValueError('Unknown review status')
        if review['status']=='documentation-reviewed' and not re.fullmatch(r'\d{4}-\d{2}-\d{2}',review['date'] or ''):
            raise ValueError('Reviewed records require a date')
    for group in ('chains','fieldcraft','queries'):
        keys = [x['id'] for x in data[group]]
        if len(set(keys)) != len(keys):
            raise ValueError('Duplicate IDs: '+group)
    for c in data['chains']:
        if len(c['steps']) < 2:
            raise ValueError('A chain needs at least two steps')
        for s in c['steps']:
            if not all(s.get(k) for k in ('title','sources','action','output','trap','fallback')):
                raise ValueError('Incomplete chain step: '+c['id'])
            if not set(s['sources']) <= ids:
                raise ValueError('Broken chain source: '+c['id'])
    for t in data['fieldcraft']:
        if not set(t['sources']) <= ids:
            raise ValueError('Broken fieldcraft source')
    for q in data['queries']:
        if q['reference'] not in ids or q['input'] not in ('domain','organization'):
            raise ValueError('Invalid query reference or input')
        if '{'+q['input']+'}' not in q['template']:
            raise ValueError('Missing query substitution')
        if q['kind']=='url' and not http_url(q['template']):
            raise ValueError('Invalid query URL')
        if q['kind']=='text' and not http_url(q['launch']):
            raise ValueError('Invalid query launch URL')

def build(root: Path=ROOT, curated_only: bool=False) -> dict:
    data = load_data(root, curated_only)
    output = root/'_site'
    if output.exists():
        shutil.rmtree(output)
    shutil.copytree(root/'site', output)
    (output/'data.json').write_text(json.dumps(data,ensure_ascii=True,separators=(',',':'))+'\n')
    (output/'.nojekyll').touch()
    return data

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--curated-only',action='store_true',help='Explicitly permit a preview without the legacy README')
    args=p.parse_args()
    try:
        data=build(curated_only=args.curated_only)
    except (ValueError, OSError, json.JSONDecodeError) as e:
        p.exit(1,f'Build failed: {e}\n')
    print(json.dumps(data['meta'],indent=2))
