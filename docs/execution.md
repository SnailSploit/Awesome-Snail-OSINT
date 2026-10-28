# Executable investigations

[Open live investigations](https://snail-osint-atlas.pages.dev/#view=run).

The Atlas now has a bounded, deterministic execution layer. This is not an AI agent and does not execute arbitrary instructions. The existing ten authored playbooks remain manual; three explicit workflows can collect actual public records.

## Workflows

| Workflow | Executed steps | Deliberate limits |
| --- | --- | --- |
| Domain footprint | Google Public DNS A, AAAA, CNAME, NS, MX, CAA; IANA-selected RDAP domain record; RIPE RIS context for up to two IPs observed in successful DNS responses | One input domain, no guessing subdomains, no direct HTTP/port probing, no ownership attribution |
| Mail DNS evidence | MX, TXT and `_dmarc` TXT for the exact supplied domain | Not a full SPF/DMARC evaluation; does not expand SPF includes, discover DKIM selectors, test delivery, or apply organizational-domain inheritance |
| IP routing context | IANA-selected RIR allocation record plus RIPE RIS covering prefix and origin ASNs | One global unicast IPv4/IPv6 input; registry country is not physical location; announcing ASN is not the website owner |

A source can be successful, empty, unavailable, unsupported, erroneous or cancelled. A workflow is completed only when all scheduled lookups return successful or explicit empty outcomes; otherwise it is partial, failed or cancelled. Completed means execution finished, not that the subject is safe, vulnerable or conclusively attributed.

The graph is generated from captured observations, not from the hero illustration. Each edge references at least one observation ID. Empty/error observations do not create positive relationships. Independent source operators do not automatically establish independent factual corroboration.

## Where execution happens

Cloudflare Pages deploys [functions/api/investigate.js](../functions/api/investigate.js) from this same repository and `main` branch. It calls the fixed provider adapters in [server/providers.mjs](../server/providers.mjs). The browser consumes a bounded NDJSON event stream; no user credentials are required or accepted.

`site/_routes.json` limits function invocation to `/api/*`, preserving static delivery for the catalog. A GitHub Pages-only or plain Python static-server deployment cannot run this API; the UI reports the missing backend rather than showing fabricated results.

For a complete local instance (Python 3.10+ and Node 22+):

```bash
python3 scripts/build_atlas.py
node scripts/serve_atlas.mjs
```

Open `http://127.0.0.1:8080/#view=run`. The server binds loopback, not all interfaces. Do not set `ATLAS_TEST_FIXTURES` for real research. That explicit environment flag exists only for deterministic integration tests, never for the deployed Functions handler.

## Trust and network boundaries

The server accepts only `workflow`, `target`, and an explicit `consent: true`. The browser requires scope acknowledgment. This is a declaration, not identity verification or proof of legal authority. Origin checking is browser request isolation, not authentication.

Provider destinations and paths are constructed by code, not supplied by the user. RDAP endpoints must match both a current IANA bootstrap entry and the implementation's explicit HTTPS registry allowlist. Unsupported registries are recorded as unsupported; no unreviewed fallback endpoint is contacted. A subdomain RDAP 404 is not treated as proof that the registrable domain is unregistered.

The collector enforces public-literal IP validation, exact-target URL binding, restricted redirects, bounded response bytes, per-provider timeouts, no automatic retries, two concurrent steps and a 35-second run deadline. Domain runs permit at most 12 upstream requests, mail runs 3 and IP runs 5. Dynamic IP pivots must come from successful DNS answers reachable through the requested name's CNAME chain and stop after two addresses.

No target port scans, login attempts, exploit tests, direct target HTTP requests, automated people searches or paid API calls are performed. DNS resolution is not purely passive: a recursive resolver may contact authoritative DNS servers. Target values are sent to the chosen providers and Cloudflare during execution; they are kept out of URL fragments. Normal provider and hosting infrastructure logs may still exist.

There is an in-memory, edge-isolate burst limiter of six runs per client per minute. It is **not** a globally consistent quota or a complete abuse-prevention system. Before opening this to high-volume public use, deploy authenticated access/Turnstile and a globally enforced rate policy, and review provider terms and Cloudflare allowances. This change does not upgrade a billing plan or provision a paid API.

## Evidence and retention

Each normalized observation binds its run ID, step, adapter, queried subject, acquisition time, outcome, selected response fields and provider-request provenance. SHA-256 covers canonical JSON of that observation. The client checks the digest before accepting it into the run. Graphs are derived deterministically, never supplied by the external provider.

Exports include JSON (with an overall integrity checksum) and a Markdown report. JSON replay verifies checksums and regenerates the graph. These are **unsigned integrity checks**, not source authentication, trusted timestamps, a chain-of-custody certification or proof that an imported file is genuine.

Full raw provider responses are not archived. RDAP contacts, entities and personal contact cards are deliberately omitted. The exported record projection supports the displayed relationships; retain originals separately when an investigation requires archival evidence.

Runs remain in browser memory by default. **Save on this browser** explicitly persists a snapshot in IndexedDB, with a 20-snapshot limit and individual deletion. Saved target values and public record data are not encrypted. There is no cloud account, cross-device synchronization, server-side case database or automatic background monitoring. A closed/interrupted tab does not resume a run; a saved snapshot can be inspected offline and a new lookup launched explicitly.

## Validation

```bash
python3 scripts/check_docs.py
python3 -m unittest discover -s tests -v
node --test tests/*.test.mjs
python3 scripts/build_atlas.py
python3 scripts/browser_smoke.py
python3 scripts/execution_browser_smoke.py
```

The execution browser suite uses the real local HTTP handler with clearly isolated fixture providers. To validate an already deployed live instance against the public records for `snailsploit.com` and `8.8.8.8`:

```bash
ATLAS_BASE_URL=https://snail-osint-atlas.pages.dev/ python3 scripts/execution_browser_smoke.py
```

The live suite makes explicit public-record requests and must not run automatically for untrusted pull requests. A successful test is not a security certification or a guarantee that providers will stay available.

## Primary API references

Reviewed during implementation on 2026-10-28:

- [Google Public DNS JSON API](https://developers.google.com/speed/public-dns/docs/doh/json): question types, response codes and client-subnet privacy parameter.
- [IANA domain bootstrap](https://data.iana.org/rdap/dns.json), [IPv4 bootstrap](https://data.iana.org/rdap/ipv4.json), [IPv6 bootstrap](https://data.iana.org/rdap/ipv6.json): registry routing.
- [ARIN RDAP documentation](https://www.arin.net/resources/registry/whois/rdap/): registration record semantics and referrals.
- [RIPEstat Network Info](https://stat.ripe.net/docs/data-api/api-endpoints/network-info): covering prefix and origin ASN, based on RIS data snapshots rather than an active probe.
- [Cloudflare Pages Functions routing](https://developers.cloudflare.com/pages/functions/routing/): same-repository API paths and static-route exclusion.
