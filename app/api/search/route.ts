import { searchTabLinks } from '@/lib/tab-search';
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get('q') || '').trim().replace(/\s+/g, ' ');
  const instrument = params.get('instrument') || 'guitar';
  if (query.length < 1 || query.length > 120 || !['guitar', 'bass'].includes(instrument)) return Response.json({ error: '曲名は1〜120文字で入力してください。' }, { status: 400 });
  try {
    const search = await searchTabLinks(query, instrument as 'guitar' | 'bass');
    return Response.json(search, { status: search.sources.every(source => source.status === 'unavailable') ? 503 : 200, headers: { 'Cache-Control': 'private, max-age=180' } });
  } catch { return Response.json({ error: '検索に接続できませんでした。時間をおいて再度お試しください。' }, { status: 503 }); }
}
