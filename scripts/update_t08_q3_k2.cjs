/**
 * Update api_response.json with Tháng 8, Quý III, Kỳ II data.
 * T08: /tmp/t08.csv  (bỏ cột Thưởng)
 * Q3:  /tmp/q3.csv
 * K2:  /tmp/k2.csv
 */
const fs = require('fs');

function parseNum(s) {
  if (!s) return 0;
  return Number(String(s).replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.\-]/g, '')) || 0;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
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

function findSection(rows, num) {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].startsWith(num + '.')) return i;
  }
  return -1;
}

function checkEligible(status) {
  const s = (status || '').toLowerCase();
  return (s.includes('đủ điều kiện') || s.includes('đạt điều kiện')) && !s.includes('chưa');
}

// ==================== LOAD ====================
const apiData = JSON.parse(fs.readFileSync('api_response.json', 'utf8'));
const t08Rows = parseCsv(fs.readFileSync('t08.csv', 'utf8'));
const q3Rows  = parseCsv(fs.readFileSync('q3.csv',  'utf8'));
const k2Rows  = parseCsv(fs.readFileSync('k2.csv',  'utf8'));

// Backup
fs.writeFileSync('api_response_backup.json', JSON.stringify(apiData));
console.log('Backed up api_response.json -> api_response_backup.json');

// ==================== THÁNG 8 ====================
console.log('\n=== THÁNG 8 ===');

// Rename month categories from THÁNG 7 -> THÁNG 8
apiData.month.forEach(c => {
  c.categoryName = c.categoryName.replace('THÁNG 7', 'THÁNG 8');
});

const s1 = findSection(t08Rows, '1');
const s2 = findSection(t08Rows, '2');
const s3 = findSection(t08Rows, '3');
const s4 = findSection(t08Rows, '4');

// Section 1: THƯỞNG ĐẠI SỨ MỚI THÁNG 8
// Cols: ,Mã ĐS, Tên ĐS, Ngày tham gia, Doanh số cá nhân, Thưởng, Đạt/cận đạt
// Bỏ cột Thưởng (index 5) -> chỉ lấy col1=mã, 2=tên, 3=ngày, 4=doanh số
{
  const cat = apiData.month.find(c => c.categoryName.includes('ĐẠI SỨ MỚI'));
  if (cat) {
    let hdr = -1;
    for (let i = s1; i < s2; i++) {
      if (t08Rows[i][1] === 'Mã Đại sứ') { hdr = i; break; }
    }
    const eligible = [], almost = [];
    for (let i = hdr + 1; i < s2; i++) {
      const r = t08Rows[i];
      if (!r[1] || !/^\d+$/.test(r[1])) continue;
      const status = (r[6] || '').trim();
      const entry = {
        id: r[1], name: r[2],
        columns: [
          { label: 'Ngày tham gia', value: r[3] || '' },
          { label: 'Doanh số cá nhân', value: r[4] || '0' }
        ],
        score2: r[3] || '', score2Label: 'Ngày tham gia',
        score: parseNum(r[4]), scoreLabel: 'Doanh số cá nhân',
      };
      if (checkEligible(status)) {
        entry.highlight = true;
        entry.status = 'đủ điều kiện xét giải';
        eligible.push(entry);
      } else {
        entry.highlight = false;
        entry.status = 'chưa đủ điều kiện';
        almost.push(entry);
      }
    }
    cat.topRankers = eligible.slice(0, 3);
    cat.otherRankers = [...eligible.slice(3), ...almost];
    console.log(`  ${cat.categoryName}: ${eligible.length} eligible + ${almost.length} almost`);
  }
}

// Section 2: ĐS GD XUẤT SẮC THÁNG 8
// Cols: ,Mã ĐS, Tên ĐS, Doanh số cá nhân, (empty), Đạt/cận đạt
{
  const cat = apiData.month.find(c => c.categoryName.includes('GIÁO DỤC XUẤT SẮC'));
  if (cat) {
    let hdr = -1;
    for (let i = s2; i < s3; i++) {
      if (t08Rows[i][1] === 'Mã Đại sứ') { hdr = i; break; }
    }
    const eligible = [], almost = [];
    for (let i = hdr + 1; i < s3; i++) {
      const r = t08Rows[i];
      if (!r[1] || !/^\d+$/.test(r[1])) continue;
      const status = (r[5] || r[6] || '').trim();
      const entry = {
        id: r[1], name: r[2],
        columns: [{ label: 'Doanh số cá nhân', value: r[3] || '0' }],
        score: parseNum(r[3]), scoreLabel: 'Doanh số cá nhân',
      };
      if (checkEligible(status)) {
        entry.highlight = true; entry.status = 'đủ điều kiện xét giải';
        eligible.push(entry);
      } else {
        entry.highlight = false; entry.status = 'chưa đủ điều kiện';
        almost.push(entry);
      }
    }
    cat.topRankers = eligible.slice(0, 3);
    cat.otherRankers = [...eligible.slice(3), ...almost];
    console.log(`  ${cat.categoryName}: ${eligible.length} eligible + ${almost.length} almost`);
  }
}

// Section 3: QL TUYỂN DỤNG XUẤT SẮC THÁNG 8
// Cols: ,Mã ĐS, Tên ĐS, SL Đại sứ mới PSDT, Doanh thu ĐS mới, Thưởng, Đạt/cận đạt
{
  const cat = apiData.month.find(c => c.categoryName.includes('TUYỂN DỤNG'));
  if (cat) {
    let hdr = -1;
    for (let i = s3; i < s4; i++) {
      if (t08Rows[i][1] === 'Mã Đại sứ') { hdr = i; break; }
    }
    const eligible = [], almost = [];
    for (let i = hdr + 1; i < s4; i++) {
      const r = t08Rows[i];
      if (!r[1] || !/^\d+$/.test(r[1])) continue;
      const status = (r[6] || '').trim();
      const entry = {
        id: r[1], name: r[2],
        columns: [
          { label: 'SL Đại sứ mới PSDT', value: r[3] || '0' },
          { label: 'Doanh thu ĐS mới', value: r[4] || '0' }
        ],
        score: parseNum(r[3]), scoreLabel: 'SL Đại sứ mới PSDT',
        score2: parseNum(r[4]), score2Label: 'Doanh thu ĐS mới',
      };
      if (checkEligible(status)) {
        entry.highlight = true; entry.status = 'đủ điều kiện xét giải';
        eligible.push(entry);
      } else {
        entry.highlight = false; entry.status = 'chưa đủ điều kiện';
        almost.push(entry);
      }
    }
    cat.topRankers = eligible.slice(0, 3);
    cat.otherRankers = [...eligible.slice(3), ...almost];
    console.log(`  ${cat.categoryName}: ${eligible.length} eligible + ${almost.length} almost`);
  }
}

// Section 4: QL TIÊU BIỂU THÁNG 8
// Cols: Cấp, Mã ĐS, Tên ĐS, Cấp bậc, Thực đạt mục tiêu, Số ĐS active, Thưởng, Đạt/cận đạt
{
  const cat = apiData.month.find(c => c.categoryName.includes('TIÊU BIỂU'));
  if (cat) {
    let hdr = -1;
    for (let i = s4; i < t08Rows.length; i++) {
      if (t08Rows[i][1] === 'Mã Đại sứ') { hdr = i; break; }
    }
    let currentLevel = '';
    const eligible = [], almost = [];
    for (let i = hdr + 1; i < t08Rows.length; i++) {
      const r = t08Rows[i];
      if (r[0] && r[0].startsWith('Cấp')) currentLevel = r[0];
      if (!r[1] || !/^\d+$/.test(r[1])) continue;
      const status = (r[7] || '').trim();
      const entry = {
        id: r[1], name: r[2], region: currentLevel,
        columns: [
          { label: 'Cấp bậc', value: r[3] || '' },
          { label: 'Thực đạt mục tiêu cam kết', value: r[4] || '' },
          { label: 'Số đại sứ mới active trong đội ngũ', value: r[5] || '0' }
        ],
        score: parseNum(r[4]), scoreLabel: 'Thực đạt mục tiêu cam kết',
        score2: parseNum(r[5]), score2Label: 'Số đại sứ mới active trong đội ngũ',
      };
      if (checkEligible(status)) {
        entry.highlight = true; entry.status = 'đủ điều kiện xét giải';
        eligible.push(entry);
      } else {
        entry.highlight = false; entry.status = 'chưa đủ điều kiện';
        almost.push(entry);
      }
    }
    cat.topRankers = eligible.slice(0, 3);
    cat.otherRankers = [...eligible.slice(3), ...almost];
    console.log(`  ${cat.categoryName}: ${eligible.length} eligible + ${almost.length} almost`);
  }
}

// ==================== QUÝ III ====================
console.log('\n=== QUÝ III ===');

// Q3 CSV structure:
// - Section 1 (ĐS GD Xuất sắc / QL Xuất sắc Kỳ II): rows 0..N - multi-column (K2 format same as Q3!)
// Wait - q3.csv is actually the quarter leaderboard (Đại sứ + QL data in parallel columns)
// Let's re-examine: q3.csv col0=Mã, col1=Tên, col2=SL HV, col3=DS, col4=Team, col5=Đạt/cận

// The q3.csv has no section headers - it's the Đại sứ Vàng data directly
// Sections 1=TOP3, 2=Đại sứ Vàng are both DS data; Section 3=QL Tuyển dụng; Section 4=QL Tiêu biểu

// Find section markers
const q3s1 = findSection(q3Rows, '1');
const q3s2 = findSection(q3Rows, '2');
const q3s3 = findSection(q3Rows, '3');
const q3s4 = findSection(q3Rows, '4');

console.log('Q3 sections at rows:', q3s1, q3s2, q3s3, q3s4);

// Section 1: TOP 3 ĐS GD XS QUÝ III
// After section marker, find header row with 'Mã Đại sứ' in col0
{
  const cat = apiData.quarter.find(c => c.categoryName.includes('TOP 3'));
  if (cat) {
    let hdr = -1;
    for (let i = q3s1 >= 0 ? q3s1 : 0; i < (q3s2 >= 0 ? q3s2 : q3Rows.length); i++) {
      if (q3Rows[i][0] === 'Mã Đại sứ') { hdr = i; break; }
    }
    if (hdr < 0) {
      // q3.csv may not have section headers - try col0=digits
      hdr = -1;
      for (let i = 0; i < q3Rows.length; i++) {
        if (q3Rows[i][0] === 'Mã Đại sứ' || q3Rows[i][0] === 'Mã ĐS') { hdr = i; break; }
      }
    }
    const rankers = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < q3Rows.length; i++) {
        const r = q3Rows[i];
        if (!r[0] || !/^\d+$/.test(r[0])) {
          if (r[0] && r[0].startsWith('2.')) break; // next section
          continue;
        }
        rankers.push({
          id: r[0], name: r[1], highlight: true,
          columns: [
            { label: 'Số HV tuyển sinh', value: r[2] || '0' },
            { label: 'Doanh số quý', value: r[3] || '0' },
            { label: 'Team', value: r[4] || '' }
          ],
          score: parseNum(r[2]), scoreLabel: 'Số HV tuyển sinh',
          score2: parseNum(r[3]), score2Label: 'Doanh số quý',
          rank: i - hdr, hideBadge: true
        });
      }
    }
    cat.topRankers = rankers.slice(0, 3);
    cat.otherRankers = rankers.slice(3);
    cat.scoreLabels = ['Số HV tuyển sinh', 'Doanh số quý', 'Team'];
    console.log(`  ${cat.categoryName}: ${rankers.length} rankers`);
  }
}

// Section 2: ĐẠI SỨ VÀNG QUÝ III (same dataset, all rows)
{
  const cat = apiData.quarter.find(c => c.categoryName.includes('VÀNG'));
  if (cat) {
    let hdr = -1;
    const startRow = q3s2 >= 0 ? q3s2 : 0;
    const endRow = q3s3 >= 0 ? q3s3 : q3Rows.length;
    for (let i = startRow; i < endRow; i++) {
      if (q3Rows[i][0] === 'Mã Đại sứ' || q3Rows[i][0] === 'Mã ĐS') { hdr = i; break; }
    }
    const eligible = [], almost = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < endRow; i++) {
        const r = q3Rows[i];
        if (!r[0] || !/^\d+$/.test(r[0])) continue;
        const status = (r[5] || '').trim();
        const entry = {
          id: r[0], name: r[1],
          columns: [
            { label: 'Số HV tuyển sinh', value: r[2] || '0' },
            { label: 'Doanh số quý', value: r[3] || '0' },
            { label: 'Team', value: r[4] || '' }
          ],
          score: parseNum(r[2]), scoreLabel: 'Số HV tuyển sinh',
          score2: parseNum(r[3]), score2Label: 'Doanh số quý',
        };
        if (checkEligible(status)) {
          entry.highlight = true; entry.status = 'đủ điều kiện xét giải';
          eligible.push(entry);
        } else {
          entry.highlight = false; entry.status = 'chưa đủ điều kiện';
          almost.push(entry);
        }
      }
    }
    cat.topRankers = [];
    cat.otherRankers = [...eligible, ...almost];
    cat.scoreLabels = ['Số HV tuyển sinh', 'Doanh số quý', 'Team'];
    console.log(`  ${cat.categoryName}: ${eligible.length} eligible + ${almost.length} almost`);
  }
}

// Section 3: QL TUYỂN DỤNG XUẤT SẮC QUÝ III
// Rows after "CÁC ĐẠI SỨ ĐANG ĐUA TOP" header with: Mã, Tên, SL ĐS mới active, Tổng DS, Team, Đạt
{
  const cat = apiData.quarter.find(c => c.categoryName.includes('TUYỂN DỤNG') && c.categoryName.includes('III'));
  if (cat) {
    let hdr = -1;
    const startRow = q3s3 >= 0 ? q3s3 : 0;
    const endRow = q3s4 >= 0 ? q3s4 : q3Rows.length;
    for (let i = startRow; i < endRow; i++) {
      if (q3Rows[i][0] === 'Mã Đại sứ') { hdr = i; break; }
    }
    const eligible = [], almost = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < endRow; i++) {
        const r = q3Rows[i];
        if (!r[0] || !/^\d+$/.test(r[0])) continue;
        const status = (r[5] || '').trim();
        const entry = {
          id: r[0], name: r[1],
          columns: [
            { label: 'Số lượng Đại sứ mới active', value: r[2] || '0' },
            { label: 'Tổng doanh số Đại sứ mới active', value: r[3] || '0' },
            { label: 'Team', value: r[4] || '' }
          ],
          score: parseNum(r[2]), scoreLabel: 'Số lượng Đại sứ mới active',
          score2: parseNum(r[3]), score2Label: 'Tổng doanh số Đại sứ mới active',
        };
        if (checkEligible(status)) {
          entry.highlight = true; entry.status = 'đủ điều kiện xét giải';
          eligible.push(entry);
        } else {
          entry.highlight = false; entry.status = 'chưa đủ điều kiện';
          almost.push(entry);
        }
      }
    }
    cat.topRankers = eligible.slice(0, 3);
    cat.otherRankers = [...eligible.slice(3), ...almost];
    cat.scoreLabels = ['Số lượng Đại sứ mới active', 'Tổng doanh số Đại sứ mới active', 'Team'];
    console.log(`  ${cat.categoryName}: ${eligible.length} eligible + ${almost.length} almost`);
  }
}

// Section 4: QL TIÊU BIỂU QUÝ III
// Rows: Cấp Trưởng Nhóm/..., col1=Mã, col2=Tên, col3=Cấp bậc, col4=Thực đạt, col5=Số ĐS active, col6=Đạt
{
  const cat = apiData.quarter.find(c => c.categoryName.includes('TIÊU BIỂU') && c.categoryName.includes('III'));
  if (cat) {
    let hdr = -1;
    const startRow = q3s4 >= 0 ? q3s4 : 0;
    for (let i = startRow; i < q3Rows.length; i++) {
      if (q3Rows[i][1] === 'Mã Đại sứ') { hdr = i; break; }
    }
    let currentLevel = '';
    const eligible = [], almost = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < q3Rows.length; i++) {
        const r = q3Rows[i];
        if (r[0] && r[0].startsWith('Cấp')) currentLevel = r[0];
        if (!r[1] || !/^\d+$/.test(r[1])) continue;
        const status = (r[6] || '').trim();
        const entry = {
          id: r[1], name: r[2], region: currentLevel,
          columns: [
            { label: 'Cấp bậc', value: r[3] || '' },
            { label: 'Thực đạt mục tiêu cam kết', value: r[4] || '' },
            { label: 'Số đại sứ mới active trong đội ngũ', value: r[5] || '0' }
          ],
          score: parseNum(r[4]), scoreLabel: 'Thực đạt mục tiêu cam kết',
          score2: parseNum(r[5]), score2Label: 'Số đại sứ mới active trong đội ngũ',
        };
        if (checkEligible(status)) {
          entry.highlight = true; entry.status = 'đủ điều kiện xét giải';
          eligible.push(entry);
        } else {
          entry.highlight = false; entry.status = 'chưa đủ điều kiện';
          almost.push(entry);
        }
      }
    }
    cat.topRankers = eligible.slice(0, 3);
    cat.otherRankers = [...eligible.slice(3), ...almost];
    console.log(`  ${cat.categoryName}: ${eligible.length} eligible + ${almost.length} almost`);
  }
}

// ==================== KỲ II ====================
console.log('\n=== KỲ II ===');
// k2.csv: same format as quarter (left=ĐS GD, right=QL Xuất sắc)
// Row 5 (0-indexed): header row
// Left: Mã, Tên, Doanh số Kỳ II, Số HV Tuyển sinh, Team, Phần thưởng, Đạt/chưa đạt
// Right (col 8+): Mã, Tên, Doanh số Kỳ II, Số ĐS Active, Phần thưởng, Đạt/chưa đạt

{
  let hdr = -1, rightStart = -1;
  for (let i = 0; i < k2Rows.length; i++) {
    if (k2Rows[i][0] === 'Mã Đại sứ' && k2Rows[i].includes('Doanh số Kỳ II')) {
      hdr = i;
      for (let j = 6; j < k2Rows[i].length; j++) {
        if (k2Rows[i][j] === 'Mã Đại sứ') { rightStart = j; break; }
      }
      break;
    }
  }
  console.log(`  K2 header row: ${hdr}, rightStart col: ${rightStart}`);

  // Left: ĐS GD Xuất sắc Kỳ II
  const cat1 = apiData.semester.find(c => c.categoryName.includes('ĐẠI SỨ GIÁO DỤC'));
  if (cat1 && hdr >= 0) {
    const eligible = [], almost = [];
    for (let i = hdr + 1; i < k2Rows.length; i++) {
      const r = k2Rows[i];
      if (!r[0] || !/^\d+$/.test(r[0])) continue;
      const status = (r[6] || '').trim();
      const entry = {
        id: r[0], name: r[1], highlight: true,
        columns: [
          { label: 'Doanh số Kỳ II', value: r[2] || '0' },
          { label: 'Số HV tuyển sinh', value: r[3] || '0' },
          { label: 'Team', value: r[4] || '' }
        ],
        score: parseNum(r[2]), scoreLabel: 'Doanh số Kỳ II',
        score2: parseNum(r[3]), score2Label: 'Số HV tuyển sinh',
        rank: i - hdr, hideBadge: true
      };
      if (checkEligible(status)) {
        entry.highlight = true; entry.status = 'đủ điều kiện xét giải'; eligible.push(entry);
      } else {
        entry.highlight = false; entry.status = 'chưa đủ điều kiện'; almost.push(entry);
      }
    }
    cat1.topRankers = [...eligible, ...almost].slice(0, 3);
    cat1.otherRankers = [...eligible, ...almost].slice(3);
    cat1.scoreLabels = ['Doanh số Kỳ II', 'Số HV tuyển sinh', 'Team'];
    console.log(`  ${cat1.categoryName}: ${eligible.length} đạt + ${almost.length} chưa đạt`);
  }

  // Right: QL Xuất sắc Kỳ II
  const cat2 = apiData.semester.find(c => c.categoryName.includes('QUẢN LÝ'));
  if (cat2 && rightStart >= 0) {
    const eligible = [], almost = [];
    for (let i = hdr + 1; i < k2Rows.length; i++) {
      const r = k2Rows[i];
      if (!r[rightStart] || !/^\d+$/.test(r[rightStart])) continue;
      const status = (r[rightStart + 5] || r[rightStart + 4] || '').trim();
      const entry = {
        id: r[rightStart], name: r[rightStart + 1], highlight: true,
        columns: [
          { label: 'Doanh số Kỳ II', value: r[rightStart + 2] || '0' },
          { label: 'Số ĐS Active', value: r[rightStart + 3] || '0' }
        ],
        score: parseNum(r[rightStart + 2]), scoreLabel: 'Doanh số Kỳ II',
        score2: parseNum(r[rightStart + 3]), score2Label: 'Số ĐS Active',
        rank: i - hdr, hideBadge: true
      };
      if (checkEligible(status)) {
        entry.highlight = true; entry.status = 'đủ điều kiện xét giải'; eligible.push(entry);
      } else {
        entry.highlight = false; entry.status = 'chưa đủ điều kiện'; almost.push(entry);
      }
    }
    cat2.topRankers = [...eligible, ...almost].slice(0, 3);
    cat2.otherRankers = [...eligible, ...almost].slice(3);
    cat2.scoreLabels = ['Doanh số Kỳ II', 'Số ĐS Active'];
    console.log(`  ${cat2.categoryName}: ${eligible.length} đạt + ${almost.length} chưa đạt`);
  }
}

// ==================== SAVE ====================
fs.writeFileSync('api_response.json', JSON.stringify(apiData));
console.log('\n✅ Done! api_response.json updated.');

// Verify
const verify = JSON.parse(fs.readFileSync('api_response.json', 'utf8'));
console.log('\n=== VERIFY ===');
['month', 'quarter', 'semester'].forEach(tab => {
  verify[tab]?.forEach(c => {
    const t = c.topRankers?.[0];
    const o = c.otherRankers?.length || 0;
    if (t) console.log(`[${tab}] ${c.categoryName}: top#1=${t.name}, score=${t.score}, others=${o}`);
    else console.log(`[${tab}] ${c.categoryName}: no topRankers`);
  });
});
