#!/usr/bin/env python3
"""Build songs-data.js (used by the home page) from artist-pages-data.json.

artist-pages-data.json is the single place where songs are described:
id, label, src, explanation (translations), optional "added" (YYYY-MM-DD).
The home page (index.html) reads the generated songs-data.js, so a song added
or edited in the JSON shows up on the home page too after running:

    python tools/build_songs_data.py

The script also puts a content hash into the <script src="songs-data.js?v=..."> tag
of index.html, so browsers (and the service worker) always fetch the new file.
"""
import hashlib
import json
import re
import sys
from urllib.parse import quote, unquote

ROOT = __file__.replace('\\', '/').rsplit('/tools/', 1)[0] + '/'
DATA = ROOT + 'artist-pages-data.json'
OUT = ROOT + 'songs-data.js'
INDEX = ROOT + 'index.html'
AUDIO_BASE = 'https://pub-2d663d6d59994b7fa7390c9851966548.r2.dev/audio'

ARMENIAN = re.compile('[԰-֏]')


def js_quote(text):
    return json.dumps(text, ensure_ascii=False)


def default_url(artist_id, song_id):
    """The URL the home page would build on its own for a song."""
    ext = '.wav' if song_id == 'nerqnapanak' else '.mp3'
    enc = lambda t: quote(t, safe="!~*'()")
    return '%s/%s/featured/%s%s' % (AUDIO_BASE, enc(artist_id), enc(song_id), ext)


def main():
    data = json.load(open(DATA, encoding='utf-8'))

    names, explanations, by_lang, subtitles = {}, {}, {}, {}
    sources, versions, added, order = {}, {}, {}, {}
    seen_ids = {}
    problems = []

    for artist_id, artist in data.items():
        order[artist_id] = []
        for track in artist['tracks']:
            tid = track['id']
            order[artist_id].append(tid)
            if tid in seen_ids and seen_ids[tid] != artist_id:
                problems.append('id "%s" is used by both %s and %s' % (tid, seen_ids[tid], artist_id))
            seen_ids[tid] = artist_id

            label = track['label']
            names[tid] = label

            expl = track.get('explanation') or {}
            if expl:
                by_lang[tid] = expl
                explanations[tid] = ' '.join(v for v in expl.values() if v)
                # the other languages shown under the title; the label's own language is skipped
                sub = {k: v for k, v in expl.items() if v and not (k == 'hy' and ARMENIAN.search(label))}
                if sub:
                    subtitles[tid] = sub

            if track.get('added'):
                added[tid] = track['added']

            src = track['src']
            base_src, _, query = src.partition('?')
            if unquote(base_src) != unquote(default_url(artist_id, tid)):
                sources['%s|%s' % (artist_id, tid)] = src
            m = re.match(r'v=([A-Za-z0-9]+)$', query)
            if m:
                versions['%s|%s' % (artist_id, tid)] = m.group(1)

    if problems:
        print('PROBLEMS:')
        for p in problems:
            print('  -', p)
        sys.exit(1)

    def block(name, mapping):
        lines = ',\n'.join('    %s: %s' % (js_quote(k), json.dumps(v, ensure_ascii=False, separators=(',', ':')))
                           for k, v in mapping.items())
        return '  %s: {\n%s\n  }' % (name, lines)

    parts = [
        block('names', names),
        block('explanations', explanations),
        block('byLang', by_lang),
        block('subtitles', subtitles),
        block('sources', sources),
        block('versions', versions),
        block('added', added),
        block('order', order),
    ]
    text = ('/* GENERATED FILE - do not edit by hand.\n'
            '   Source: artist-pages-data.json   Build: python tools/build_songs_data.py */\n'
            'window.SONG_DATA = {\n' + ',\n'.join(parts) + '\n};\n')
    with open(OUT, 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(text)

    digest = hashlib.sha1(text.encode('utf-8')).hexdigest()[:10]
    html = open(INDEX, encoding='utf-8', newline='').read()
    new_html, n = re.subn(r'<script src="songs-data\.js(\?v=[0-9a-f]+)?"></script>',
                          '<script src="songs-data.js?v=%s"></script>' % digest, html)
    if n != 1:
        print('WARNING: expected exactly one songs-data.js script tag in index.html, found %d' % n)
    elif new_html != html:
        open(INDEX, 'w', encoding='utf-8', newline='').write(new_html)

    total = sum(len(v) for v in order.values())
    print('songs-data.js: %d songs, %d source overrides, %d translated, hash %s' %
          (total, len(sources), len(by_lang), digest))


if __name__ == '__main__':
    main()
