/**
 * Rebuild api_response.json from T08/Q3/K2 CSVs
 * Áp dụng đúng 9 yêu cầu của user.
 */
const fs = require('fs');

function parseNum(s) {
  if (!s) return 0;
  return Number(String(s).replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.\-]/g, '')) || 0;
}

function parseCsv(text) {
  const rows = [];
  let row = [], inQuotes = false, field = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { inQuotes = !inQuotes; }
    else if (c === ',' && !inQuotes) { row.push(field.trim()); field = ''; }
    else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (c === '\r' && text[i+1] === '\n') i++;
      row.push(field.trim()); rows.push(row); row = []; field = '';
    } else { field += c; }
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  return rows;
}

function isEligible(s) {
  if (!s) return false;
  const lower = s.toLowerCase();
  // Phải có "đủ điều kiện" hoặc "đạt điều kiện" nhưng KHÔNG có "chưa"
  if (lower.includes('chưa')) return false;
  return lower.includes('đủ điều kiện') || lower.includes('đạt điều kiện');
}

function findSection(rows, num) {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].startsWith(num + '.')) return i;
  }
  return -1;
}

// ===== LOAD CSVs =====
const t08 = parseCsv(fs.readFileSync('/tmp/t08.csv', 'utf8'));
const q3  = parseCsv(fs.readFileSync('/tmp/q3.csv',  'utf8'));
const k2  = parseCsv(fs.readFileSync('/tmp/k2.csv',  'utf8'));

const s1 = findSection(t08, '1');
const s2 = findSection(t08, '2');
const s3 = findSection(t08, '3');
const s4 = findSection(t08, '4');

// ===================== THÁNG 8 =====================

// 1. THƯỞNG ĐẠI SỨ MỚI THÁNG 8
// Cols: [blank], Mã, Tên, Ngày tham gia, Doanh số cá nhân, Thưởng, Đạt/cận đạt
// Bỏ cột Thưởng. Badge status dưới tên.
function buildT08_DSMoi() {
  let hdr = -1;
  for (let i = s1; i < s2; i++) {
    if (t08[i][1] === 'Mã Đại sứ') { hdr = i; break; }
  }
  const eligible = [], almost = [];
  if (hdr >= 0) {
    for (let i = hdr + 1; i < s2; i++) {
      const r = t08[i];
      if (!r[1] || !/^\d+$/.test(r[1])) continue;
      const statusRaw = (r[6] || r[5] || '').trim();
      const elig = isEligible(statusRaw);
      const entry = {
        id: r[1], name: r[2],
        highlight: elig,
        status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
        columns: [
          { label: 'Ngày tham gia', value: r[3] || '' },
          { label: 'Doanh số cá nhân', value: r[4] || '0' }
        ],
        score2: r[3] || '', score2Label: 'Ngày tham gia',
        score: parseNum(r[4]), scoreLabel: 'Doanh số cá nhân'
      };
      if (elig) eligible.push(entry); else almost.push(entry);
    }
  }
  console.log(`T08 ĐS Mới: ${eligible.length} đủ ĐK + ${almost.length} chưa`);
  return {
    categoryId: 'cat_month_dsm',
    categoryName: '1. THƯỞNG ĐẠI SỨ MỚI THÁNG 8',
    topRankers: eligible.slice(0, 3),
    otherRankers: [...eligible.slice(3), ...almost],
    hasMultipleScores: true,
    scoreLabels: ['Ngày tham gia', 'Doanh số cá nhân']
  };
}

// 2. ĐẠI SỨ GIÁO DỤC XUẤT SẮC THÁNG 8
// Top 1: DS >= 200M, Top 2: DS >= 150M, Top 3: DS >= 100M
// Cols: [blank], Mã, Tên, Doanh số, [blank], Đạt/cận đạt
// Badge status dưới tên.
function buildT08_DSGDXuatSac() {
  let hdr = -1;
  for (let i = s2; i < s3; i++) {
    if (t08[i][1] === 'Mã Đại sứ') { hdr = i; break; }
  }
  const all = [];
  if (hdr >= 0) {
    for (let i = hdr + 1; i < s3; i++) {
      const r = t08[i];
      if (!r[1] || !/^\d+$/.test(r[1])) continue;
      const ds = parseNum(r[3]);
      const statusRaw = (r[5] || r[6] || '').trim();
      const elig = isEligible(statusRaw);
      all.push({
        id: r[1], name: r[2],
        highlight: elig,
        status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
        columns: [{ label: 'Doanh số cá nhân', value: r[3] || '0' }],
        score: ds, scoreLabel: 'Doanh số cá nhân'
      });
    }
  }
  // Phân top theo ngưỡng DS và gán đúng rank cho podium
  // Top 1 bục: DS >= 200M (rank=1), Top 2 bục: >= 150M (rank=2), Top 3 bục: >= 100M (rank=3)
  const top1 = all.filter(r => r.score >= 200000000);
  const top2 = all.filter(r => r.score >= 150000000 && r.score < 200000000);
  const top3 = all.filter(r => r.score >= 100000000 && r.score < 150000000);
  const below = all.filter(r => r.score < 100000000);

  // Gán rank để Podium component biết đặt đúng slot
  const podium = [];
  if (top1.length > 0) podium.push({...top1[0], rank: 1});
  if (top2.length > 0) podium.push({...top2[0], rank: 2});
  if (top3.length > 0) podium.push({...top3[0], rank: 3});
  // Slot nào không có người -> rank đó undefined -> Podium hiển thị placeholder

  const rest = [...top1.slice(1), ...top2.slice(1), ...top3.slice(1), ...below];

  console.log(`T08 DS GD XS: podium=${podium.length} (top1=${top1.length},top2=${top2.length},top3=${top3.length}) rest=${rest.length}`);
  return {
    categoryId: 'cat_month_dsgd',
    categoryName: '2. ĐẠI SỨ GIÁO DỤC XUẤT SẮC THÁNG 8',
    topRankers: podium,
    otherRankers: rest,
    hasMultipleScores: false,
    scoreLabels: ['Doanh số cá nhân']
  };
}

// 3. QUẢN LÝ TUYỂN DỤNG XUẤT SẮC THÁNG 8
// Chưa có ai đủ ĐK -> topRankers=[] -> không hiện podium
// Cols: [blank], Mã, Tên, SL ĐS mới PSDT, Doanh thu ĐS mới, Thưởng, Đạt/cận đạt
function buildT08_QLTuyenDung() {
  let hdr = -1;
  for (let i = s3; i < s4; i++) {
    if (t08[i][1] === 'Mã Đại sứ') { hdr = i; break; }
  }
  const all = [];
  if (hdr >= 0) {
    for (let i = hdr + 1; i < s4; i++) {
      const r = t08[i];
      if (!r[1] || !/^\d+$/.test(r[1])) continue;
      const statusRaw = (r[6] || '').trim();
      const elig = isEligible(statusRaw);
      all.push({
        id: r[1], name: r[2],
        highlight: elig,
        status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
        columns: [
          { label: 'SL Đại sứ mới PSDT', value: r[3] || '0' },
          { label: 'Doanh thu ĐS mới', value: r[4] || '0' }
        ],
        score: parseNum(r[3]), scoreLabel: 'SL Đại sứ mới PSDT',
        score2: parseNum(r[4]), score2Label: 'Doanh thu ĐS mới'
      });
    }
  }
  const hasElig = all.some(r => r.highlight);
  console.log(`T08 QL Tuyển dụng: ${all.length} người, hasElig=${hasElig}`);
  return {
    categoryId: 'cat_month_qltd',
    categoryName: '3. QUẢN LÝ TUYỂN DỤNG XUẤT SẮC THÁNG 8',
    topRankers: hasElig ? all.filter(r => r.highlight).slice(0, 3) : [],
    otherRankers: hasElig
      ? [...all.filter(r => r.highlight).slice(3), ...all.filter(r => !r.highlight)]
      : all,
    hasMultipleScores: true,
    scoreLabels: ['SL Đại sứ mới PSDT', 'Doanh thu ĐS mới']
  };
}

// 4. QUẢN LÝ TIÊU BIỂU THÁNG 8
// Chỉ bảng, bỏ region dưới tên (đã có cột Cấp bậc)
// Cols: Cấp, Mã, Tên, Cấp bậc, Thực đạt, SL ĐS active, Thưởng, Đạt/cận đạt
function buildT08_QLTieuBieu() {
  let hdr = -1;
  for (let i = s4; i < t08.length; i++) {
    if (t08[i][1] === 'Mã Đại sứ') { hdr = i; break; }
  }
  let currentLevel = '';
  const all = [];
  if (hdr >= 0) {
    for (let i = hdr + 1; i < t08.length; i++) {
      const r = t08[i];
      if (r[0] && r[0].startsWith('Cấp')) currentLevel = r[0];
      if (!r[1] || !/^\d+$/.test(r[1])) continue;
      const statusRaw = (r[7] || '').trim();
      const elig = isEligible(statusRaw);
      all.push({
        id: r[1], name: r[2],
        region: currentLevel,   // kept for grouping but NOT shown under name in UI
        highlight: elig,
        status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
        columns: [
          { label: 'Cấp bậc', value: r[3] || '' },
          { label: 'Thực đạt mục tiêu cam kết', value: r[4] || '' },
          { label: 'Số đại sứ mới active trong đội ngũ', value: r[5] || '0' }
        ],
        score: parseNum(r[4]), scoreLabel: 'Thực đạt mục tiêu cam kết',
        score2: parseNum(r[5]), score2Label: 'Số đại sứ mới active trong đội ngũ'
      });
    }
  }
  console.log(`T08 QL Tiêu biểu: ${all.length} người`);
  return {
    categoryId: 'cat_month_qltb',
    categoryName: '4. QUẢN LÝ TIÊU BIỂU THÁNG 8',
    topRankers: [],   // isManager -> always table only
    otherRankers: all,
    hasMultipleScores: true,
    scoreLabels: ['Cấp bậc', 'Thực đạt mục tiêu cam kết', 'Số đại sứ mới active trong đội ngũ']
  };
}

// ===================== QUÝ III =====================

const q3s1 = findSection(q3, '1');
const q3s2 = findSection(q3, '2');
const q3s3 = findSection(q3, '3');
const q3s4 = findSection(q3, '4');

// 1. TOP 3 ĐẠI SỨ GIÁO DỤC XUẤT SẮC QUÝ III
function buildQ3_Top3() {
  let hdr = -1;
  for (let i = q3s1 >= 0 ? q3s1 : 0; i < (q3s2 >= 0 ? q3s2 : q3.length); i++) {
    if (q3[i][0] === 'Mã Đại sứ') { hdr = i; break; }
  }
  const rankers = [];
  if (hdr >= 0) {
    for (let i = hdr + 1; i < (q3s2 >= 0 ? q3s2 : q3.length); i++) {
      const r = q3[i];
      if (!r[0] || !/^\d+$/.test(r[0])) continue;
      rankers.push({
        id: r[0], name: r[1], highlight: true, hideBadge: true,
        columns: [
          { label: 'Số HV tuyển sinh', value: r[2] || '0' },
          { label: 'Doanh số quý', value: r[3] || '0' },
          { label: 'Team', value: r[4] || '' }
        ],
        score: parseNum(r[2]), scoreLabel: 'Số HV tuyển sinh',
        score2: parseNum(r[3]), score2Label: 'Doanh số quý',
        rank: parseNum(r[5])
      });
    }
  }
  console.log(`Q3 TOP3: ${rankers.length} người`);
  return {
    categoryId: 'cat_q3_top3',
    categoryName: '1. TOP 3 ĐẠI SỨ GIÁO DỤC XUẤT SẮC QUÝ III',
    topRankers: rankers.slice(0, 3),
    otherRankers: rankers.slice(3),
    hasMultipleScores: true,
    scoreLabels: ['Số HV tuyển sinh', 'Doanh số quý', 'Team']
  };
}

// 2. ĐẠI SỨ VÀNG QUÝ III
// Chưa có ai đủ ĐK -> topRankers=[] -> chỉ bảng
function buildQ3_DSVang() {
  let hdr = -1;
  const end = q3s3 >= 0 ? q3s3 : q3.length;
  for (let i = q3s2 >= 0 ? q3s2 : 0; i < end; i++) {
    if (q3[i][0] === 'Mã Đại sứ') { hdr = i; break; }
  }
  const all = [];
  if (hdr >= 0) {
    for (let i = hdr + 1; i < end; i++) {
      const r = q3[i];
      if (!r[0] || !/^\d+$/.test(r[0])) continue;
      const statusRaw = (r[5] || '').trim();
      const elig = isEligible(statusRaw);
      all.push({
        id: r[0], name: r[1],
        highlight: elig,
        status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
        columns: [
          { label: 'Số HV tuyển sinh', value: r[2] || '0' },
          { label: 'Doanh số quý', value: r[3] || '0' },
          { label: 'Team', value: r[4] || '' }
        ],
        score: parseNum(r[2]), scoreLabel: 'Số HV tuyển sinh',
        score2: parseNum(r[3]), score2Label: 'Doanh số quý'
      });
    }
  }
  const hasElig = all.some(r => r.highlight);
  console.log(`Q3 ĐS Vàng: ${all.length} người, hasElig=${hasElig}`);
  return {
    categoryId: 'cat_q3_vang',
    categoryName: '2. ĐẠI SỨ VÀNG QUÝ III',
    topRankers: hasElig ? all.filter(r => r.highlight).slice(0, 3) : [],
    otherRankers: hasElig
      ? [...all.filter(r => r.highlight).slice(3), ...all.filter(r => !r.highlight)]
      : all,
    hasMultipleScores: true,
    scoreLabels: ['Số HV tuyển sinh', 'Doanh số quý', 'Team']
  };
}

// 3. QUẢN LÝ TUYỂN DỤNG XUẤT SẮC QUÝ III
// Chưa ai đủ ĐK -> chỉ bảng
function buildQ3_QLTuyenDung() {
  const startRow = q3s3 >= 0 ? q3s3 : 0;
  const endRow = q3s4 >= 0 ? q3s4 : q3.length;
  let hdr = -1;
  for (let i = startRow; i < endRow; i++) {
    if (q3[i][0] === 'Mã Đại sứ') { hdr = i; break; }
  }
  const all = [];
  if (hdr >= 0) {
    for (let i = hdr + 1; i < endRow; i++) {
      const r = q3[i];
      if (!r[0] || !/^\d+$/.test(r[0])) continue;
      const statusRaw = (r[5] || '').trim();
      const elig = isEligible(statusRaw);
      all.push({
        id: r[0], name: r[1],
        highlight: elig,
        status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
        columns: [
          { label: 'Số lượng Đại sứ mới active', value: r[2] || '0' },
          { label: 'Tổng doanh số Đại sứ mới active', value: r[3] || '0' },
          { label: 'Team', value: r[4] || '' }
        ],
        score: parseNum(r[2]), scoreLabel: 'Số lượng Đại sứ mới active',
        score2: parseNum(r[3]), score2Label: 'Tổng doanh số Đại sứ mới active'
      });
    }
  }
  const hasElig = all.some(r => r.highlight);
  console.log(`Q3 QL Tuyển dụng: ${all.length} người, hasElig=${hasElig}`);
  return {
    categoryId: 'cat_q3_qltd',
    categoryName: '3. QUẢN LÝ TUYỂN DỤNG XUẤT SẮC QUÝ III',
    topRankers: hasElig ? all.filter(r => r.highlight).slice(0, 3) : [],
    otherRankers: hasElig
      ? [...all.filter(r => r.highlight).slice(3), ...all.filter(r => !r.highlight)]
      : all,
    hasMultipleScores: true,
    scoreLabels: ['Số lượng Đại sứ mới active', 'Tổng doanh số Đại sứ mới active', 'Team']
  };
}

// 4. QUẢN LÝ TIÊU BIỂU QUÝ III
// Cols: Cấp Trưởng Nhóm/..., col1=Mã, col2=Tên, col3=Cấp bậc, col4=Thực đạt, col5=Số ĐS active, col6=Đạt
function buildQ3_QLTieuBieu() {
  if (q3s4 < 0) {
    console.log('Q3 QL Tiêu biểu: không có section 4');
    return null;
  }
  let hdr = -1;
  for (let i = q3s4; i < q3.length; i++) {
    if (q3[i][1] === 'Mã Đại sứ') { hdr = i; break; }
  }
  let currentLevel = '';
  const all = [];
  if (hdr >= 0) {
    for (let i = hdr + 1; i < q3.length; i++) {
      const r = q3[i];
      if (r[0] && r[0].startsWith('Cấp')) currentLevel = r[0];
      if (!r[1] || !/^\d+$/.test(r[1])) continue;
      const statusRaw = (r[6] || '').trim();
      const elig = isEligible(statusRaw);
      all.push({
        id: r[1], name: r[2],
        region: currentLevel,
        highlight: elig,
        status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
        columns: [
          { label: 'Cấp bậc', value: r[3] || '' },
          { label: 'Thực đạt mục tiêu cam kết', value: r[4] || '' },
          { label: 'Số đại sứ mới active trong đội ngũ', value: r[5] || '0' }
        ],
        score: parseNum(r[4]), scoreLabel: 'Thực đạt mục tiêu cam kết',
        score2: parseNum(r[5]), score2Label: 'Số đại sứ mới active trong đội ngũ'
      });
    }
  }
  console.log(`Q3 QL Tiêu biểu: ${all.length} người`);
  return {
    categoryId: 'cat_q3_qltb',
    categoryName: '4. QUẢN LÝ TIÊU BIỂU QUÝ III',
    topRankers: [],
    otherRankers: all,
    hasMultipleScores: true,
    scoreLabels: ['Cấp bậc', 'Thực đạt mục tiêu cam kết', 'Số đại sứ mới active trong đội ngũ']
  };
}

// ===================== KỲ II =====================
function buildK2() {
  let hdr = -1, rightStart = -1;
  for (let i = 0; i < k2.length; i++) {
    if (k2[i][0] === 'Mã Đại sứ' && k2[i].includes('Doanh số Kỳ II')) {
      hdr = i;
      for (let j = 6; j < k2[i].length; j++) {
        if (k2[i][j] === 'Mã Đại sứ') { rightStart = j; break; }
      }
      break;
    }
  }
  console.log(`K2 header row=${hdr}, rightStart col=${rightStart}`);

  // LEFT: ĐS GD Xuất sắc Kỳ II
  // r[5]=Phần thưởng (có "100%"/"50%" chuyến du lịch), r[6]=Đạt/chưa đạt
  const leftElig = [], leftAlmost = [];
  if (hdr >= 0) {
    for (let i = hdr + 1; i < k2.length; i++) {
      const r = k2[i];
      if (!r[0] || !/^\d+$/.test(r[0])) continue;
      const award    = (r[5] || '').trim();
      const statusRaw= (r[6] || '').trim();
      const elig = isEligible(statusRaw) || isEligible(award);
      const awardLabel = award.includes('100%')
        ? '✈️ 100% CHUYẾN DU LỊCH QUỐC TẾ'
        : award.includes('50%')
        ? '✈️ 50% CHUYẾN DU LỊCH QUỐC TẾ'
        : '';
      const entry = {
        id: r[0], name: r[1],
        highlight: elig,
        status: awardLabel || (elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện'),
        columns: [
          { label: 'Doanh số Kỳ II', value: r[2] || '0' },
          { label: 'Số HV tuyển sinh', value: r[3] || '0' },
          { label: 'Team', value: r[4] || '' }
        ],
        score: parseNum(r[2]), scoreLabel: 'Doanh số Kỳ II',
        score2: parseNum(r[3]), score2Label: 'Số HV tuyển sinh',
        hideBadge: false
      };
      if (elig) leftElig.push(entry); else leftAlmost.push(entry);
    }
  }
  console.log(`K2 ĐS GD XS: ${leftElig.length} đạt + ${leftAlmost.length} chưa`);

  // RIGHT: QL Xuất sắc Kỳ II
  // r[rightStart+4]=Phần thưởng, r[rightStart+5]=Đạt/chưa đạt (nếu có)
  const rightElig = [], rightAlmost = [];
  if (hdr >= 0 && rightStart >= 0) {
    for (let i = hdr + 1; i < k2.length; i++) {
      const r = k2[i];
      if (!r[rightStart] || !/^\d+$/.test(r[rightStart])) continue;
      const statusRaw = (r[rightStart + 5] || r[rightStart + 4] || '').trim();
      const elig = isEligible(statusRaw);
      const entry = {
        id: r[rightStart], name: r[rightStart + 1],
        highlight: elig,
        status: elig ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện',
        columns: [
          { label: 'Doanh số Kỳ II', value: r[rightStart + 2] || '0' },
          { label: 'Số ĐS Active', value: r[rightStart + 3] || '0' }
        ],
        score: parseNum(r[rightStart + 2]), scoreLabel: 'Doanh số Kỳ II',
        score2: parseNum(r[rightStart + 3]), score2Label: 'Số ĐS Active',
        hideBadge: false
      };
      if (elig) rightElig.push(entry); else rightAlmost.push(entry);
    }
  }
  console.log(`K2 QL XS: ${rightElig.length} đạt + ${rightAlmost.length} chưa`);

  return [
    {
      categoryId: 'cat_k2_dsgd',
      categoryName: '1. GIẢI ĐẠI SỨ GIÁO DỤC XUẤT SẮC KỲ II',
      topRankers: leftElig.slice(0, 3),
      otherRankers: [...leftElig.slice(3), ...leftAlmost],
      hasMultipleScores: true,
      scoreLabels: ['Doanh số Kỳ II', 'Số HV tuyển sinh', 'Team']
    },
    {
      categoryId: 'cat_k2_qlxs',
      categoryName: '2. GIẢI QUẢN LÝ XUẤT SẮC KỲ II',
      topRankers: rightElig.slice(0, 3),
      otherRankers: [...rightElig.slice(3), ...rightAlmost],
      hasMultipleScores: true,
      scoreLabels: ['Doanh số Kỳ II', 'Số ĐS Active']
    }
  ];
}

// ===== BUILD =====
console.log('\n=== BUILDING api_response.json ===\n');
const qltb = buildQ3_QLTieuBieu();
const [k2ds, k2ql] = buildK2();

const apiData = {
  month: [
    buildT08_DSMoi(),
    buildT08_DSGDXuatSac(),
    buildT08_QLTuyenDung(),
    buildT08_QLTieuBieu()
  ],
  quarter: [
    buildQ3_Top3(),
    buildQ3_DSVang(),
    buildQ3_QLTuyenDung(),
    ...(qltb ? [qltb] : [])
  ],
  semester: [k2ds, k2ql],
  challenge: []
};

fs.writeFileSync('api_response.json', JSON.stringify(apiData, null, 2));
console.log('\n✅ api_response.json đã được cập nhật!');

// === VERIFY ===
console.log('\n=== VERIFY ===');
['month','quarter','semester'].forEach(tab => {
  apiData[tab].forEach(c => {
    const t = c.topRankers?.[0];
    console.log(`[${tab}] ${c.categoryName}:`);
    console.log(`  topRankers=${c.topRankers.length}, otherRankers=${c.otherRankers.length}`);
    if (t) console.log(`  #1: ${t.name} | highlight=${t.highlight} | status="${t.status}" | score=${t.score}`);
  });
});
