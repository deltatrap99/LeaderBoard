import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

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

  // Try Apps Script first
  try {
    const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
    if (APPS_SCRIPT_URL) {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=leaderboard&t=${Date.now()}`);
      const data = await response.json();
      
      // Check if data has Q3 content (not stale Q2)
      const hasQ3 = data.quarter?.some((c: any) => 
        c.categoryName?.includes('III') || c.categoryName?.includes('Q3')
      );
      
      if (hasQ3) {
        cache = { data, timestamp: Date.now() };
        return res.json(data);
      }
      // If still Q2 data, fall through to static file
    }
  } catch {
    // Fallback below
  }

  // Fallback: serve from api_response.json
  try {
    const filePath = join(process.cwd(), 'api_response.json');
    const staticData = JSON.parse(readFileSync(filePath, 'utf8'));
    cache = { data: staticData, timestamp: Date.now() };
    return res.json(staticData);
  } catch {
    return res.status(500).json({ error: 'No data available' });
  }
}
