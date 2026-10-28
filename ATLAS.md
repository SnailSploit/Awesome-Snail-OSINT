# Snail OSINT / The Investigation Atlas

**Follow the evidence.** A searchable, local-first interface for the OSINT directory, with authored investigation chains and explicit limits on what a source can establish.

The original [Markdown directory](README.md) and specialized reference documents remain intact. The atlas is a new interface, not a replacement or a claim that every old listing has been verified.

## Live workspace

**[Open Snail OSINT Atlas](https://snail-osint-atlas.pages.dev/)** — no installation required.

## Run locally

Requires Python 3.10 or newer. The website itself has no framework, package manager, third-party fonts, analytics or runtime CDN dependency.

```bash
python3 scripts/build_atlas.py
python3 -m http.server 8080 --directory _site
```

Open `http://localhost:8080/`. Opening an HTML file directly is not supported: the catalog is loaded as a same-origin JSON file.

## What is included

- **Source atlas:** search, category and access filters, card/list views, review status and a source dossier with inputs, outputs, upstream lineage and inference limitations.
- **Investigation chains:** ten authored playbooks. Each step includes an action, expected output, invalidating assumptions, a fallback and linked sources.
- **Fieldcraft:** twenty practical notes on temporal alignment, identity resolution, source independence and reproducibility.
- **Working tools:** six scoped query recipes, a local SHA-256 integrity receipt, and a caseboard that exports research plans as Markdown or JSON.

The enriched starting set contains 31 source dossiers. A complete build additionally imports and deduplicates existing README listings. All imported entries without a curated review remain **legacy / unreviewed**. The UI computes its counts from the built catalog.

Use `/` to focus search, `Ctrl+K` or `Cmd+K` to open cross-collection search, and `Escape` to dismiss a dialog. Filter state is represented in the URL fragment. Source and chain selections are saved as catalog IDs on the current device.

## Source of truth

| File | Maintained content |
| --- | --- |
| [data/resources.json](data/resources.json) | Enriched source dossiers and dated documentation reviews |
| [data/chains.json](data/chains.json) | Ordered research steps, outputs, limits and fallbacks |
| [data/fieldcraft.json](data/fieldcraft.json) | Source-linked methodology notes |
| [data/queries.json](data/queries.json) | Scoped query templates; never automatically executed |
| [README.md](README.md) | Original directory, imported as explicitly unreviewed legacy data |

A documentation review is not proof that every service, endpoint, pricing tier or example works today. Two tools using the same underlying dataset do not provide independent corroboration. Existing dork documents retain their original content and may include outdated syntax; the new query lab deliberately uses its own small reviewed recipe set.

## Quality checks

```bash
python3 -m unittest discover -s tests -v
node --test tests/core.test.mjs
node --check site/app.mjs
python3 scripts/build_atlas.py
```

Browser integration checks require Node 22 for the JavaScript tests and Playwright for Python:

```bash
python3 -m pip install playwright==1.57.0
python3 -m playwright install chromium
python3 scripts/browser_smoke.py
```

CI builds the complete catalog, runs regression tests, then checks real browser interactions, exports, persistence, query validation, native SHA-256, responsive layouts and automatic external requests. It produces deployable website and browser-evidence artifacts. A successful test is not a full accessibility audit or security certification.

## Publish

**Live site: [https://snail-osint-atlas.pages.dev/](https://snail-osint-atlas.pages.dev/)**

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

## Privacy and evidence boundaries

No target lookup is performed automatically. Query generation is local; clicking an external search sends the query to that provider. A source hyperlink opens a third-party site with its own policies.

The caseboard stores source/chain IDs, not private case notes or target values. Storage is not encrypted. Treat shared browsers accordingly.

The hash tool reads file bytes locally and supports files up to 25 MiB. An exported receipt includes the filename, size, SHA-256 digest and browser-clock timestamp. It is unsigned and does not establish authenticity, acquisition time, lawful collection or chain of custody. No file bytes are uploaded by this app.

## Research design

The product's differentiator is **an explicit next step with an explicit reason it could be wrong**. These are manually authored playbooks, not an autonomous investigation agent, a graph of discovered real-world relationships, or an AI-generated evidence engine.

Future quality should be measured through reproducible public case studies, dated source rechecks, successful dead-end recovery, accessibility testing and documented corrections, rather than unsupported claims of being the largest or best directory.
