#!/usr/bin/env python3
"""Bounded static inspection of an untrusted JAR/ZIP. Never extracts or executes classes."""
import argparse
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path

LIMIT_BYTES = 25_000_000
LIMIT_ENTRIES = 10_000
READ_PER_ENTRY = 32_768
READ_TOTAL = 1_000_000
TEXT_EXT = ('.xml', '.json', '.yaml', '.yml', '.properties', '.txt', '.mf', '.pom', '.html', '.js')
CANDIDATE = re.compile(rb'(?:https?://)?[A-Za-z0-9][A-Za-z0-9_.:/?&=%+#@~\-]{4,180}')


def inspect(path):
    file = Path(path)
    if not file.is_file() or file.stat().st_size > LIMIT_BYTES:
        raise ValueError('Expected an existing JAR under 25 MB')
    digest = hashlib.sha256()
    with file.open('rb') as source:
        for block in iter(lambda: source.read(65536), b''):
            digest.update(block)
    identifiers = set()
    packages = set()
    signatures = []
    manifest = {}
    scanned = 0
    with zipfile.ZipFile(file) as archive:
        entries = archive.infolist()
        if len(entries) > LIMIT_ENTRIES:
            raise ValueError('JAR contains too many entries')
        for entry in entries:
            if entry.is_dir():
                continue
            name = entry.filename
            if name.endswith('.class') and '/' in name and not name.startswith('META-INF/'):
                packages.add(name.rsplit('/', 1)[0].replace('/', '.'))
            if name.startswith('META-INF/') and name.upper().endswith(('.SF', '.RSA', '.DSA', '.EC')):
                signatures.append(name[:180])
            if scanned >= READ_TOTAL or entry.file_size > READ_PER_ENTRY or entry.compress_size > LIMIT_BYTES:
                continue
            if entry.compress_size and entry.file_size / entry.compress_size > 200:
                continue
            if not (name.lower().endswith(TEXT_EXT) or name.lower().endswith('.class')):
                continue
            with archive.open(entry) as stream:
                chunk = stream.read(min(READ_PER_ENTRY, READ_TOTAL - scanned))
            scanned += len(chunk)
            if name.upper() == 'META-INF/MANIFEST.MF':
                for line in chunk.decode('utf-8', 'replace').splitlines():
                    if ': ' in line:
                        key, value = line.split(': ', 1)
                        if key in ('Main-Class', 'Implementation-Title', 'Implementation-Version', 'Automatic-Module-Name'):
                            manifest[key] = value[:120]
            for candidate in CANDIDATE.findall(chunk):
                if b'.' not in candidate:
                    continue
                token = candidate.decode('ascii', 'ignore')
                # Omit long opaque strings; the Node pipeline extracts only typed identifiers.
                if 4 < len(token) <= 180 and not re.search(r'(?i)(token|key|secret|password)=', token):
                    identifiers.add(token)
                if len(identifiers) >= 2000:
                    break
    return {'schema': 'snail-jar-inspection/v1', 'sha256': digest.hexdigest(),
            'entries': len(entries), 'packages': sorted(packages)[:100],
            'signatureFiles': sorted(signatures)[:100], 'manifest': manifest,
            'identifiers': sorted(identifiers)[:2000],
            'note': 'Static extraction only; signatures listed, not validated.'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('jar', help='Local JAR file (no downloads or execution)')
    args = parser.parse_args()
    try:
        print(json.dumps(inspect(args.jar), separators=(',', ':')))
    except (ValueError, OSError, zipfile.BadZipFile, RuntimeError) as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
