export type Instrument = 'guitar' | 'bass';
export type Source = 'youtube' | 'songsterr' | 'ultimate-guitar';
export type TabLink = { id: string; title: string; artist: string; url: string; source: Source; instrument: Instrument; note: string; duration?: string; thumbnail?: string };
export type SearchResponse = { query: string; instrument: Instrument; links: TabLink[]; sources: { source: Source; status: 'ok' | 'unavailable'; count: number }[] };
type JsonRecord = Record<string, any>;
const paymentPattern = /patreon|gumroad|buy\s+(?:the\s+)?tabs?|purchase|paid\s+tabs?|members?\s+only|有料|販売|購入|メンバー限定/i;

export function decodeEntities(text: string): string {
  return text.replace(/&(?:quot|apos|amp|lt|gt|#39|#x[\da-f]+|#\d+);/gi, entity => {
    const named: Record<string, string> = { '&quot;': '"', '&apos;': "'", '&#39;': "'", '&amp;': '&', '&lt;': '<', '&gt;': '>' };
    if (named[entity]) return named[entity];
    const code = entity.startsWith('&#x') ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}
export function extractJsonObject(text: string, marker: string): JsonRecord {
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) throw new Error('Search response format changed');
  const start = text.indexOf('{', markerIndex + marker.length);
  let depth = 0, isQuoted = false, isEscaped = false;
  for (let index = start; index >= 0 && index < text.length; index++) {
    const character = text[index];
    if (isQuoted) {
      if (isEscaped) isEscaped = false;
      else if (character === '\\') isEscaped = true;
      else if (character === '"') isQuoted = false;
    } else if (character === '"') isQuoted = true;
    else if (character === '{') depth++;
    else if (character === '}' && --depth === 0) return JSON.parse(text.slice(start, index + 1));
  }
  throw new Error('Incomplete search response');
}
function readRuns(value: JsonRecord | undefined): string { return value?.simpleText || value?.runs?.map((run: JsonRecord) => run.text || '').join('') || ''; }
export function parseYouTube(text: string, instrument: Instrument): TabLink[] {
  const initial = extractJsonObject(text, 'var ytInitialData =');
  const videos: TabLink[] = []; const seen = new Set<string>();
  function visit(value: unknown) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const object = value as JsonRecord;
    if (object.videoRenderer) {
      const video = object.videoRenderer, title = readRuns(video.title);
      const description = readRuns(video.detailedMetadataSnippets?.[0]?.snippetText) + readRuns(video.descriptionSnippet);
      if (!/^[\w-]{11}$/.test(video.videoId || '') || seen.has(video.videoId)) return;
      if (!/\btabs?\b|タブ譜|TAB譜/i.test(title) || paymentPattern.test(title + ' ' + description)) return;
      if (instrument === 'bass' && !/bass|ベース/i.test(title)) return;
      if (instrument === 'guitar' && /bass|ベース/i.test(title) && !/guitar|ギター/i.test(title)) return;
      if (/PREMIUM|MEMBERS_ONLY/i.test(JSON.stringify(video.badges || []))) return;
      seen.add(video.videoId);
      videos.push({ id: 'yt-' + video.videoId, title, artist: readRuns(video.ownerText), url: 'https://www.youtube.com/watch?v=' + video.videoId, source: 'youtube', instrument, note: '無料公開動画 · 動画内のTABを確認', duration: readRuns(video.lengthText) || undefined, thumbnail: 'https://i.ytimg.com/vi/' + video.videoId + '/mqdefault.jpg' }); return;
    }
    Object.values(object).forEach(visit);
  }
  visit(initial); return videos.slice(0, 8);
}
export function parseSongsterr(songs: JsonRecord[], instrument: Instrument): TabLink[] {
  if (!Array.isArray(songs)) throw new Error('Invalid Songsterr response');
  return songs.filter(song => song.hasPlayer && !song.isJunk && Number.isSafeInteger(song.songId)).flatMap(song => {
    const tracks = (song.tracks || []) as JsonRecord[];
    const candidates: JsonRecord[] = tracks.map((track, index): JsonRecord => ({ ...track, index })).filter(track => instrument === 'bass' ? track.instrumentId >= 32 && track.instrumentId <= 39 : track.instrumentId >= 24 && track.instrumentId <= 31);
    candidates.sort((first, second) => (second.views || 0) - (first.views || 0));
    if (!candidates.length) return [];
    const slug = (song.artist + '-' + song.title).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
    return [{ id: 'ss-' + song.songId, title: String(song.title), artist: String(song.artist), url: 'https://www.songsterr.com/a/wsa/' + encodeURIComponent(slug) + '-tab-s' + song.songId + 't' + candidates[0].index, source: 'songsterr' as Source, instrument, note: 'TAB閲覧無料 · 速度変更・印刷などは有料' }];
  }).slice(0, 8);
}
export function parseUltimateGuitar(text: string, instrument: Instrument): TabLink[] {
  const storeAttribute = text.match(/class="js-store"[^>]*data-content="([^"]+)"/)?.[1];
  if (!storeAttribute) throw new Error('Search response format changed');
  const tabs = JSON.parse(decodeEntities(storeAttribute)).store?.page?.data?.results;
  if (!Array.isArray(tabs)) throw new Error('Invalid Ultimate Guitar response');
  const uniqueUrls = new Set<string>();
  return tabs.filter((tab: JsonRecord) => {
    // Public text TABs avoid Official/Pro subscriptions and trial offers.
    if (tab.tab_access_type !== 'public' || tab.marketing_type || tab.type !== (instrument === 'bass' ? 'Bass Tabs' : 'Tabs')) return false;
    try {
      const url = new URL(tab.tab_url);
      if (url.protocol !== 'https:' || url.hostname !== 'tabs.ultimate-guitar.com' || !url.pathname.startsWith('/tab/')) return false;
      if (uniqueUrls.has(url.href) || paymentPattern.test(tab.song_name + ' ' + (tab.version_description || ''))) return false;
      uniqueUrls.add(url.href); return true;
    } catch { return false; }
  }).sort((first: JsonRecord, second: JsonRecord) => (second.votes || 0) - (first.votes || 0)).slice(0, 8).map((tab: JsonRecord) => ({ id: 'ug-' + tab.id, title: tab.song_name, artist: tab.artist_name, url: tab.tab_url, source: 'ultimate-guitar', instrument, note: '無料公開のテキストTAB · Ver. ' + tab.version }));
}
async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'ja,en;q=0.8' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('Source unavailable: ' + response.status);
  const text = await response.text(); if (text.length > 6_000_000) throw new Error('Source response too large'); return text;
}
export async function searchTabLinks(query: string, instrument: Instrument): Promise<SearchResponse> {
  const instrumentTerm = instrument === 'bass' ? 'bass ベース' : 'guitar ギター';
  const sources: Source[] = ['youtube', 'songsterr', 'ultimate-guitar'];
  const searches = await Promise.allSettled([
    fetchText('https://www.youtube.com/results?search_query=' + encodeURIComponent(query + ' TAB ' + instrumentTerm)).then(text => parseYouTube(text, instrument)),
    fetchText('https://www.songsterr.com/api/songs?pattern=' + encodeURIComponent(query)).then(text => parseSongsterr(JSON.parse(text), instrument)),
    fetchText('https://www.ultimate-guitar.com/search.php?search_type=title&value=' + encodeURIComponent(query)).then(text => parseUltimateGuitar(text, instrument)),
  ]);
  const links: TabLink[] = [];
  const statuses = searches.map((search, index) => {
    if (search.status === 'fulfilled') links.push(...search.value);
    return { source: sources[index], status: search.status === 'fulfilled' ? 'ok' as const : 'unavailable' as const, count: search.status === 'fulfilled' ? search.value.length : 0 };
  });
  return { query, instrument, links, sources: statuses };
}
