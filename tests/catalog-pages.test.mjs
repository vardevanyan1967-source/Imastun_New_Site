import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function extractQuotedSongs(source) {
  const block = source.match(/const ARTIST = \{[\s\S]*?songs:\s*\[([\s\S]*?)\n\s*\]\n\s*\};/);
  assert.ok(block, 'standalone artist song array should exist');
  return block[1].split(',').map(part => part.trim()).filter(Boolean).map(part => part.replace(/^['\"]|['\"]$/g, ''));
}

test('Հայ Բանաստեղծներ page preserves the 104-song deduplicated catalog', () => {
  const page = read('haj-poetner.html');
  const songs = extractQuotedSongs(page);
  const normalized = songs.map(song => ({
    song: song === 'hamo-sahyan/torvochvoqi chkanchen 02roc' ? 'hamo-sahyan/tor vochvoqi chkanchen02roc' : song,
  }));
  assert.equal(new Set(normalized.map(item => item.song)).size, 104);
  assert.match(page, /id="song-count-stat">104<\/div>/);
  assert.match(page, /const AUDIO_BASE_URL = 'https:\/\/pub-[^']+\.r2\.dev\/audio'/);
  assert.match(page, /const POET_ORDER = \['vahan-teryan\//);
  assert.match(page, /https:\/\/imastun\.org\/haj-poetner\.html\?play=/);
  assert.doesNotMatch(page, /Silva Gulanyan|silva-gulanyan/);
  assert.match(page, /<video[^>]+id="bg-video"[^>]+src="background2\.mp4"/);
  assert.match(page, /function isNewSong\(song\)/);
  assert.match(page, /function updateNewCount\(\)/);
  assert.match(page, /selectedPoet === 'all' \? playlist : playlist\.filter\(t => t\.song\.startsWith\(selectedPoet\)\)/);
  assert.equal(normalized.filter(item => item.song.startsWith('hamo-sahyan/')).length, 62);
});

test('main catalog exposes a responsive artist filter without changing poetry sections', () => {
  const page = read('index.html');
  assert.match(page, /<select id="artist-filter" aria-controls="artists-grid">/);
  assert.match(page, /\.catalog-section \.section-header \{ flex-wrap: wrap; \}/);
  assert.match(page, /artistFilter\.addEventListener\('change', updateArtistFilter\)/);
  assert.match(page, /#artists-grid > \[data-artist-id\]\[hidden\] \{ display: none; \}/);
  assert.match(page, /const NON_ARTIST_IDS = new Set\(\['haj-poetner', 'shakespeare-reimagined'\]\)/);
  assert.match(page, /card\.dataset\.artistId = artist\.id/);
});

test('all three catalog pages link to the standalone poets page', () => {
  for (const file of ['index.html', 'go-hara.html', 'shakespeare.html']) {
    assert.equal((read(file).match(/page: 'haj-poetner\.html'/g) ?? []).length, 1, `${file} should link to haj-poetner.html`);
  }
});
