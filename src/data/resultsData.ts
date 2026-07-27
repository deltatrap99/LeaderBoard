export interface ResultEntry {
  cells: string[];
}

export interface ResultSection {
  id: string;
  title: string;
  subtitle?: string;
  columns: string[];
  entries: ResultEntry[];
  isEmpty?: boolean;
  emptyMessage?: string;
}

export interface ResultsData {
  mainTitle: string;
  sections: ResultSection[];
}

/**
 * Fetch results data from Vercel API (cached, pre-parsed JSON).
 * Fallback: fetch directly from Apps Script URL.
 */
export async function fetchResultsData(period: string = 'q1'): Promise<ResultsData> {
  // Try Vercel API first
  try {
    const res = await fetch(`/api/results?period=${period}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback below
  }

  // Fallback: direct Apps Script call
  const appsScriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (appsScriptUrl) {
    const res = await fetch(`${appsScriptUrl}?action=results`);
    if (res.ok) {
      return await res.json();
    }
  }

  return { mainTitle: 'Kết quả Thi đua Quý I/2026', sections: [] };
}
