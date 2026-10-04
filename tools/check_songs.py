#!/usr/bin/env python3
"""Check that every song listed in artist-pages-data.json can be fetched from R2.

Run by the "Check songs" GitHub workflow every day. Exit code 1 (and a list of the
broken songs) makes GitHub e-mail the repository owner. Can also be run by hand:

    python tools/check_songs.py
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = __file__.replace('\\', '/').rsplit('/tools/', 1)[0] + '/'
DATA = ROOT + 'artist-pages-data.json'
MIN_BYTES = 50_000          # a real song is never smaller than this
WORKERS = 6                 # R2's public URL rate-limits aggressive clients


def probe(url):
    """Return (status, total_bytes). status is an int, or 'unreachable'."""
    req = urllib.request.Request(url, headers={'Range': 'bytes=0-1', 'User-Agent': 'imastun-song-check/1.0'})
    last = 'unreachable'
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                size = 0
                cr = r.headers.get('Content-Range')
                if cr and '/' in cr:
                    try:
                        size = int(cr.rsplit('/', 1)[1])
                    except ValueError:
                        size = 0
                return r.status, size
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504):
                last = e.code
                time.sleep(2 * (attempt + 1))
                continue
            return e.code, 0
        except Exception:
            last = 'unreachable'
            time.sleep(2 * (attempt + 1))
    return last, 0


def problem(status, size):
    if status not in (200, 206):
        return 'HTTP %s' % status
    if size and size < MIN_BYTES:
        return 'file is only %d bytes' % size
    return ''


def main():
    data = json.load(open(DATA, encoding='utf-8'))
    items = [(k, t['id'], t['label'], t['src']) for k, a in data.items() for t in a['tracks']]

    def run(batch):
        with ThreadPoolExecutor(WORKERS) as ex:
            return list(ex.map(lambda it: probe(it[3]), batch))

    results = run(items)
    bad = [(it, problem(*r)) for it, r in zip(items, results) if problem(*r)]

    if bad:                                   # one more pass, to rule out a short R2 hiccup
        time.sleep(20)
        retry = run([b[0] for b in bad])
        bad = [(b[0], problem(*r)) for b, r in zip(bad, retry) if problem(*r)]

    lines = ['Checked %d songs.' % len(items)]
    if bad:
        lines.append('%d song(s) are broken:' % len(bad))
        for (artist, sid, label, src), why in bad:
            lines.append('- [%s] %s (%s): %s' % (artist, label, sid, why))
            lines.append('    %s' % src)
    else:
        lines.append('All songs are reachable.')
    text = '\n'.join(lines)
    print(text)

    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a', encoding='utf-8') as f:
            f.write('### Song check\n\n```\n%s\n```\n' % text)

    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
