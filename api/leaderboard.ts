import type { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore
import staticData from '../api_response.json';

let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Cache CDN 5 phút
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  // In-memory cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return res.json(cache.data);
  }

  // Serve from bundled api_response.json
  cache = { data: staticData, timestamp: Date.now() };
  return res.json(staticData);
}
