#!/usr/bin/env python3
"""Opt-in, read-only public Telegram channel collector using Telethon (local only)."""
import argparse
import asyncio
import json
import os
import re
import sys
from pathlib import Path


async def collect(channel, limit, destination):
    try:
        from telethon import TelegramClient
        from telethon.tl.types import Channel
    except ImportError as exc:
        raise RuntimeError('Install optional dependency: pip install telethon') from exc
    api_id = os.environ.get('TG_API_ID')
    api_hash = os.environ.get('TG_API_HASH')
    if not api_id or not api_id.isdigit() or not api_hash:
        raise RuntimeError('TG_API_ID and TG_API_HASH must be set locally; never commit credentials.')
    session_dir = Path.home() / '.local' / 'share' / 'snail-osint'
    session_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    session = str(session_dir / 'telegram')
    async with TelegramClient(session, int(api_id), api_hash) as client:
        entity = await client.get_entity(channel)
        if not isinstance(entity, Channel) or not entity.broadcast or not entity.username or entity.username.lower() != channel.lower():
            raise RuntimeError('Only exact publicly named broadcast channels are allowed; private/group chats are excluded.')
        messages = []
        async for message in client.iter_messages(entity, limit=limit):
            if not message.raw_text or not message.id:
                continue
            messages.append({'id': message.id, 'type': 'message',
                             'date_unixtime': str(int(message.date.timestamp())) if message.date else None,
                             'text': message.raw_text[:12000]})
    session_file = Path(session + '.session')
    if session_file.exists():
        session_file.chmod(0o600)
    # Compatible with the Telegram Desktop public-channel import adapter.
    data = {'type': 'public_channel', 'name': channel, 'messages': messages,
            'collection': 'telethon/read-only', 'channelUsername': channel}
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.is_symlink():
        raise RuntimeError('Refusing to overwrite a symlink')
    with destination.open('w', encoding='utf-8') as output:
        os.chmod(destination, 0o600)
        json.dump(data, output, ensure_ascii=False, indent=2)
    print(json.dumps({'channel': channel, 'messages': len(messages), 'output': str(destination)}))


def main():
    parser = argparse.ArgumentParser(description='Read a bounded public broadcast channel; never query third-party bots.')
    parser.add_argument('--channel', required=True, help='Public @username, not an invite link')
    parser.add_argument('--limit', type=int, default=50)
    parser.add_argument('--out', required=True)
    parser.add_argument('--confirm-public', action='store_true', required=True)
    args = parser.parse_args()
    channel = args.channel.lstrip('@')
    if not re.fullmatch(r'[A-Za-z][A-Za-z0-9_]{4,31}', channel) or not (1 <= args.limit <= 250):
        parser.error('Use a public channel @handle and limit between 1 and 250')
    try:
        asyncio.run(collect(channel, args.limit, Path(args.out)))
    except (OSError, RuntimeError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
