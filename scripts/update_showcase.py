#!/usr/bin/env python3
"""Put the live Atlas and tested UI previews above the legacy directory."""
from __future__ import annotations
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIVE = 'https://snail-osint-atlas.pages.dev/'
START = '## Start here\n'


def rewrite_readme(text: str, counts: dict[str, int]) -> str:
    if text.count(START) != 1:
        raise ValueError('Expected exactly one Start here section; refusing to rewrite README')
    directory = text[text.index(START):]
    hero = f'''# Snail OSINT / The Investigation Atlas

### Follow the evidence. Not another wall of links.

**[OPEN THE LIVE ATLAS \u2197]({LIVE})** &nbsp;\u00b7&nbsp; [Investigation chains]({LIVE}#view=chains) &nbsp;\u00b7&nbsp; [Fieldcraft]({LIVE}#view=fieldcraft) &nbsp;\u00b7&nbsp; [Query & evidence lab]({LIVE}#view=lab)

[![Snail OSINT Atlas: forest-green investigation workspace, searchable source cards and a visual research path](docs/assets/atlas-desktop.png)]({LIVE})

| Indexed sources | Investigation chains | Fieldcraft notes | Scoped query recipes |
| :---: | :---: | :---: | :---: |
| **{counts['resources']}** | **{counts['chains']}** | **{counts['fieldcraft']}** | **{counts['queries']}** |

Counts reflect the catalog when this preview was generated, not live-service verification. Imported legacy sources remain clearly marked **unreviewed**.

## The investigation atlas

A working research interface, not just a reskinned README. The entire application,
source catalog, guides and tests live in **this repository, on `main`**.

| Workspace | What you can do |
| --- | --- |
| **Source atlas** | Search by source, input or output; filter by discipline, access and review status; switch card/list views; inspect source dossiers and their limitations. |
| **Investigation chains** | Follow ordered research steps with expected outputs, common attribution traps, linked sources and fallback paths. |
| **Fieldcraft** | Use source-linked techniques for chronology, provenance, independent corroboration and avoiding false matches. |
| **Query & evidence lab** | Generate scoped domain/repository queries and create local SHA-256 integrity receipts. Queries are not executed automatically. |
| **Caseboard** | Pin useful sources and chains; export the resulting research plan as Markdown or JSON. |

<details>
<summary><strong>See an investigation chain in the actual interface</strong></summary>

[![An expanded investigation chain in Snail OSINT](docs/assets/atlas-chain.png)]({LIVE}#view=chains)

</details>

**Keyboard-first:** `/` focuses search, `Ctrl+K` / `Cmd+K` searches across collections,
and `Escape` dismisses dialogs. Search state can be shared in the URL.

**Local-first:** no analytics, remote fonts or automatic target queries. Pins stay in
this browser; external source links and explicitly opened queries go to the selected provider.
A file hash is an integrity check, not proof of authenticity or acquisition time.

**[Open the live workspace]({LIVE})** \u00b7 [Architecture & local setup](ATLAS.md) \u00b7 [Search guide](SEARCH_GUIDE.md) \u00b7 [Contributing](CONTRIBUTING.md)

---

'''
    return hero + directory


def rewrite_atlas(text: str) -> str:
    start = text.index('## Publish\n')
    end = text.index('## Privacy and evidence boundaries\n', start)
    publish = f'''## Publish

**Live site: [{LIVE}]({LIVE})**

Cloudflare Pages project `snail-osint-atlas` is connected directly to
`SnailSploit/Awesome-Snail-OSINT`, production branch **main**. Successful main-branch
builds publish `_site/`; preview-branch deployments are disabled. No second repository
or deployment branch is needed.

Build command:

```bash
python3 scripts/check_docs.py && python3 scripts/build_atlas.py && python3 -m unittest discover -s tests -v && node --test tests/core.test.mjs
```

The deployment uses Python 3.12 and Node 22. The separate **Atlas quality** GitHub
workflow also performs full HTTP/Chromium interaction checks. Cloudflare's build
command above does not run those browser checks.

The existing **Publish atlas to Pages** GitHub workflow remains an optional,
manual alternative. It requires enabling GitHub Pages first; it is not the production
host above. All assets use relative URLs, so project subpaths are supported.

Repository previews can be refreshed by running **Refresh Atlas showcase** on main.
That workflow builds and tests the site, takes real browser screenshots, and updates
only the README, hosting documentation and two preview PNGs. It does not rewrite history.

For hosts with configurable headers, set `Content-Security-Policy: frame-ancestors 'none'`
and `X-Content-Type-Options: nosniff`. Frame-ancestor policy cannot be enforced by an HTML meta tag.

'''
    result = text[:start] + publish + text[end:]
    if '## Live workspace\n' not in result:
        result = result.replace('## Run locally\n', f'## Live workspace\n\n**[Open Snail OSINT Atlas]({LIVE})** \u2014 no installation required.\n\n## Run locally\n', 1)
    return result


def main() -> None:
    data = json.loads((ROOT / '_site/data.json').read_text(encoding='utf-8'))
    counts = data['meta']['counts']
    # Count from data, never from marketing copy or hand-maintained estimates.
    for key in ('resources', 'chains', 'fieldcraft', 'queries'):
        if counts[key] != len(data[key]):
            raise ValueError('Catalog count mismatch: ' + key)
    readme = ROOT / 'README.md'
    before = readme.read_text(encoding='utf-8')
    after = rewrite_readme(before, counts)
    assert before[before.index(START):] == after[after.index(START):]
    assert rewrite_readme(after, counts) == after
    atlas = ROOT / 'ATLAS.md'
    atlas_after = rewrite_atlas(atlas.read_text(encoding='utf-8'))
    assert rewrite_atlas(atlas_after) == atlas_after
    screenshots = ROOT / '.browser-test'
    for name in ('atlas-desktop.png', 'atlas-chain.png'):
        src = screenshots / name
        if not src.is_file() or src.read_bytes()[:8] != b'\x89PNG\r\n\x1a\n':
            raise ValueError('Missing real-browser PNG: ' + name)
    assets = ROOT / 'docs/assets'
    assets.mkdir(exist_ok=True)
    for name in ('atlas-desktop.png', 'atlas-chain.png'):
        shutil.copyfile(screenshots / name, assets / name)
    readme.write_text(after, encoding='utf-8')
    atlas.write_text(atlas_after, encoding='utf-8')
    print(json.dumps({'live': LIVE, 'counts': counts, 'directory_preserved': True}, indent=2))


if __name__ == '__main__':
    main()
