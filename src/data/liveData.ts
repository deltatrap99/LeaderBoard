import * as xlsx from 'xlsx';

export interface Ambassador {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  score2?: number;        // Cột thứ 2 (vd: Doanh số N-1 mới)
  score2Label?: string;   // Label cột 2
  scoreLabel?: string;    // Label cột 1 (vd: Số lượng N-1 mới active)
  region?: string;
}

export interface CategoryResult {
  categoryId: string;
  categoryName: string;
  topRankers: Ambassador[]; 
  otherRankers: Ambassador[];
  hasMultipleScores?: boolean;
  scoreLabels?: string[];
}

export interface LeaderboardData {
  month: CategoryResult[];
  quarter: CategoryResult[];
  challenge: CategoryResult[];
  semester: CategoryResult[];
}

const url = 'https://docs.google.com/spreadsheets/d/1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs/export?format=xlsx';

function categorizeSheet(sheetName: string): keyof LeaderboardData | null {
  const name = sheetName.toLowerCase();
  if (name.includes('trang tính') || name.includes('mục lục') || name.includes('index')) return null;
  if (name.includes('tháng') || name.includes('t03') || name.includes('tiêu biểu t')) return 'month';
  if (name.includes('quý') || name.includes('vàng q') || name.includes('tiêu biểu q')) return 'quarter';
  if (name.includes('kỳ') || name.includes('giáo d')) return 'semester';
  if (name.includes('challenge') || name.includes('cá nhân')) return 'challenge';
  return 'month';
}

function isRecruitmentSheet(sheetName: string): boolean {
  const name = sheetName.toLowerCase().trim();
  return name.includes('tuyển dụng') || name.includes('quản lý tuyển');
}

function isGoldAmbassadorSheet(sheetName: string): boolean {
  const name = sheetName.toLowerCase().trim();
  return name.includes('vàng') || name.includes('egc');
}

export async function fetchLeaderboardData(): Promise<LeaderboardData> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const wb = xlsx.read(buf, { type: 'array' });
  
  const data: LeaderboardData = { month: [], quarter: [], challenge: [], semester: [] };

  for (let i = 1; i < wb.SheetNames.length; i++) {
    const sheetName = wb.SheetNames[i];
    const categoryType = categorizeSheet(sheetName);
    if (!categoryType) continue;

    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    
    let headerRowIdx = -1;
    for (let r = 0; r < 10; r++) {
       if (!rows[r]) continue;
       const rowStr = rows[r].map((c: any) => String(c).toLowerCase()).join(' ');
       if (rowStr.includes('tên') && (rowStr.includes('mã') || rowStr.includes('doanh số') || rowStr.includes('thành tích') || rowStr.includes('đại sứ') || rowStr.includes('n-1') || rowStr.includes('tuyển dụng') || rowStr.includes('active') || rowStr.includes('hv mới'))) {
         headerRowIdx = r;
         break;
       }
    }

    if (headerRowIdx === -1) {
       for (let r = 0; r < 10; r++) {
         if (!rows[r]) continue;
         const rowStr = rows[r].map((c: any) => String(c).toLowerCase()).join(' ');
         if ((rowStr.includes('mã') || rowStr.includes('stt')) && rowStr.includes('đại sứ')) {
           headerRowIdx = r;
           break;
         }
       }
    }

    if (headerRowIdx === -1) continue;

    const headerRow = rows[headerRowIdx];
    const recruitment = isRecruitmentSheet(sheetName);
    const goldAmbassador = isGoldAmbassadorSheet(sheetName);

    // ========== XỬ LÝ RIÊNG CHO SHEET ĐẠI SỨ VÀNG ==========
    // Sheet cấu trúc: Mã Đại sứ | Tên Đại sứ | Số lượng HV mới | Doanh số cá nhân
    // Sort ưu tiên: Số lượng HV mới trước, Doanh số sau
    if (goldAmbassador) {
      let nameIdx = -1, idIdx = -1, hvMoiIdx = -1, doanhSoIdx = -1;
      let hvMoiLabel = 'Số lượng HV mới';
      let doanhSoLabel = 'Doanh số cá nhân';

      headerRow.forEach((col: any, idx: number) => {
        if (typeof col !== 'string') return;
        const c = col.toLowerCase().trim();
        if (c.includes('tên')) nameIdx = idx;
        if (c.includes('mã')) idIdx = idx;
        if (c.includes('số lượng') && c.includes('hv')) { hvMoiIdx = idx; hvMoiLabel = col.trim(); }
        if (c.includes('hv mới') && hvMoiIdx === -1) { hvMoiIdx = idx; hvMoiLabel = col.trim(); }
        if (c.includes('doanh số')) { doanhSoIdx = idx; doanhSoLabel = col.trim(); }
      });

      console.log(`[GoldAmbassador] nameIdx=${nameIdx}, idIdx=${idIdx}, hvMoiIdx=${hvMoiIdx}, doanhSoIdx=${doanhSoIdx}`);

      if (nameIdx === -1 || (hvMoiIdx === -1 && doanhSoIdx === -1)) continue;

      const ambassadors: Ambassador[] = [];
      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;
        
        const name = row[nameIdx];
        if (!name || typeof name !== 'string') continue;
        if (name.toLowerCase().includes('tổng') || name.toLowerCase().includes('đại sứ')) continue;

        const realId = idIdx !== -1 && row[idIdx] ? String(row[idIdx]) : `u_${r}`;
        
        let hvMoi = 0;
        let doanhSo = 0;
        
        if (hvMoiIdx !== -1 && row[hvMoiIdx] != null) {
          hvMoi = parseFloat(String(row[hvMoiIdx]).replace(/,/g, ''));
          if (isNaN(hvMoi)) hvMoi = 0;
        }
        if (doanhSoIdx !== -1 && row[doanhSoIdx] != null) {
          doanhSo = parseFloat(String(row[doanhSoIdx]).replace(/,/g, ''));
          if (isNaN(doanhSo)) doanhSo = 0;
        }

        if (hvMoi > 0 || doanhSo > 0) {
          ambassadors.push({
            id: realId,
            name: name.trim(),
            score: hvMoi,           // score = Số lượng HV mới (ưu tiên sort)
            score2: doanhSo,        // score2 = Doanh số cá nhân
            scoreLabel: hvMoiLabel,
            score2Label: doanhSoLabel,
          });
        }
      }

      // Sort ưu tiên: Số lượng HV mới trước, Doanh số sau
      ambassadors.sort((a, b) => b.score - a.score || (b.score2 ?? 0) - (a.score2 ?? 0));
      if (ambassadors.length === 0) continue;

      let categoryName = sheetName.trim();
      categoryName = categoryName.replace(/^Giải thưởng\s+/i, '');
      categoryName = categoryName.replace(/^EGC\s*-\s*/, '');
      if (categoryName.toLowerCase().includes('vàng q')) {
        categoryName = categoryName.replace(/Vàng Q(?:uý)?(?:[^a-zA-Z0-9]*)/i, 'Đại sứ Vàng Quý I/2026');
      }
      categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

      data[categoryType].push({
        categoryId: `cat_${i}`,
        categoryName,
        topRankers: ambassadors.slice(0, 3),
        otherRankers: ambassadors.slice(3),
        hasMultipleScores: true,
        scoreLabels: [hvMoiLabel, doanhSoLabel],
      });
      continue;
    }

    // ========== XỬ LÝ RIÊNG CHO SHEET TUYỂN DỤNG ==========
    // Sheet cấu trúc: Mã Đại sứ | Tên Đại sứ | Số lượng N-1 mới active | Doanh số N-1 mới
    if (recruitment) {
      let nameIdx = -1, idIdx = -1, n1ActiveIdx = -1, n1RevenueIdx = -1;
      let n1ActiveLabel = 'SL N-1 active';
      let n1RevenueLabel = 'DS N-1 mới';

      headerRow.forEach((col: any, idx: number) => {
        if (typeof col !== 'string') return;
        const c = col.toLowerCase().trim();
        if (c.includes('tên')) nameIdx = idx;
        if (c.includes('mã')) idIdx = idx;
        if (c.includes('số lượng') && c.includes('n-1')) { n1ActiveIdx = idx; n1ActiveLabel = col.trim(); }
        if (c.includes('active') && !c.includes('số lượng') && c.includes('n-1')) { n1ActiveIdx = idx; n1ActiveLabel = col.trim(); }
        if (c.includes('doanh số') && c.includes('n-1')) { n1RevenueIdx = idx; n1RevenueLabel = col.trim(); }
      });

      console.log(`[Recruitment] nameIdx=${nameIdx}, idIdx=${idIdx}, n1ActiveIdx=${n1ActiveIdx}, n1RevenueIdx=${n1RevenueIdx}`);

      if (nameIdx === -1 || (n1ActiveIdx === -1 && n1RevenueIdx === -1)) continue;

      const ambassadors: Ambassador[] = [];
      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;
        
        const name = row[nameIdx];
        if (!name || typeof name !== 'string') continue;
        if (name.toLowerCase().includes('tổng') || name.toLowerCase().includes('đại sứ')) continue;

        const realId = idIdx !== -1 && row[idIdx] ? String(row[idIdx]) : `u_${r}`;
        
        let n1Active = 0;
        let n1Revenue = 0;
        
        if (n1ActiveIdx !== -1 && row[n1ActiveIdx] != null) {
          n1Active = parseFloat(String(row[n1ActiveIdx]).replace(/,/g, ''));
          if (isNaN(n1Active)) n1Active = 0;
        }
        if (n1RevenueIdx !== -1 && row[n1RevenueIdx] != null) {
          n1Revenue = parseFloat(String(row[n1RevenueIdx]).replace(/,/g, ''));
          if (isNaN(n1Revenue)) n1Revenue = 0;
        }

        if (n1Active > 0 || n1Revenue > 0) {
          ambassadors.push({
            id: realId,
            name: name.trim(),
            score: n1Active,
            score2: n1Revenue,
            scoreLabel: n1ActiveLabel,
            score2Label: n1RevenueLabel,
          });
        }
      }

      ambassadors.sort((a, b) => b.score - a.score || (b.score2 ?? 0) - (a.score2 ?? 0));
      if (ambassadors.length === 0) continue;

      let categoryName = sheetName.trim();
      categoryName = categoryName.replace(/^Giải thưởng\s+/i, '');
      categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

      data[categoryType].push({
        categoryId: `cat_${i}`,
        categoryName,
        topRankers: ambassadors.slice(0, 3),
        otherRankers: ambassadors.slice(3),
        hasMultipleScores: true,
        scoreLabels: [n1ActiveLabel, n1RevenueLabel],
      });
      continue; // Xong sheet này, qua sheet kế
    }

    // ========== XỬ LÝ CÁC SHEET THÔNG THƯỜNG ==========
    const pairs: {nameIdx: number, scoreIdx: number, idIdx: number}[] = [];
    headerRow.forEach((col: any, idx: number) => {
      if (typeof col === 'string' && col.toLowerCase().includes('tên')) {
        let scoreIdx = -1;
        let idIdx = -1;
        for (let j = 0; j < headerRow.length; j++) {
           if (typeof headerRow[j] === 'string' && headerRow[j].toLowerCase().includes('mã') && Math.abs(j - idx) <= 3) {
               idIdx = j; break;
           }
        }
        for (let j = idx + 1; j <= idx + 5 && j < headerRow.length; j++) {
           const c = String(headerRow[j]).toLowerCase();
           if (c.includes('doanh số') || c.includes('tuyển dụng') || c.includes('điểm') || c.includes('tổng số') || c.includes('hệ số') || c.includes('thành tích')) {
               scoreIdx = j; break;
           }
        }
        if (scoreIdx !== -1) {
            pairs.push({ nameIdx: idx, scoreIdx, idIdx });
        }
      }
    });

    if (pairs.length === 0) {
        let nIdx = -1, sIdx = -1, iIdx = -1;
        headerRow.forEach((col: any, idx: number) => {
            if (typeof col === 'string') {
               const c = col.toLowerCase();
               if (nIdx === -1 && c.includes('tên')) nIdx = idx;
               if (sIdx === -1 && (c.includes('doanh số') || c.includes('điểm') || c.includes('thành tích'))) sIdx = idx;
               if (iIdx === -1 && c.includes('mã')) iIdx = idx;
            }
        });
        if (nIdx !== -1 && sIdx !== -1) {
            pairs.push({ nameIdx: nIdx, scoreIdx: sIdx, idIdx: iIdx !== -1 ? iIdx : nIdx - 1 });
        }
    }

    const ambassadors: Ambassador[] = [];
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;
      
      for (const p of pairs) {
          const name = row[p.nameIdx];
          const score = row[p.scoreIdx];
          
          if (!name || typeof name !== 'string') continue;
          if (name.toLowerCase().includes('tổng') || name.toLowerCase().includes('đại sứ')) continue;

          let numScore = parseFloat(String(score).replace(/,/g, ''));
          if (isNaN(numScore)) continue;

          const realId = p.idIdx !== -1 && row[p.idIdx] ? String(row[p.idIdx]) : `u_${r}_${p.nameIdx}`;

          if (numScore > 0) {
              ambassadors.push({
                id: realId,
                name: name.trim(),
                score: numScore,
              });
          }
      }
    }

    ambassadors.sort((a, b) => b.score - a.score);
    if (ambassadors.length === 0) continue;

    let categoryName = sheetName.trim();
    categoryName = categoryName.replace(/^Giải thưởng\s+/i, '');
    categoryName = categoryName.replace(/Giáo d\b/i, 'Giáo dục');
    categoryName = categoryName.replace(/Giáo d$/i, 'Giáo dục');
    categoryName = categoryName.replace(/^EGC\s*-\s*/, '');
    if (categoryName.toLowerCase().includes('vàng q')) {
        categoryName = categoryName.replace(/Vàng Q(?:uý)?(?:[^a-zA-Z0-9]*)/i, 'Vàng Quý I/2026');
    }
    // Fix "tiêu biểu T" → "tiêu biểu" (tên sheet bị cắt)
    categoryName = categoryName.replace(/tiêu biểu\s+T$/i, 'tiêu biểu');
    categoryName = categoryName.replace(/tiêu biểu\s+Q$/i, 'tiêu biểu');
    categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

    data[categoryType].push({
      categoryId: `cat_${i}`,
      categoryName,
      topRankers: ambassadors.slice(0, 3),
      otherRankers: ambassadors.slice(3),
    });
  }

  return data;
}
