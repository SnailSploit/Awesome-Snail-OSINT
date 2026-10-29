# Snail OSINT: specialist tool pipeline (local-first v1)

This is **working code**, not a 300-provider integration claim. Tool adapters are inventoried in [`pipeline/registry.json`](../pipeline/registry.json). The pipeline collects compatible inputs, extracts typed identifiers, deduplicates **the entity but not its evidence**, and reports exact overlaps across independently named upstream sources. It does not generate ownership conclusions, score people, automatically query Telegram bots, or download and execute files.

## Inputs implemented

- **Telegram Desktop public-channel JSON** (`--telegram-public FILE @channel`): extract public URLs, hostnames, IPs and email strings with message links and message IDs. The asserted channel handle is supplied by the investigator; exported chat files are not independently authenticated.
- **Telegram bot conversation JSON** (`--telegram-bot FILE @bot FROM_ID`): *explicit* import of the operator's own bot conversation export. Bot output is labelled **unverified**. No private-chat URL is produced. No Telegram bot is queried or automated by this import.
- **Telegram live public broadcast channel collection** (optional `scripts/telegram_public.py` + Telethon): read-only, bounded collection by exact public username with operator confirmation. Does not join a channel, discover private chats, download attachments, or send bot messages.
- **JAR files** (`--jar FILE`): standard-library static ZIP/manifest/class-string inspection, 25MB file cap, member and read limits, without extraction to disk or executing Java code. Signature files are listed, not verified. Results can be correlated with Telegram/other domain observations.
- **Shodan API JSON export** (`--shodan-json FILE`): imported IPs, hostnames and SHA-256 certificate fingerprints. This is not a live Shodan API integration or port scan.
- **Hunter domain-search JSON export** (`--hunter-json FILE`): imported email records and source URLs, with the case-sensitive email local part preserved. Email strings are leads, not validated inboxes.
- **Gitleaks JSON export** (`--gitleaks-json FILE`): redacted detection identities only. `Secret`, `Match` and full raw provider objects are **never** copied to results; importing does not scan or test credentials.
- **Existing Atlas execution** (`--live-domain`, `--live-ip`, `--live-mail` with `--confirm-scope`): reuse the existing bounded Google DNS / IANA RDAP / RIPEstat collector, not custom shell scans. Imported Atlas JSON bundles (`--investigation`) are verified before use.

## Commands

Requires Node.js 22+ and Python 3.10+ for JAR inspection. With Telegram Desktop open, export one public channel as machine-readable JSON, then run:

```bash
node scripts/osint_pipeline.mjs --telegram-public /tmp/channel.json @publicchannel --jar /tmp/app.jar --out /tmp/snail-case.json
```

Or combine a public channel export with **provided** Shodan/Hunter reports:

```bash
node scripts/osint_pipeline.mjs --telegram-public /tmp/channel.json @publicchannel --shodan-json /tmp/shodan.json --hunter-json /tmp/hunter.json --out /tmp/case-2.json
```

To gather a public broadcast channel directly, obtain your own Telegram API credentials through `my.telegram.org` and configure the optional local client. A Telegram account session stays on your machine under `~/.local/share/snail-osint/`; do **not** add API hashes, sessions or result exports to Git.

```bash
python3 -m pip install telethon
TG_API_ID=... TG_API_HASH=... python3 scripts/telegram_public.py --channel @publicchannel --limit 50 --out /tmp/public-channel.json --confirm-public
node scripts/osint_pipeline.mjs --telegram-public /tmp/public-channel.json @publicchannel --out /tmp/public-intel.json
```

The `--telegram-bot` option accepts **only** a Telegram Desktop `personal_chat` export with an explicit bot handle and **bot sender `from_id`** as seen in the export (e.g., `user12345`). The importer excludes your own prompts; it does not use the Telegram Bot API to reach arbitrary third-party bots: that requires opt-in mechanisms and permissions from those bots. Do not import stolen/leaked personal datasets or interact with bots that offer unauthorized access to data. Sending a query to a third-party bot can disclose your submitted target to its operator.

## Result contract

```json
{
  "schema": "snail-tool-pipeline/v1",
  "stats": {"uniqueEntities": 2, "duplicatesRemoved": 1, "overlaps": 1},
  "entities": [{"type": "domain", "value": "api.example.org", "sources": [{"tool": "telegram-public-export", "upstream": "telegram:publicchannel", "recordId": "telegram:publicchannel:11"}]}],
  "overlaps": [{"type": "domain", "value": "api.example.org", "upstreams": ["telegram:publicchannel", "shodan"]}],
  "pivots": [],
  "runs": []
}
```

The sample is **schematic**, not a completed live investigation. Output files are created with owner-only permissions, refuse overwrites, and store just extracted typed identifiers plus provenance (not full Telegram message bodies or raw Gitleaks secrets). The original source export must be retained separately if review of exact message content is required. JSON result digests are not signatures or provenance authentication. Timestamps are left null unless the upstream provides a valid observation time.

## Scope and limitations

- Offline imports never issue network queries. Live Atlas collector requests require explicit confirmation and keep the existing target/egress boundaries.
- Telegram public-channel snapshots require the operator to verify that the supplied handle refers to the exported channel. Private chats cannot be silently treated as public. Telegram bot replies are unverified leads, not proof.
- Overlaps are reported only for **exact typed identifiers** seen under different declared upstream source labels. Two wrapper tools using the same upstream do not count as independent sources.
- No broad filename/domain inference, browser fingerprint scanner, automated Hunter account discovery, live Shodan API queries, or bulk Telegram bot marketplace is claimed in v1.
- Public data may include personal information. Use within legitimate scope; avoid collecting unnecessary PII or publishing raw exports.
- This is a **local CLI pilot**, not a browser-deployed Telegram scraping service. The Cloudflare Pages UI does not execute local binaries.

## Validation

```bash
node --test tests/pipeline.test.mjs
python3 scripts/inspect_jar.py /path/to/your.jar
node scripts/osint_pipeline.mjs --help
```

Synthetic integration tests verify Telegram-to-JAR exact overlaps, bot/public mode boundaries, secret redaction, duplicate suppression and failed scope checks. These tests do not establish novelty of real-world findings or availability of live Telegram credentials.
