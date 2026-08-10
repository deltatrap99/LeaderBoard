import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 phút

const SHEET_ID = '1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs';
const SHEETS = {
  month: '2082250939',    // Tháng 8
  quarter: '1375120696',  // Quý III
  semester: '1782144566', // Kỳ II
};

function isEligibleStatus(s: string): boolean {
  if (!s) return false;
  const lower = s.toLowerCase();
  if (lower.includes('chưa')) return false;
  return lower.includes('đủ điều kiện') || lower.includes('đạt điều kiện');
}

function parseNum(s: string): number {
  if (!s) return 0;
  return Number(String(s).replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.\-]/g, '')) || 0;
}

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
      rows.push(row);
      row = []; field = '';
    } else { field += c; }
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  return rows;
}

function findSection(rows: string[][], num: string): number {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].startsWith(num + '.')) return i;
  }
  return -1;
}

async function fetchCsv(gid: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  const text = await res.text();
  return parseCsv(text);
}

function parseMonthData(t07: string[][]) {
  const s1 = findSection(t07, '1');
  const s2 = findSection(t07, '2');
  const s3 = findSection(t07, '3');
  const s4 = findSection(t07, '4');
  const categories: any[] = [];

  // Helper to find header and almost columns
  function findHeaders(rows: string[][], start: number, end: number) {
    let hdr = -1, almostStart = -1;
    for (let i = start; i < end; i++) {
      if (rows[i][1] === 'Mã Đại sứ') {
        hdr = i;
        for (let j = 5; j < rows[i].length; j++) {
          if (rows[i][j] === 'Mã Đại sứ') { almostStart = j; break; }
        }
        break;
      }
    }
    return { hdr, almostStart };
  }

  // 1. Thưởng ĐS Mới Tháng 8
  // Cols: ,Mã, Tên, Ngày tham gia, Doanh số, Thưởng, Đạt/cận đạt
  {
    const { hdr } = findHeaders(t07, s1, s2);
    const eligible: any[] = [], almost: any[] = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < s2; i++) {
        const r = t07[i];
        if (!r[1] || !/^\d+$/.test(r[1])) continue;
        const statusRaw = (r[6] || r[5] || '').trim();
        const elig = isEligibleStatus(statusRaw);
        const entry = {
          id: r[1], name: r[2],
          highlight: elig,
          status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
          // Bỏ cột Thưởng (r[5]), chỉ lấy Ngày + Doanh số
          columns: [{ label: 'Ngày tham gia', value: r[3] || '' }, { label: 'Doanh số cá nhân', value: r[4] || '0' }],
          score2: r[3] || '', score2Label: 'Ngày tham gia',
          score: parseNum(r[4]), scoreLabel: 'Doanh số cá nhân'
        };
        if (elig) eligible.push(entry); else almost.push(entry);
      }
    }
    categories.push({
      categoryId: 'cat_month_dsm', categoryName: '1. THƯỞNG ĐẠI SỨ MỚI THÁNG 8',
      topRankers: eligible.slice(0, 3), otherRankers: [...eligible.slice(3), ...almost],
      hasMultipleScores: true, scoreLabels: ['Ngày tham gia', 'Doanh số cá nhân']
    });
  }

  // 2. ĐS GD Xuất sắc Tháng 8
  // Top 1: DS >= 200M, Top 2: >= 150M, Top 3: >= 100M
  // Cols: ,Mã, Tên, Doanh số, (empty), Đạt/cận đạt
  {
    const { hdr } = findHeaders(t07, s2, s3);
    const allRankers: any[] = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < s3; i++) {
        const r = t07[i];
        if (!r[1] || !/^\d+$/.test(r[1])) continue;
        const ds = parseNum(r[3]);
        const statusRaw = (r[5] || r[6] || '').trim();
        const elig = isEligibleStatus(statusRaw);
        allRankers.push({
          id: r[1], name: r[2],
          highlight: elig,
          status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
          columns: [{ label: 'Doanh số cá nhân', value: r[3] || '0' }],
          score: ds, scoreLabel: 'Doanh số cá nhân'
        });
      }
    }
    // Phân top theo ngưỡng DS và gán đúng rank cho podium
    // Top 1 bục (rank=1): DS >= 200M | Top 2 bục (rank=2): >= 150M | Top 3 bục (rank=3): >= 100M
    const top1 = allRankers.filter(r => r.score >= 200000000);
    const top2 = allRankers.filter(r => r.score >= 150000000 && r.score < 200000000);
    const top3 = allRankers.filter(r => r.score >= 100000000 && r.score < 150000000);
    const below = allRankers.filter(r => r.score < 100000000);
    // Gán rank để Podium component biết đặt đúng slot (slot trống → placeholder)
    const podiumRankers: any[] = [];
    if (top1.length > 0) podiumRankers.push({...top1[0], rank: 1});
    if (top2.length > 0) podiumRankers.push({...top2[0], rank: 2});
    if (top3.length > 0) podiumRankers.push({...top3[0], rank: 3});
    const tableRest = [
      ...top1.slice(1), ...top2.slice(1), ...top3.slice(1), ...below
    ];
    categories.push({
      categoryId: 'cat_month_dsgd', categoryName: '2. ĐẠI SỨ GIÁO DỤC XUẤT SẮC THÁNG 8',
      topRankers: podiumRankers, otherRankers: tableRest,
      hasMultipleScores: false, scoreLabels: ['Doanh số cá nhân']
    });
  }

  // 3. QL Tuyển dụng Tháng 8 - chưa có ai đủ ĐK -> noPodium
  // Cols: ,Mã, Tên, SL ĐS mới PSDT, Doanh thu ĐS mới, Thưởng, Đạt/cận đạt
  {
    const { hdr } = findHeaders(t07, s3, s4);
    const allRankers: any[] = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < s4; i++) {
        const r = t07[i];
        if (!r[1] || !/^\d+$/.test(r[1])) continue;
        const statusRaw = (r[6] || '').trim();
        const elig = isEligibleStatus(statusRaw);
        allRankers.push({
          id: r[1], name: r[2],
          highlight: elig,
          status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
          columns: [{ label: 'SL Đại sứ mới PSDT', value: r[3] || '0' }, { label: 'Doanh thu ĐS mới', value: r[4] || '0' }],
          score: parseNum(r[3]), scoreLabel: 'SL Đại sứ mới PSDT',
          score2: parseNum(r[4]), score2Label: 'Doanh thu ĐS mới'
        });
      }
    }
    const hasEligible = allRankers.some(r => r.highlight);
    categories.push({
      categoryId: 'cat_month_qltd', categoryName: '3. QUẢN LÝ TUYỂN DỤNG XUẤT SẮC THÁNG 8',
      // Nếu chưa ai đủ ĐK: topRankers=[] -> không hiện podium
      topRankers: hasEligible ? allRankers.filter(r => r.highlight).slice(0, 3) : [],
      otherRankers: hasEligible ? [...allRankers.filter(r => r.highlight).slice(3), ...allRankers.filter(r => !r.highlight)] : allRankers,
      hasMultipleScores: true, scoreLabels: ['SL Đại sứ mới PSDT', 'Doanh thu ĐS mới']
    });
  }

  // 4. QL Tiêu biểu Tháng 8
  // Cols: Cấp, Mã, Tên, Cấp bậc, Thực đạt, Số ĐS active, Thưởng, Đạt/cận đạt
  {
    let hdr = -1;
    for (let i = s4; i < t07.length; i++) {
      if (t07[i][1] === 'Mã Đại sứ') { hdr = i; break; }
    }
    let currentLevel = '';
    const allRankers: any[] = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < t07.length; i++) {
        const r = t07[i];
        if (r[0] && r[0].startsWith('Cấp')) currentLevel = r[0];
        if (!r[1] || !/^\d+$/.test(r[1])) continue;
        const statusRaw = (r[7] || '').trim();
        const elig = isEligibleStatus(statusRaw);
        allRankers.push({
          id: r[1], name: r[2], region: currentLevel,
          highlight: elig,
          status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
          // Bỏ region (Cấp bậc) dưới tên -> đã có cột Cấp bậc riêng
          columns: [{ label: 'Cấp bậc', value: r[3] || '' }, { label: 'Thực đạt mục tiêu cam kết', value: r[4] || '' }, { label: 'Số đại sứ mới active trong đội ngũ', value: r[5] || '0' }],
          score: parseNum(r[4]), scoreLabel: 'Thực đạt mục tiêu cam kết',
          score2: parseNum(r[5]), score2Label: 'Số đại sứ mới active trong đội ngũ'
        });
      }
    }
    categories.push({
      categoryId: 'cat_month_qltb', categoryName: '4. QUẢN LÝ TIÊU BIỂU THÁNG 8',
      topRankers: [], otherRankers: allRankers,
      hasMultipleScores: true, scoreLabels: ['Cấp bậc', 'Thực đạt mục tiêu cam kết', 'Số đại sứ mới active trong đội ngũ']
    });
  }

  return categories;
}

function parseQuarterData(q3: string[][]) {
  const q1s = findSection(q3, '1');
  const q2s = findSection(q3, '2');
  const q3s = findSection(q3, '3');
  const q4s = findSection(q3, '4');
  const categories: any[] = [];

  // 1. Top 3 ĐS GD Xuất sắc Q3
  {
    let hdr = -1;
    for (let i = q1s; i < q2s; i++) {
      if (q3[i][0] === 'Mã Đại sứ') { hdr = i; break; }
    }
    const rankers: any[] = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < q2s; i++) {
        const r = q3[i];
        if (!r[0] || !/^\d+$/.test(r[0])) break;
        rankers.push({
          id: r[0], name: r[1], highlight: true,
          columns: [{ label: 'Số HV tuyển sinh', value: r[2] || '0' }, { label: 'Doanh số quý', value: r[3] || '0' }, { label: 'Team', value: r[4] || '' }],
          score: parseNum(r[2]), scoreLabel: 'Số HV tuyển sinh',
          score2: parseNum(r[3]), score2Label: 'Doanh số quý',
          rank: parseNum(r[5]), hideBadge: true
        });
      }
    }
    categories.push({
      categoryId: 'cat_q3_top3', categoryName: '1. TOP 3 ĐẠI SỨ GIÁO DỤC XUẤT SẮC QUÝ III',
      topRankers: rankers.slice(0, 3), otherRankers: rankers.slice(3),
      hasMultipleScores: true, scoreLabels: ['Số HV tuyển sinh', 'Doanh số quý', 'Team']
    });
  }

  // 2. Đại sứ Vàng Q3 - chưa có ai đủ ĐK -> không hiện podium
  {
    let hdr = -1;
    for (let i = q2s; i < q3s; i++) {
      if (q3[i][0] === 'Mã Đại sứ') { hdr = i; break; }
    }
    const allRankers: any[] = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < q3s; i++) {
        const r = q3[i];
        if (!r[0] || !/^\d+$/.test(r[0])) continue;
        const statusRaw = (r[5] || '').trim();
        const elig = isEligibleStatus(statusRaw);
        allRankers.push({
          id: r[0], name: r[1],
          highlight: elig,
          status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
          columns: [{ label: 'Số HV tuyển sinh', value: r[2] || '0' }, { label: 'Doanh số quý', value: r[3] || '0' }, { label: 'Team', value: r[4] || '' }],
          score: parseNum(r[2]), scoreLabel: 'Số HV tuyển sinh',
          score2: parseNum(r[3]), score2Label: 'Doanh số quý'
        });
      }
    }
    const hasEligible = allRankers.some(r => r.highlight);
    categories.push({
      categoryId: 'cat_q3_vang', categoryName: '2. ĐẠI SỨ VÀNG QUÝ III',
      topRankers: hasEligible ? allRankers.filter(r => r.highlight).slice(0, 3) : [],
      otherRankers: hasEligible ? [...allRankers.filter(r => r.highlight).slice(3), ...allRankers.filter(r => !r.highlight)] : allRankers,
      hasMultipleScores: true, scoreLabels: ['Số HV tuyển sinh', 'Doanh số quý', 'Team']
    });
  }

  // 3. QL Tuyển dụng Q3 - chưa ai đủ ĐK -> không hiện podium
  {
    const end = q4s >= 0 ? q4s : q3.length;
    let hdr = -1;
    for (let i = q3s; i < end; i++) {
      if (q3[i][0] === 'Mã Đại sứ') { hdr = i; break; }
    }
    const allRankers: any[] = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < end; i++) {
        const r = q3[i];
        if (!r[0] || !/^\d+$/.test(r[0])) continue;
        const statusRaw = (r[5] || '').trim();
        const elig = isEligibleStatus(statusRaw);
        allRankers.push({
          id: r[0], name: r[1],
          highlight: elig,
          status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
          columns: [{ label: 'Số lượng Đại sứ mới active', value: r[2] || '0' }, { label: 'Tổng doanh số Đại sứ mới active', value: r[3] || '0' }, { label: 'Team', value: r[4] || '' }],
          score: parseNum(r[2]), scoreLabel: 'Số lượng Đại sứ mới active',
          score2: parseNum(r[3]), score2Label: 'Tổng doanh số Đại sứ mới active'
        });
      }
    }
    const hasEligible = allRankers.some(r => r.highlight);
    categories.push({
      categoryId: 'cat_q3_qltd', categoryName: '3. QUẢN LÝ TUYỂN DỤNG XUẤT SẮC QUÝ III',
      topRankers: hasEligible ? allRankers.filter(r => r.highlight).slice(0, 3) : [],
      otherRankers: hasEligible ? [...allRankers.filter(r => r.highlight).slice(3), ...allRankers.filter(r => !r.highlight)] : allRankers,
      hasMultipleScores: true, scoreLabels: ['Số lượng Đại sứ mới active', 'Tổng doanh số Đại sứ mới active', 'Team']
    });
  }

  // 4. QL Tiêu biểu Q3 - parse thực từ sheet
  // Cols: Cấp Trưởng Nhóm/..., col1=Mã, col2=Tên, col3=Cấp bậc, col4=Thực đạt, col5=Số ĐS active, col6=Đạt
  if (q4s >= 0) {
    let hdr = -1;
    for (let i = q4s; i < q3.length; i++) {
      if (q3[i][1] === 'Mã Đại sứ') { hdr = i; break; }
    }
    let currentLevel = '';
    const allRankers: any[] = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < q3.length; i++) {
        const r = q3[i];
        if (r[0] && r[0].startsWith('Cấp')) currentLevel = r[0];
        if (!r[1] || !/^\d+$/.test(r[1])) continue;
        const statusRaw = (r[6] || '').trim();
        const elig = isEligibleStatus(statusRaw);
        allRankers.push({
          id: r[1], name: r[2], region: currentLevel,
          highlight: elig,
          status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
          columns: [{ label: 'Cấp bậc', value: r[3] || '' }, { label: 'Thực đạt mục tiêu cam kết', value: r[4] || '' }, { label: 'Số đại sứ mới active trong đội ngũ', value: r[5] || '0' }],
          score: parseNum(r[4]), scoreLabel: 'Thực đạt mục tiêu cam kết',
          score2: parseNum(r[5]), score2Label: 'Số đại sứ mới active trong đội ngũ'
        });
      }
    }
    categories.push({
      categoryId: 'cat_q3_qltb', categoryName: '4. QUẢN LÝ TIÊU BIỂU QUÝ III',
      topRankers: [], otherRankers: allRankers,
      hasMultipleScores: true, scoreLabels: ['Cấp bậc', 'Thực đạt mục tiêu cam kết', 'Số đại sứ mới active trong đội ngũ']
    });
  }

  return categories;
}

function parseSemesterData(k2: string[][]) {
  const categories: any[] = [];
  let hdr = -1, rightStart = -1;
  for (let i = 0; i < k2.length; i++) {
    if (k2[i][0] === 'Mã Đại sứ' && k2[i].some(c => c.includes('Doanh số Kỳ II'))) {
      hdr = i;
      for (let j = 6; j < k2[i].length; j++) { if (k2[i][j] === 'Mã Đại sứ') { rightStart = j; break; } }
      break;
    }
  }

  // Left: ĐS GD Xuất sắc Kỳ II
  // Phần thưởng: r[5] = '100% chuyến du lịch quốc tế' / '50% chuyến du lịch quốc tế'
  // Đạt/chưa đạt: r[6]
  {
    const eligible: any[] = [], almost: any[] = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < k2.length; i++) {
        const r = k2[i];
        if (!r[0] || !/^\d+$/.test(r[0])) continue;
        const award = (r[5] || '').trim();
        const statusRaw = (r[6] || '').trim();
        const elig = isEligibleStatus(statusRaw) || isEligibleStatus(award);
        const awardLabel = award.includes('100%') ? '✈️ 100% CHUYẾN DU LỊCH QUỐC TẾ' : award.includes('50%') ? '✈️ 50% CHUYẾN DU LỊCH QUỐC TẾ' : '';
        const entry = {
          id: r[0], name: r[1],
          highlight: elig,
          status: awardLabel || (elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện'),
          columns: [{ label: 'Doanh số Kỳ II', value: r[2] || '0' }, { label: 'Số HV tuyển sinh', value: r[3] || '0' }, { label: 'Team', value: r[4] || '' }],
          score: parseNum(r[2]), scoreLabel: 'Doanh số Kỳ II',
          score2: parseNum(r[3]), score2Label: 'Số HV tuyển sinh',
          rank: i - hdr, hideBadge: false
        };
        if (elig) eligible.push(entry); else almost.push(entry);
      }
    }
    categories.push({
      categoryId: 'cat_k2_dsgd', categoryName: '1. GIẢI ĐẠI SỨ GIÁO DỤC XUẤT SẮC KỲ II',
      topRankers: eligible.slice(0, 3), otherRankers: [...eligible.slice(3), ...almost],
      hasMultipleScores: true, scoreLabels: ['Doanh số Kỳ II', 'Số HV tuyển sinh', 'Team']
    });
  }

  // Right: QL Xuất sắc Kỳ II
  // Phần thưởng: r[rightStart+4], Đạt: r[rightStart+5]
  {
    const eligible: any[] = [], almost: any[] = [];
    if (hdr >= 0 && rightStart >= 0) {
      for (let i = hdr + 1; i < k2.length; i++) {
        const r = k2[i];
        if (!r[rightStart] || !/^\d+$/.test(r[rightStart])) continue;
        const statusRaw = (r[rightStart + 5] || r[rightStart + 4] || '').trim();
        const elig = isEligibleStatus(statusRaw);
        const entry = {
          id: r[rightStart], name: r[rightStart + 1],
          highlight: elig,
          status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
          columns: [{ label: 'Doanh số Kỳ II', value: r[rightStart + 2] || '0' }, { label: 'Số ĐS Active', value: r[rightStart + 3] || '0' }],
          score: parseNum(r[rightStart + 2]), scoreLabel: 'Doanh số Kỳ II',
          score2: parseNum(r[rightStart + 3]), score2Label: 'Số ĐS Active',
          rank: i - hdr, hideBadge: false
        };
        if (elig) eligible.push(entry); else almost.push(entry);
      }
    }
    categories.push({
      categoryId: 'cat_k2_qlxs', categoryName: '2. GIẢI QUẢN LÝ XUẤT SẮC KỲ II',
      topRankers: eligible.slice(0, 3), otherRankers: [...eligible.slice(3), ...almost],
      hasMultipleScores: true, scoreLabels: ['Doanh số Kỳ II', 'Số ĐS Active']
    });
  }

  return categories;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');

  // In-memory cache 30 phút
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return res.json(cache.data);
  }

  try {
    // Fetch all 3 CSVs in parallel from Google Sheets
    const [monthCsv, quarterCsv, semesterCsv] = await Promise.all([
      fetchCsv(SHEETS.month),
      fetchCsv(SHEETS.quarter),
      fetchCsv(SHEETS.semester),
    ]);

    const data = {
      month: parseMonthData(monthCsv),
      quarter: parseQuarterData(quarterCsv),
      semester: parseSemesterData(semesterCsv),
      challenge: [],
    };

    cache = { data, timestamp: Date.now() };
    return res.json(data);
  } catch (err) {
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
}
