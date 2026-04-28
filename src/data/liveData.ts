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
  highlight?: boolean;    // Badge highlight cho người đạt target
}

export interface CategoryResult {
  categoryId: string;
  categoryName: string;
  categorySubtitle?: string;
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

const DEFAULT_URL = 'https://docs.google.com/spreadsheets/d/1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs/export?format=xlsx';

function categorizeSheet(sheetName: string): keyof LeaderboardData | null {
  const name = sheetName.toLowerCase();
  if (name.includes('trang tính') || name.includes('mục lục') || name.includes('index')) return null;
  // Skip the Q1 results summary sheet (displayed on dedicated Results page)
  if (name.includes('giải thưởng quý')) return null;
  // Skip old Tháng 03 sheets — Tháng 04 is now the current program
  if (/tháng\s*0?3/.test(name)) return null;
  // Skip Q1 challenge sheets (Q1 đã kết thúc, chưa có challenge Q2/T04)
  if (name.includes('challenge') || name.includes('cá nhân')) return null;
  if (name.includes('tháng') || /t\d{1,2}(?!\w)/.test(name) || name.includes('tiêu biểu t')) return 'month';
  if (name.includes('quý') || name.includes('vàng q') || name.includes('tiêu biểu q')) return 'quarter';
  if (name.includes('kỳ') || name.includes('giáo d') || name.includes('k1') || name.includes('k 1') || (name.includes('quản lý') && !name.includes('tuyển dụng')) || name.includes('qlxs')) return 'semester';
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

function isManagerSheet(sheetName: string): boolean {
  const name = sheetName.toLowerCase().trim();
  if (name.includes('tuyển dụng')) return false;
  return ((name.includes('tiêu biểu') || name.includes('xuất sắc')) && name.includes('quản lý')) || name.includes('qlxs');
}

export async function fetchLeaderboardData(sheetUrl?: string): Promise<LeaderboardData> {
  const url = sheetUrl || DEFAULT_URL;
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const wb = xlsx.read(buf, { type: 'array' });
  
  const data: LeaderboardData = { month: [], quarter: [], challenge: [], semester: [] };

  // Build list of sheets to process, deduplicating by base name.
  // When multiple sheets share the same base (e.g. "Giải thưởng Đại sứ mới Tháng 03" 
  // and "...Tháng 04"), keep only the last one (newest month).
  function getSheetBaseName(name: string): string {
    // Remove trailing month/quarter identifiers and numbers
    // "Giải thưởng Đại sứ mới Tháng 04" → "giải thưởng đại sứ mới"
    // "Giải thưởng Quản lý tiêu biểu 0" (truncated "04") → "giải thưởng quản lý tiêu biểu"
    return name.toLowerCase()
      .replace(/\s*tháng\s*\d+.*$/i, '')
      .replace(/\s*quý\s*\d+.*$/i, '')
      .replace(/\s+[tqk]\d*\s*$/i, '')  // trailing T03, Q1, K1
      .replace(/\s+\d+\s*$/i, '')       // trailing "04", "03" (from truncated names like "...biểu 0")
      .replace(/\s+[tqk]\s*$/i, '')     // trailing single T, Q, K (truncated)
      .trim();
  }

  const baseNameMap = new Map<string, number>(); // baseName → latest sheet index
  for (let i = 1; i < wb.SheetNames.length; i++) {
    const sheetName = wb.SheetNames[i];
    const categoryType = categorizeSheet(sheetName);
    if (!categoryType) continue;
    
    const base = getSheetBaseName(sheetName);
    // Always overwrite with later index (later sheet = newer month)
    baseNameMap.set(base, i);
  }
  
  const sheetsToProcess = new Set(baseNameMap.values());

  for (let i = 1; i < wb.SheetNames.length; i++) {
    if (!sheetsToProcess.has(i)) continue;
    const sheetName = wb.SheetNames[i];
    const categoryType = categorizeSheet(sheetName);
    if (!categoryType) continue;

    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    
    let headerRowIdx = -1;
    for (let r = 0; r < 10; r++) {
       if (!rows[r]) continue;
       // Kiểm tra row có ít nhất 2 cột non-null riêng biệt (loại bỏ title rows gộp)
       const nonNullCells = rows[r].filter((c: any) => c != null && String(c).trim() !== '');
       if (nonNullCells.length < 2) continue;
       // Kiểm tra các cột keyword phải là cột ngắn (header), không phải title dài
       const shortCells = rows[r].filter((c: any) => c != null && typeof c === 'string' && c.trim().length > 0 && c.trim().length < 50);
       if (shortCells.length < 2) continue;
       const rowStr = shortCells.map((c: any) => String(c).toLowerCase()).join(' ');
       if ((rowStr.includes('tên') || rowStr.includes('đại sứ') || rowStr.includes('họ và')) && (rowStr.includes('mã') || rowStr.includes('doanh số') || rowStr.includes('thành tích') || rowStr.includes('n-1') || rowStr.includes('tuyển dụng') || rowStr.includes('active') || rowStr.includes('hv mới') || rowStr.includes('hệ số') || rowStr.includes('thực đạt') || rowStr.includes('mục tiêu'))) {
         headerRowIdx = r;
         break;
       }
    }

    if (headerRowIdx === -1) {
       for (let r = 0; r < 10; r++) {
         if (!rows[r]) continue;
         const rowStr = rows[r].map((c: any) => String(c).toLowerCase()).join(' ');
         if ((rowStr.includes('mã') || rowStr.includes('stt') || rowStr.includes('nhóm')) && (rowStr.includes('đại sứ') || rowStr.includes('doanh số') || rowStr.includes('hệ số'))) {
           headerRowIdx = r;
           break;
         }
       }
    }

    if (headerRowIdx === -1) continue;

    const headerRow = rows[headerRowIdx];
    const recruitment = isRecruitmentSheet(sheetName);
    const goldAmbassador = isGoldAmbassadorSheet(sheetName);
    const manager = isManagerSheet(sheetName);

    // ========== XỬ LÝ RIÊNG CHO SHEET QUẢN LÝ TIÊU BIỂU ==========
    if (manager) {
      let isHighlight = true;
      let currentLevel = 'Cấp Nhóm';
      
      const levels: Record<string, Ambassador[]> = {
        'Cấp Nhóm': [],
        'Cấp Phòng': [],
        'Cấp Khu vực': []
      };

      let nameIdx = -1, idIdx = -1, heSoIdx = -1, slActiveIdx = -1;
      let heSoLabel = 'Hệ số % THMT';
      let slActiveLabel = 'SL Đại sứ mới active';

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const rowStr = row.map((entry: any) => String(entry).toLowerCase()).join(' ');

        // Phát hiện chuyển sang danh sách cận đạt
        if (rowStr.includes('cận đạt')) {
          isHighlight = false;
        }

        // Cập nhật header nếu thấy
        if ((rowStr.includes('tên') || rowStr.includes('đại sứ')) && (rowStr.includes('hệ số') || rowStr.includes('doanh số') || rowStr.includes('thực đạt') || rowStr.includes('mục tiêu'))) {
          // Pass 1: Detect score/metric columns FIRST to avoid misidentifying them as name
          const usedIdxs = new Set<number>();
          row.forEach((col: any, idx: number) => {
            if (typeof col !== 'string') return;
            const c = col.toLowerCase().trim();
            if (c.includes('mã')) { idIdx = idx; usedIdxs.add(idx); }
            if (c.includes('hệ số') || c.includes('doanh số') || c.includes('thực đạt') || c.includes('mục tiêu cam kết')) { heSoIdx = idx; heSoLabel = col.trim(); usedIdxs.add(idx); }
            if (c.includes('số lượng') || c.includes('active') || c.includes('đs mới active') || c.includes('đại sứ mới')) { slActiveIdx = idx; slActiveLabel = col.trim(); usedIdxs.add(idx); }
          });
          // Pass 2: Detect name column, skipping columns already assigned
          row.forEach((col: any, idx: number) => {
            if (typeof col !== 'string' || usedIdxs.has(idx)) return;
            const c = col.toLowerCase().trim();
            if (c.includes('tên') || c === 'đại sứ' || c === 'tên đại sứ') nameIdx = idx;
          });
          continue;
        }

        if (nameIdx !== -1 && heSoIdx !== -1) {
          const name = String(row[nameIdx] || '').trim();
          if (!name || name.toLowerCase().includes('tên') || name.toLowerCase().includes('danh sách')) continue;
          if (name.toLowerCase().includes('tổng') || name.toLowerCase().includes('đại sứ')) continue;

          // Xem cột đầu tiên có ghi Cấp Nhóm/Phòng/Khu vực không
          const levelCol = String(row[0] || '').trim();
          if (levelCol.startsWith('Cấp')) {
            currentLevel = levelCol;
          }

          const realId = idIdx !== -1 && row[idIdx] ? String(row[idIdx]) : `u_${r}`;
          
          let heSo = parseFloat(String(row[heSoIdx]).replace(/,/g, ''));
          let slActive = slActiveIdx !== -1 ? parseFloat(String(row[slActiveIdx]).replace(/,/g, '')) : 0;
          
          if (isNaN(heSo)) continue;
          if (isNaN(slActive)) slActive = 0;

          if (heSo > 0 || slActive > 0) {
            let targetKey = 'Cấp Nhóm';
            if (currentLevel.includes('Phòng')) targetKey = 'Cấp Phòng';
            if (currentLevel.includes('Khu vực')) targetKey = 'Cấp Khu vực';

            levels[targetKey].push({
              id: realId,
              name,
              score: heSo,
              score2: slActive,
              scoreLabel: heSoLabel,
              score2Label: slActiveLabel,
              highlight: isHighlight,
              region: String(row[3] || '').trim() // Lấy cột Cấp bậc làm region
            });
          }
        }
      }

      let baseCategoryName = sheetName.trim();
      baseCategoryName = baseCategoryName.replace(/^Giải thưởng\s+/i, '');
      baseCategoryName = baseCategoryName.replace(/\s*[TQ]\d*$/i, ''); // Remove T, T03, T04, Q, Q1 suffix
      baseCategoryName = baseCategoryName.charAt(0).toUpperCase() + baseCategoryName.slice(1);

      ['Cấp Nhóm', 'Cấp Phòng', 'Cấp Khu vực'].forEach((level, levelIdx) => {
        const ambassadors = levels[level];
        if (ambassadors.length === 0 && level !== 'Cấp Nhóm') return;

        ambassadors.sort((a, b) => b.score - a.score || (b.score2 ?? 0) - (a.score2 ?? 0));

        data[categoryType].push({
          categoryId: `cat_${i}_lv_${levelIdx}`,
          categoryName: `${baseCategoryName} - ${level}`,
          topRankers: ambassadors.length > 0 ? ambassadors.slice(0, 3) : [{ id: 'dummy', name: 'Đang cập nhật dữ liệu do cấu trúc cột chưa chuẩn khớp...', score: 0 }],
          otherRankers: ambassadors.slice(3),
          hasMultipleScores: true,
          scoreLabels: [heSoLabel, slActiveLabel],
        });
      });
      continue;
    }

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
        categoryName = categoryName.replace(/Vàng Q(?:uý)?(?:[^a-zA-Z0-9]*)/i, 'Vàng Quý I/2026');
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
           if (c.includes('doanh số') || c.includes('tuyển dụng') || c.includes('điểm') || c.includes('tổng số') || c.includes('hệ số') || c.includes('thành tích') || c.includes('thực đạt') || c.includes('mục tiêu')) {
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
               if (sIdx === -1 && (c.includes('doanh số') || c.includes('điểm') || c.includes('thành tích') || c.includes('thực đạt') || c.includes('mục tiêu'))) sIdx = idx;
               if (iIdx === -1 && c.includes('mã')) iIdx = idx;
            }
        });
        if (nIdx !== -1 && sIdx !== -1) {
            pairs.push({ nameIdx: nIdx, scoreIdx: sIdx, idIdx: iIdx !== -1 ? iIdx : nIdx - 1 });
        }
    }

    // ===== CHALLENGE SIDE-BY-SIDE: Tách mỗi bảng thành category riêng =====
    if (categoryType === 'challenge' && pairs.length > 1) {
      for (let pairIdx = 0; pairIdx < pairs.length; pairIdx++) {
        const p = pairs[pairIdx];
        const ambassadors: Ambassador[] = [];

        for (let r = headerRowIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;

          const name = row[p.nameIdx];
          const score = row[p.scoreIdx];

          if (!name || typeof name !== 'string') continue;
          const nameLower = name.toLowerCase();
          if (nameLower.includes('tổng') || nameLower.includes('đại sứ') || nameLower.includes('chưa có')) continue;

          let numScore = parseFloat(String(score).replace(/,/g, ''));
          if (isNaN(numScore)) continue;

          const realId = p.idIdx !== -1 && row[p.idIdx] ? String(row[p.idIdx]) : `u_${r}_${p.nameIdx}`;
          if (numScore > 0) {
            ambassadors.push({ id: realId, name: name.trim(), score: numScore });
          }
        }

        ambassadors.sort((a, b) => b.score - a.score);
        if (ambassadors.length === 0) continue;

        // Lấy tên category từ Row 1 (tiêu đề bảng side-by-side)
        let subTitle = '';
        const titleRow = rows[1] || rows[0];
        if (titleRow) {
          for (let ci = p.nameIdx; ci >= Math.max(0, p.nameIdx - 3); ci--) {
            if (titleRow[ci] && typeof titleRow[ci] === 'string' && titleRow[ci].trim().length > 5) {
              subTitle = String(titleRow[ci]).trim().replace(/\n/g, ' ');
              break;
            }
          }
        }

        let categoryName = subTitle || sheetName.trim();
        // Clean up: "DANH SÁCH ĐẠI SỨ MỚI THÁNG 04 ĐỦ ĐIỀU KIỆN..." → "Đại sứ mới Tháng 04"
        categoryName = categoryName.replace(/^DANH SÁCH\s+/i, '');
        categoryName = categoryName.replace(/\s*ĐỦ ĐIỀU KIỆN.*/i, '');
        categoryName = categoryName.replace(/\s*NHẬN THƯỞNG.*/i, '');
        // Capitalize: first letter uppercase, rest keep original case
        if (categoryName === categoryName.toUpperCase()) {
          // All-caps title → title case
          categoryName = categoryName.toLowerCase()
            .replace(/(^|\s)(đại|sứ|mới|tháng|quý|doanh|số|từ|triệu|trong|đạt|mốc|cá|nhân)/g, (m) => m.charAt(0) + m.slice(1))
            .replace(/^./, c => c.toUpperCase());
        }

        data.challenge.push({
          categoryId: `cat_${i}_p${pairIdx}`,
          categoryName,
          topRankers: ambassadors.slice(0, 3),
          otherRankers: ambassadors.slice(3),
        });
      }
      continue;
    }

    // ===== XỬ LÝ SHEET 1 BẢNG (thông thường hoặc challenge đơn) =====
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
    // Fix "cấp q" → "cấp Quản lý" (tên sheet bị cắt)
    categoryName = categoryName.replace(/cấp q$/i, 'cấp Quản lý');
    categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

    data[categoryType].push({
      categoryId: `cat_${i}`,
      categoryName,
      topRankers: ambassadors.slice(0, 3),
      otherRankers: ambassadors.slice(3),
    });
  }

  // Đổi tên "Bứt tốc quý" → "Đại sứ Bứt tốc Ấn tượng"
  (['month', 'quarter', 'semester', 'challenge'] as const).forEach(tab => {
    data[tab].forEach(cat => {
      if (cat.categoryName.toLowerCase().includes('bứt tốc')) {
        cat.categoryName = cat.categoryName.replace(/Bứt tốc\s*(quý|q\d*)/i, 'Đại sứ Bứt tốc Ấn tượng');
      }
    });
  });

  // Thêm prefix "Giải thưởng" cho các tab không phải Challenge
  (['month', 'quarter', 'semester'] as const).forEach(tab => {
    data[tab].forEach(cat => {
      if (!cat.categoryName.toLowerCase().startsWith('giải thưởng')) {
        cat.categoryName = 'Giải thưởng ' + cat.categoryName;
      }
      if (cat.categoryName.toLowerCase().includes('quản lý tuyển dụng') && !cat.categoryName.toLowerCase().includes('xuất sắc')) {
        cat.categoryName = cat.categoryName.replace(/Quản lý tuyển dụng/i, 'Quản lý Tuyển dụng Xuất sắc');
      }
    });
  });

  // Thêm subtitle cho các giải cụ thể
  (['month', 'quarter', 'semester', 'challenge'] as const).forEach(tab => {
    data[tab].forEach(cat => {
      const name = cat.categoryName.toLowerCase();
      if (
        name.includes('đại sứ mới') ||
        name.includes('vàng') ||
        name.includes('bứt tốc')
      ) {
        cat.categorySubtitle = 'Biểu dương các Đại sứ mới xuất sắc, căn cứ theo số liệu tuyển sinh';
      }
    });
  });

  return data;
}
