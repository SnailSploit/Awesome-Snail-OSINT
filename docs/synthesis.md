# Synthesis: executable research combinations

[Open the Synthesis lab](https://snail-osint-atlas.pages.dev/#view=synthesis).

This release computes qualified findings, rejected connections and evidence references.
It is not an autonomous investigator, an ownership classifier, or proof that a method is globally novel.
All three analyzers run locally in the browser. There is one live web collector (Android association
statements via Google's fixed Digital Asset Links API), a local-only document extractor, and an
explicitly scoped local HTTPS collector for declarations and release artifacts.

## Run

```bash
python3 scripts/build_atlas.py
node scripts/serve_atlas.mjs
```

Open the printed localhost address and select **Synthesis lab**. The deployed site uses Cloudflare
Pages Functions for the same-origin collector. Static-only hosting supports imports and local
analysis, but not provider collection. No provider queries run on page load.

## The three executable combinations

| Combination | Actual computation | Inputs and current limits |
| --- | --- | --- |
| App trust | Exact package + signing fingerprint + relation overlap; before/after retention; complete-snapshot set differences | Up to four live domains per request, eight in an imported comparison. Android only; Apple entitlements are not implemented. |
| Document lineage | Common XMP lineage plus non-template five-word text overlap; template-control rejection; exact digest duplication | Up to 16 text/PDF observations including controls. Browser accepts UTF-8 text and same-name XMP. PDFs use the local Python extractor. |
| Operational continuity | Namespaced seller identity or scoped manager declaration, combined with at least two distinct time-overlapping release transitions absent from controls | Imported/local-collected observations; not automatic historical crawling. At least one valid control transition is required. |

### App trust: A1, A2, A3

**A1** joins the exact Android package, SHA-256 signing-certificate fingerprint and declared relation.
Current-overlap comparisons require observation times within 24 hours. Shared names alone fail.
**A2** compares the earliest and latest snapshots on the same exact host. A user-supplied event is
used only when captures strictly bracket it. A relationship observed before and after an event is
not evidence of continuous persistence between those captures.
**A3** reports added/missing tuples only for complete, parseable publisher snapshots. Includes,
malformed declarations and unknown coverage disable that inference. Google API observations always
have unknown completeness; a provider error or empty result cannot establish removal.

Provider source identity is checked against the exact HTTPS host and port; the single terminal DNS period used by the DAL WebAsset canonical form is normalized. Aliases, suffix matches, other schemes and non-default ports are rejected.

Provider retrieval time is not statement-issuance time. Google can cache or retrieve the publisher's
public file. Collection is therefore not represented as strictly passive. The website declaration
alone does not verify app-side configuration, effective permissions, legal ownership or a vulnerability.
Extension/path constraints are retained where available and may differ despite tuple overlap.

### Document lineage: D0, D1

**D0** reports equal supplied original-file hashes as duplicate detection, not novel intelligence.
**D1** requires a shared non-control DocumentID, OriginalDocumentID or DerivedFrom document ID,
plus at least six common five-word sequences and 0.25 containment after subtracting control text.
Text is normalized with Unicode NFKC. InstanceID is retained but is not used as a lineage key.
Corpus-common text is also suppressed when enough subject documents are present. Thresholds are
experimental heuristics, not calibrated confidence scores. Editable metadata can be copied; a shared
vendor, licensed source or template can explain a match. No authorship, copying direction or misconduct
conclusion is produced. Missing text or metadata is a coverage limitation, not a disproof of ancestry.

Select `report.txt` and `report.xmp` together in the browser. No bytes are uploaded.
For PDFs, install the optional parser and extract locally:

```bash
python3 -m pip install pypdf==5.9.0
python3 scripts/extract_documents.py report-a.pdf report-b.pdf --control template.pdf -o evidence.json
node scripts/analyze_research.mjs evidence.json --out report.json
```

The PDF parser runs in a separate subprocess with a 25-second timeout and POSIX CPU/address-space
limits where supported; this is not a security sandbox. Files are limited to 10 MiB, 80 pages and
100,000 extracted characters. Encrypted PDFs are rejected. No OCR, file execution or network requests
are performed. Review rendered originals before substantive claims: extraction can omit structure
or text. Invalid XML/entity declarations are rejected. Failed extraction remains an error observation.

### Operational continuity: O1

Seller IDs are joined with their advertising-system namespace, preserving ID case. A seller lookup
must resolve exactly one non-confidential record with a valid domain and seller type. A matching
MANAGERDOMAIN must also match its optional regional scope. Shared intermediaries alone produce a
rejected connection, not a finding.

Release records contain SHA-256 digests of explicitly named raw artifacts. Only investigator-labelled
first-party, non-common-dependency artifacts are eligible. Consecutive capture gaps may not exceed
seven days. Two matching transitions must have overlapping observation windows on the two subjects,
be distinct and non-overlapping in time, fall within 90 days of the declarations, and not occur in
supplied control histories. Advertising/seller observations must be within 14 days. At least one
valid control transition is needed; one empty control file is not sufficient.

The result is a **shared operational-process hypothesis**, not legal ownership, payments, intent or
an exact deployment time. First-party labels and control selection are investigator-supplied. A
control cohort cannot establish global rarity. No runtime JavaScript is executed.

## Collect real publisher snapshots locally

The [example manifest](../examples/research-scope.json) deliberately uses reserved example domains.
Replace them with the exact public domains and paths in your authorized investigation; it is a schema
example, not live case evidence. The collector requires `--confirm-scope` and has no recursive discovery.

```bash
node scripts/collect_research.mjs --manifest scope.json --confirm-scope --out capture-1.json
node scripts/collect_research.mjs --manifest scope.json --confirm-scope --previous capture-1.json --out capture-2.json
node scripts/analyze_research.mjs capture-2.json --out report.json
```

Take later captures at appropriate real observation times; do not fabricate dates or hash transitions.
Two captures cannot establish the two distinct transition windows required by O1. Import historical
records only with preserved provenance, source representation and collection limitations.

The local collector uses HTTPS, validates all returned DNS addresses as public, pins a selected address
for the TLS connection, preserves hostname verification, and follows no redirects. It accepts at most
four targets, two declared release paths each, and four seller systems. It requests only fixed declaration
paths and the explicitly scoped artifact paths. Responses are capped at 2 MiB, timeouts are bounded,
and there are no automatic retries. Large seller files are rejected, not silently truncated. Malformed
records and failed HTTP requests remain visible. This collector is not exposed as an arbitrary server proxy.

## Evidence format and reproducibility

Input bundles use `schemaVersion: 1`, a technique ID, an `observations` array and optional `context.event`.
Each observation has `kind`, exact `subject`, UTC `observedAt`, `sourceUrl`, `outcome`, `coverage`,
`role` and `payload`. Supported kinds are assetlinks, ads-txt, sellers, release and document. Inputs
are limited to 160 observations and 2 MiB. The importer seals raw extraction records with a canonical
SHA-256; already sealed records are verified. Conflicting records at the same subject/kind/time fail.

JSON report exports include the input digest, engine version, actual observations, rule IDs, reference
IDs, calculations, alternatives, limitations, rejected joins and coverage. Reimporting a report verifies
its hash and recomputes the supported outputs. Hashes detect changes relative to the receipt, not a
malicious producer who rewrites both bytes and hash. There is no signature, independent timestamp or
source-authenticity guarantee. The UI does not automatically persist private research data.

## Synthetic challenges and evaluation

The **Run synthetic challenge** button is explicit and labelled. It constructs fictional positives,
lookalikes and control observations and runs the actual rules. Synthetic inputs are never shown as
live results, preloaded on entry, or substituted after failed collection. Clear them before live collection.
Tests remove evidence families and introduce common-template, key-identity, timing, namespace and
control-corpus confounders. Passing these tests establishes implementation behavior on those cases,
not real-world precision, global novelty, or superiority over other platforms.

No independently adjudicated real-world novelty benchmark has been completed in this release.
The next research evaluation needs frozen rules, held-out public cases and comparison against the
strongest single source and simple aggregation under comparable collection budgets.

## Source contracts

- [Google statement-list location and identity matching](https://developers.google.com/digital-asset-links/v1/create-statement)
- [Google statements.list schema and cache lifetime](https://developers.google.com/digital-asset-links/reference/rest/v1/statements/list)
- [IAB Tech Lab ads.txt and ownership/manager declarations](https://iabtechlab.com/ads-txt/)
- [IAB Tech Lab sellers.json](https://iabtechlab.com/sellers-json/)
- [Adobe XMP Media Management namespace](https://github.com/adobe/xmp-docs/blob/master/XMPNamespaces/xmpMM.md)
- [pypdf text extraction limitations](https://pypdf.readthedocs.io/en/stable/user/extract-text.html)

Source documentation was consulted for schema semantics. That is not live-service certification.
