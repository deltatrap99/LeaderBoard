import type { VercelRequest, VercelResponse } from '@vercel/node';

let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return res.json(cache.data);
  }

  try {
    const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      return res.status(500).json({ error: 'APPS_SCRIPT_URL not configured' });
    }

    const response = await fetch(`${APPS_SCRIPT_URL}?action=results&t=${Date.now()}`);
    const data = await response.json();

    cache = { data, timestamp: Date.now() };
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
}
