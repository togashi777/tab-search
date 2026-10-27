import { searchTabLinks } from '../lib/tab-search.ts';
for (const [query, instrument] of [['マリーゴールド', 'guitar'], ['Nirvana Smells Like Teen Spirit', 'bass']]) {
  const search = await searchTabLinks(query, instrument);
  console.log(JSON.stringify({ query, instrument, sources: search.sources, samples: search.sources.map(provider => search.links.find(link => link.source === provider.source)) }, null, 2));
  if (search.sources.every(source => source.status === 'unavailable')) process.exitCode = 1;
}
