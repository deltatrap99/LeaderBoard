import type { VercelRequest, VercelResponse } from '@vercel/node';

let cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 phút

const SHEET_ID = '1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs';
const RESULTS_GIDS: Record<string, string> = {
  t06: '347513982',
  q2: '1610659964',
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let field = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { inQuotes = !inQuotes; }
    else if (c === ',' && !inQuotes) { row.push(field.trim()); field = ''; }
    else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field.trim());
      if (row.some(f => f !== '')) rows.push(row);
      row = []; field = '';
    } else { field += c; }
  }
  if (field || row.length) { row.push(field.trim()); if (row.some(f => f !== '')) rows.push(row); }
  return rows;
}

function processResultsCsv(text: string, periodPrefix: string, mainTitle: string) {
  const rows = parseCsv(text);
  const rawSections: { title: string; rows: string[][] }[] = [];
  let currentSection: { title: string; rows: string[][] } | null = null;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const firstCell = r[0] || '';
    if (/^[0-9]+(\.[0-9]+)?\.\s/.test(firstCell)) {
      if (currentSection) rawSections.push(currentSection);
      const title = firstCell.replace(/^[0-9]+(\.[0-9]+)?\.\s*/, '').trim();
      currentSection = { title, rows: [] };
      continue;
    }
    if (currentSection) {
      currentSection.rows.push(r);
    }
  }
  if (currentSection) rawSections.push(currentSection);

  const sections: any[] = [];

  rawSections.forEach((sec, idx) => {
    const secTitle = sec.title;
    const secId = periodPrefix + '-sec-' + (idx + 1);

    let isEmpty = false;
    let headerRowIdx = -1;

    for (let j = 0; j < sec.rows.length; j++) {
      const rowStr = sec.rows[j].join(' ');
      if (rowStr.includes('Chưa có Đại sứ đạt')) {
        isEmpty = true;
        break;
      }
      if (sec.rows[j].some(c => c === 'Mã Đại sứ' || c === 'STT' || c === 'Cấp bậc')) {
        headerRowIdx = j;
        break;
      }
    }

    if (isEmpty) {
      sections.push({
        id: secId,
        title: secTitle,
        columns: [],
        entries: [],
        isEmpty: true,
        emptyMessage: 'Chưa có Đại sứ đạt'
      });
      return;
    }

    if (headerRowIdx === -1) return;

    const rawHeaderRow = sec.rows[headerRowIdx];
    let columns: string[] = [];
    let hasSttHeader = rawHeaderRow[0] === 'STT' || rawHeaderRow[0] === '#';
    let hasEmptyCol0 = rawHeaderRow[0] === '';

    if (hasSttHeader) {
      columns = rawHeaderRow.slice(1).filter(c => c !== '');
    } else if (hasEmptyCol0) {
      columns = rawHeaderRow.filter(c => c !== '');
      if (sec.rows[headerRowIdx + 1] && /^Cấp\s/i.test(sec.rows[headerRowIdx + 1][0])) {
        columns.unshift('Cấp');
      }
    } else {
      columns = rawHeaderRow.filter(c => c !== '');
    }

    // Remove 'Tích tỉ lệ thực đạt' column if present
    const removeIdx = columns.findIndex(c => c.toLowerCase().includes('tích tỉ lệ') || c.toLowerCase().includes('tích tỷ lệ'));
    if (removeIdx !== -1) {
      columns.splice(removeIdx, 1);
    }

    const entries: any[] = [];
    for (let j = headerRowIdx + 1; j < sec.rows.length; j++) {
      const row = sec.rows[j];
      if (!row.some(c => c !== '')) continue;

      let cells: string[] = [];
      if (hasSttHeader && /^\d+$/.test(row[0])) {
        cells = row.slice(1);
      } else if (hasEmptyCol0 && row[0] === '' && !/^Cấp\s/i.test(row[0])) {
        cells = row.slice(1);
      } else {
        cells = row.filter(c => c !== '');
      }

      if (removeIdx !== -1 && cells.length > removeIdx) {
        cells.splice(removeIdx, 1);
      }

      // Slice cells to columns length so no extra empty cells exist
      cells = cells.slice(0, columns.length);

      cells = cells.map((cell, ci) => {
        const colName = (columns[ci] || '').toLowerCase();
        if ((colName.includes('doanh số') || colName.includes('doanh thu') || colName.includes('thưởng')) && cell && !cell.includes('₫') && /[\d.]+/.test(cell)) {
          return cell + ' ₫';
        }
        return cell;
      });

      if (cells.length > 0) {
        entries.push({ cells });
      }
    }

    sections.push({
      id: secId,
      title: secTitle,
      columns,
      entries
    });
  });

  return { mainTitle, sections };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');

  const period = String(req.query.period || 'q1').toLowerCase();

  if (cache[period] && Date.now() - cache[period].timestamp < CACHE_TTL) {
    return res.json(cache[period].data);
  }

  const gid = RESULTS_GIDS[period];
  if (gid) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
      const response = await fetch(url);
      const csvText = await response.text();
      const title = period === 't06' ? 'Kết quả Thi đua Tháng 06/2026' : 'Kết quả Thi đua Quý II/2026';
      const data = processResultsCsv(csvText, period, title);

      cache[period] = { data, timestamp: Date.now() };
      return res.json(data);
    } catch {
      // Fallback below
    }
  }

  // Fallback: Apps Script call
  try {
    const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
    if (APPS_SCRIPT_URL) {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=results&t=${Date.now()}`);
      const data = await response.json();
      cache[period] = { data, timestamp: Date.now() };
      return res.json(data);
    }
  } catch {
    // Ignore
  }

  return res.status(404).json({ error: 'Data not found for period' });
}
