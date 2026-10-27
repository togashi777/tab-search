import test from 'node:test';
import assert from 'node:assert/strict';
import { parseYouTube, parseSongsterr, parseUltimateGuitar, extractJsonObject, searchTabLinks } from '../lib/tab-search.ts';

function youtubePage(videos) { return 'var ytInitialData = ' + JSON.stringify({ contents: videos.map(videoRenderer => ({ videoRenderer })) }) + ';'; }
function video(videoId, title, description = '') { return { videoId, title: { simpleText: title }, descriptionSnippet: { simpleText: description }, ownerText: { simpleText: 'Teacher' } }; }
test('YouTube excludes paid videos, unrelated covers, duplicates and bass-only videos from guitar results', () => {
  const page = youtubePage([video('abcdefghijk', 'Song guitar TAB'), video('paidpaid123', 'Song guitar TAB', 'Buy tabs on Patreon'), video('bassbass123', 'Song bass TAB'), video('covercover1', 'Song guitar cover'), video('abcdefghijk', 'Song guitar TAB')]);
  assert.deepEqual(parseYouTube(page, 'guitar').map(link => link.id), ['yt-abcdefghijk']);
  assert.deepEqual(parseYouTube(page, 'bass').map(link => link.id), ['yt-bassbass123']);
});
test('YouTube parser rejects an unavailable response instead of reporting zero results', () => assert.throws(() => parseYouTube('captcha', 'guitar')));
test('JSON extraction preserves braces inside quoted titles', () => assert.equal(extractJsonObject('var ytInitialData = {"title":"a } \\" b", "nested":{}};'.replace('a } \\" b', 'a } b'), 'var ytInitialData =').title, 'a } b'));
test('Songsterr selects a matching instrument and excludes drum-only and junk entries', () => {
  const songs = [{ songId: 1, artist: 'Artist', title: 'Song', hasPlayer: true, tracks: [{ instrumentId: 1024 }, { instrumentId: 25, views: 10 }, { instrumentId: 33 }] }, { songId: 2, hasPlayer: true, tracks: [{ instrumentId: 1024 }] }, { songId: 3, isJunk: true, hasPlayer: true }];
  assert.equal(parseSongsterr(songs, 'guitar').length, 1);
  assert.match(parseSongsterr(songs, 'bass')[0].url, /s1t2$/);
});
function ugPage(tabs) { return '<div class="js-store" data-content="' + JSON.stringify({ store: { page: { data: { results: tabs } } } }).replaceAll('&', '&amp;').replaceAll('"', '&quot;') + '"></div>'; }
test('Ultimate Guitar only accepts free public text TABs, excluding Pro, Official, chords and off-site URLs', () => {
  const publicTab = { id: 1, type: 'Tabs', tab_access_type: 'public', tab_url: 'https://tabs.ultimate-guitar.com/tab/artist/song-tabs-1', song_name: 'Song', artist_name: 'Artist', version: 1 };
  const tabs = [publicTab, { ...publicTab, id: 2, marketing_type: 'official' }, { ...publicTab, id: 3, type: 'Pro' }, { ...publicTab, id: 4, tab_access_type: 'paid' }, { ...publicTab, id: 5, type: 'Chords' }, { ...publicTab, id: 6, tab_url: 'https://evil.example/tab/fake' }];
  assert.deepEqual(parseUltimateGuitar(ugPage(tabs), 'guitar').map(link => link.id), ['ug-1']);
});
test('One failed source preserves the other sources and reports the failure', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    if (url.includes('youtube')) throw new Error('timeout');
    if (url.includes('songsterr')) return new Response(JSON.stringify([{ songId: 1, artist: 'A', title: 'S', hasPlayer: true, tracks: [{ instrumentId: 25 }] }]));
    return new Response(ugPage([]));
  };
  try { const search = await searchTabLinks('Song', 'guitar'); assert.equal(search.links.length, 1); assert.equal(search.sources[0].status, 'unavailable'); assert.equal(search.sources[2].status, 'ok'); } finally { globalThis.fetch = originalFetch; }
});
