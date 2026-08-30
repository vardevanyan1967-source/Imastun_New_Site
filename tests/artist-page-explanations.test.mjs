import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync(new URL('../artist-pages-data.json', import.meta.url), 'utf8'));

test('poetry tracks preserve catalog size, R2 sources, and explanations', () => {
  const poets = data['haj-poetner'].tracks;
  const sonnets = data['shakespeare-reimagined'].tracks;
  assert.equal(poets.length, 104);
  assert.equal(sonnets.length, 140);
  assert.ok(poets.every((track) => track.src.includes('/audio/haj-poetner/')));
  assert.ok(sonnets.every((track) => track.src.includes('/audio/shakespeare-reimagined/')));
  assert.ok(poets.filter((track) => track.explanation).length >= 92);
  assert.ok(sonnets.filter((track) => track.explanation?.hy).length >= 100);
  assert.equal(sonnets.find((track) => track.id === 'Սոնետ  18').explanation.hy, 'Համեմատություն ամառային օրվա հետ՝ հավերժություն բանաստեղծության մեջ');
});

test('renderer displays the language-appropriate explanation and poet group', () => {
  const js = fs.readFileSync(new URL('../artist-page.js', import.meta.url), 'utf8');
  assert.match(js, /function explanationText\(value\)/);
  assert.match(js, /item\.track\.explanation \? explanationText\(item\.track\.explanation\)/);
  assert.match(js, /class="track-group"/);
});
