import * as xlsx from 'xlsx';

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

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs/export?format=xlsx';

function formatNumber(val: any): string {
  if (val == null) return '';
  const s = String(val).trim();
  if (!s) return '';
  // If already formatted with dots (Vietnamese number format), keep as-is
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return s;
  // If it's a raw number, format with dots
  const num = parseFloat(s.replace(/,/g, ''));
  if (!isNaN(num) && num > 999) {
    return num.toLocaleString('vi-VN');
  }
  return s;
}

function cleanTitle(raw: string): string {
  let t = raw.trim();
  // Remove leading numbering like "1. ", "2. "
  t = t.replace(/^\d+\.\s*/, '');
  return t;
}

let cachedWb: any = null;

async function fetchWithRetry(url: string, retries = 3): Promise<ArrayBuffer> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.arrayBuffer();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Failed after retries');
}

export async function fetchResultsData(): Promise<ResultsData> {
  if (!cachedWb) {
    const buf = await fetchWithRetry(SHEET_URL);
    cachedWb = xlsx.read(buf, { type: 'array' });
  }
  const wb = cachedWb;

  // Find the target sheet
  const sheetIdx = wb.SheetNames.findIndex((n: string) => n.includes('Giải thưởng Quý'));
  if (sheetIdx === -1) {
    return { mainTitle: 'Kết quả Thi đua Quý I/2026', sections: [] };
  }

  const sheet = wb.Sheets[wb.SheetNames[sheetIdx]];
  const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  // First non-empty row = main title
  let mainTitle = 'KẾT QUẢ THI ĐUA QUÝ I/2026';
  if (rows[0] && rows[0][0]) {
    mainTitle = String(rows[0][0]).trim();
  }

  const sections: ResultSection[] = [];
  let r = 0;

  while (r < rows.length) {
    // Look for a title row: single cell with text, followed by empty row, then header
    const row = rows[r];
    if (!row || row.length === 0) { r++; continue; }

    const nonNull = row.filter((c: any) => c != null && String(c).trim() !== '');
    if (nonNull.length === 0) { r++; continue; }

    // Check if this is a section title (single cell with text, not a header row)

    // Skip the main title row
    if (r === 0) { r++; continue; }

    // Detect header rows (multiple short column names)
    const shortCells = row.filter((c: any) => c != null && typeof c === 'string' && c.trim().length > 0 && c.trim().length < 60);
    const isHeader = shortCells.length >= 2 && (
      row.some((c: any) => typeof c === 'string' && (c.toLowerCase().includes('tên') || c.toLowerCase().includes('họ và'))) &&
      row.some((c: any) => typeof c === 'string' && (c.toLowerCase().includes('mã') || c.toLowerCase().includes('doanh') || c.toLowerCase().includes('thưởng') || c.toLowerCase().includes('team') || c.toLowerCase().includes('cấp bậc')))
    );

    if (isHeader) {
      // This is a header row - find the title above it
      let title = '';
      for (let k = r - 1; k >= Math.max(0, r - 5); k--) {
        if (!rows[k]) continue;
        const kNonNull = rows[k].filter((c: any) => c != null && String(c).trim() !== '');
        if (kNonNull.length > 0) {
          const candidate = String(kNonNull[0]).trim();
          if (candidate.length > 3) {
            title = candidate;
            break;
          }
        }
      }

      if (!title) title = `Hạng mục ${sections.length + 1}`;

      // Extract columns
      const columns: string[] = row
        .map((c: any) => c != null ? String(c).trim().replace(/\n/g, ' ') : '')
        .filter((c: string) => c.length > 0);

      // Extract data rows
      const entries: ResultEntry[] = [];
      let isEmpty = false;
      let emptyMessage = '';
      let dr = r + 1;
      for (; dr < rows.length; dr++) {
        const dataRow = rows[dr];
        if (!dataRow) continue;
        const dataNonNull = dataRow.filter((c: any) => c != null && String(c).trim() !== '');
        if (dataNonNull.length === 0) break;

        // Check if this is a "no data" message
        const firstDataCell = String(dataRow[0] || '').trim();
        if (firstDataCell.toLowerCase().includes('chưa có') || firstDataCell.toLowerCase().includes('không có')) {
          isEmpty = true;
          emptyMessage = firstDataCell;
          dr++;
          break;
        }

        // Check if it's a new section title (single long text)
        const dataShortCells = dataRow.filter((c: any) => c != null && typeof c === 'string' && c.trim().length > 0 && c.trim().length < 60);
        if (dataNonNull.length === 1 && firstDataCell.length > 10) break;
        // Also check if it looks like a header row
        if (dataShortCells.length >= 2) {
          const rowStr = dataShortCells.map((c: any) => String(c).toLowerCase()).join(' ');
          if ((rowStr.includes('tên') || rowStr.includes('họ và')) && (rowStr.includes('mã') || rowStr.includes('doanh') || rowStr.includes('thưởng'))) break;
        }

        // Format cells
        const cells: string[] = [];
        for (let ci = 0; ci < columns.length; ci++) {
          cells.push(formatNumber(dataRow[ci]));
        }
        entries.push({ cells });
      }

      sections.push({
        id: `section_${sections.length}`,
        title: cleanTitle(title),
        columns,
        entries,
        isEmpty,
        emptyMessage,
      });

      r = dr;
      continue;
    }

    r++;
  }

  return { mainTitle, sections };
}
