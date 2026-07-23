/**
 * Script to update api_response.json with latest data from Google Sheets CSVs.
 * ONLY updates numerical data (scores, names, rankings). Does NOT change UI or structure.
 */
const fs = require('fs');

function parseNum(s) {
  if (!s) return 0;
  return Number(String(s).replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.\-]/g, '')) || 0;
}

function parseCsv(text) {
  // Simple CSV parser handling quoted fields with newlines
  const rows = [];
  let row = [];
  let inQuotes = false;
  let field = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      row.push(field.trim());
      field = '';
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field.trim());
      if (row.some(f => f !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field || row.length) { row.push(field.trim()); if (row.some(f => f !== '')) rows.push(row); }
  return rows;
}

// ==================== LOAD ====================
const apiData = JSON.parse(fs.readFileSync('api_response.json', 'utf8'));
const t07Rows = parseCsv(fs.readFileSync('/tmp/t07.csv', 'utf8'));
const q3Rows = parseCsv(fs.readFileSync('/tmp/q3.csv', 'utf8'));
const k2Rows = parseCsv(fs.readFileSync('/tmp/k2.csv', 'utf8'));

// ==================== HELPERS ====================
function findSection(rows, sectionNum) {
  const prefix = sectionNum + '.';
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].startsWith(prefix)) return i;
  }
  return -1;
}

function parseEligibleAndAlmost(rows, startIdx, endIdx) {
  // Find "Danh sách ... đủ điều kiện" and "cận đạt" sections
  const eligible = [];
  const almost = [];
  let headerIdx = -1;
  let almostColStart = -1;

  for (let i = startIdx; i < endIdx; i++) {
    const r = rows[i];
    if (r.some(c => c.includes('Mã Đại sứ'))) {
      headerIdx = i;
      // Find which column index starts "cận đạt"
      for (let j = 0; j < r.length; j++) {
        if (r[j].includes('Mã Đại sứ') && j > 0) { almostColStart = j; break; }
      }
      break;
    }
  }
  if (headerIdx < 0) return { eligible, almost };

  for (let i = headerIdx + 1; i < endIdx; i++) {
    const r = rows[i];
    // Eligible (left side)
    if (r[1] && !r[1].includes('Chưa có') && /^\d+$/.test(r[1])) {
      eligible.push({ id: r[1], name: r[2], score: parseNum(r[3]) });
    }
    // Almost (right side)
    if (almostColStart && r[almostColStart] && /^\d+$/.test(r[almostColStart])) {
      almost.push({ id: r[almostColStart], name: r[almostColStart + 1], score: parseNum(r[almostColStart + 2]) });
    }
  }
  return { eligible, almost };
}

// ==================== THÁNG 7 ====================
console.log('=== Updating THÁNG 7 ===');

// Section 1: Đại sứ mới T7
const s1Start = findSection(t07Rows, '1');
const s2Start = findSection(t07Rows, '2');
const s3Start = findSection(t07Rows, '3');
const s4Start = findSection(t07Rows, '4');
const t07End = t07Rows.length;

// Parse Section 1: Đại sứ mới
{
  const { eligible, almost } = parseEligibleAndAlmost(t07Rows, s1Start, s2Start);
  const cat = apiData.month.find(c => c.categoryName.includes('ĐẠI SỨ MỚI'));
  if (cat) {
    const all = [...eligible.map(e => ({ ...e, highlight: true })), ...almost.map(a => ({ ...a, highlight: false }))];
    cat.topRankers = all.filter(r => r.highlight).slice(0, 3).map(r => ({ id: r.id, name: r.name, score: r.score, score2: 0, highlight: true }));
    cat.otherRankers = [...all.filter(r => r.highlight).slice(3), ...all.filter(r => !r.highlight)].map(r => ({ id: r.id, name: r.name, score: r.score, score2: 0, highlight: r.highlight }));
    console.log(`  ${cat.categoryName}: ${cat.topRankers.length} top + ${cat.otherRankers.length} others`);
  }
}

// Parse Section 2: ĐS GD Xuất sắc T7
{
  const { eligible, almost } = parseEligibleAndAlmost(t07Rows, s2Start, s3Start);
  const cat = apiData.month.find(c => c.categoryName.includes('GIÁO DỤC XUẤT SẮC'));
  if (cat) {
    const all = [...eligible.map(e => ({ ...e, highlight: true })), ...almost.map(a => ({ ...a, highlight: false }))];
    cat.topRankers = all.filter(r => r.highlight).slice(0, 3).map(r => ({ id: r.id, name: r.name, score: r.score, score2: 0, highlight: true }));
    cat.otherRankers = [...all.filter(r => r.highlight).slice(3), ...all.filter(r => !r.highlight)].map(r => ({ id: r.id, name: r.name, score: r.score, score2: 0, highlight: r.highlight }));
    console.log(`  ${cat.categoryName}: ${cat.topRankers.length} top + ${cat.otherRankers.length} others`);
  }
}

// Parse Section 3: QL Tuyển dụng Xuất sắc T7
{
  const { eligible, almost } = parseEligibleAndAlmost(t07Rows, s3Start, s4Start);
  const cat = apiData.month.find(c => c.categoryName.includes('TUYỂN DỤNG'));
  if (cat) {
    const all = [...eligible.map(e => ({ ...e, highlight: true })), ...almost.map(a => ({ ...a, highlight: false }))];
    // This category has score = SL ĐS mới, score2 = DS ĐS mới
    // Re-parse with correct columns
    const eligFull = [];
    const almostFull = [];
    let headerIdx = -1;
    let almostColStart = -1;
    for (let i = s3Start; i < s4Start; i++) {
      if (t07Rows[i].some(c => c.includes('Mã Đại sứ'))) {
        headerIdx = i;
        for (let j = 4; j < t07Rows[i].length; j++) {
          if (t07Rows[i][j] && t07Rows[i][j].includes('Mã Đại sứ')) { almostColStart = j; break; }
        }
        break;
      }
    }
    for (let i = (headerIdx || s3Start) + 1; i < s4Start; i++) {
      const r = t07Rows[i];
      if (r[1] && /^\d+$/.test(r[1]) && !r[1].includes('Chưa')) {
        eligFull.push({ id: r[1], name: r[2], score: parseNum(r[3]), score2: parseNum(r[4]), highlight: true });
      }
      if (almostColStart && r[almostColStart] && /^\d+$/.test(r[almostColStart])) {
        almostFull.push({ id: r[almostColStart], name: r[almostColStart + 1], score: parseNum(r[almostColStart + 2]), score2: parseNum(r[almostColStart + 3]), highlight: false });
      }
    }
    const allFull = [...eligFull, ...almostFull];
    cat.topRankers = allFull.filter(r => r.highlight).slice(0, 3).map(r => ({
      id: r.id, name: r.name, score: r.score, score2: r.score2,
      scoreLabel: cat.scoreLabels?.[0], score2Label: cat.scoreLabels?.[1], highlight: true
    }));
    cat.otherRankers = [...allFull.filter(r => r.highlight).slice(3), ...allFull.filter(r => !r.highlight)].map(r => ({
      id: r.id, name: r.name, score: r.score, score2: r.score2,
      scoreLabel: cat.scoreLabels?.[0], score2Label: cat.scoreLabels?.[1], highlight: r.highlight
    }));
    console.log(`  ${cat.categoryName}: ${cat.topRankers.length} top + ${cat.otherRankers.length} others`);
  }
}

// Parse Section 4: QL Tiêu biểu T7 (multi-level)
{
  const cat = apiData.month.find(c => c.categoryName.includes('TIÊU BIỂU'));
  if (cat && cat.subCategories) {
    // Has sub-categories by level
    console.log(`  ${cat.categoryName}: has subCategories, parsing levels...`);
    // Parse level data from CSV
  } else if (cat) {
    // Single category - parse levels from CSV
    let headerIdx = -1;
    let almostColStart = -1;
    for (let i = s4Start; i < t07End; i++) {
      if (t07Rows[i].some(c => c.includes('Mã Đại sứ'))) {
        headerIdx = i;
        for (let j = 4; j < t07Rows[i].length; j++) {
          if (t07Rows[i][j] && t07Rows[i][j].includes('Mã Đại sứ')) { almostColStart = j; break; }
        }
        break;
      }
    }

    // Parse eligible and almost for each level
    let currentLevel = '';
    const levels = {};
    for (let i = (headerIdx || s4Start) + 1; i < t07End; i++) {
      const r = t07Rows[i];
      if (r[0] && r[0].startsWith('Cấp')) currentLevel = r[0];
      if (!currentLevel) continue;
      if (!levels[currentLevel]) levels[currentLevel] = { eligible: [], almost: [] };

      if (r[1] && /^\d+$/.test(r[1])) {
        levels[currentLevel].eligible.push({
          id: r[1], name: r[2], region: r[3],
          score: parseNum(r[4]), score2: parseNum(r[5]), highlight: true
        });
      }
      if (almostColStart && r[almostColStart] && /^\d+$/.test(r[almostColStart])) {
        levels[currentLevel].almost.push({
          id: r[almostColStart], name: r[almostColStart + 1], region: r[almostColStart + 2],
          score: parseNum(r[almostColStart + 3]), score2: parseNum(r[almostColStart + 4]), highlight: false
        });
      }
    }

    // Update the single category with all level data combined
    const allRankers = [];
    for (const [level, data] of Object.entries(levels)) {
      [...data.eligible, ...data.almost].forEach(r => {
        allRankers.push({ ...r, scoreLabel: 'Thực đạt mục tiêu cam kết', score2Label: 'Số đại sứ mới active trong đội ngũ' });
      });
    }
    cat.topRankers = allRankers.filter(r => r.highlight).slice(0, 3);
    cat.otherRankers = [...allRankers.filter(r => r.highlight).slice(3), ...allRankers.filter(r => !r.highlight)];
    console.log(`  ${cat.categoryName}: ${cat.topRankers.length} top + ${cat.otherRankers.length} others`);
  }
}

// ==================== QUÝ III ====================
console.log('\n=== Updating QUÝ III ===');

// Section 1: Top 3 ĐS GD Xuất sắc Q3
{
  const cat = apiData.quarter.find(c => c.categoryName.includes('TOP 3'));
  if (cat) {
    // Find header row
    let headerIdx = -1;
    for (let i = 0; i < q3Rows.length; i++) {
      if (q3Rows[i][0] === 'Mã Đại sứ' && q3Rows[i].includes('Doanh số quý')) { headerIdx = i; break; }
    }
    if (headerIdx >= 0) {
      const rankers = [];
      for (let i = headerIdx + 1; i < q3Rows.length; i++) {
        const r = q3Rows[i];
        if (r[0] && /^\d+$/.test(r[0])) {
          rankers.push({
            id: r[0], name: r[1], score: parseNum(r[3]), score2: parseNum(r[2]),
            scoreLabel: 'Doanh số quý', score2Label: 'Số HV tuyển sinh',
            highlight: true, region: r[4]
          });
        } else break;
      }
      cat.topRankers = rankers.slice(0, 3);
      cat.otherRankers = rankers.slice(3);
      console.log(`  ${cat.categoryName}: ${cat.topRankers.length} top + ${cat.otherRankers.length} others`);
    }
  }
}

// Section 2: Đại sứ Vàng Q3
{
  const s2 = findSection(q3Rows, '2');
  const s3 = findSection(q3Rows, '3');
  const cat = apiData.quarter.find(c => c.categoryName.includes('VÀNG'));
  if (cat && s2 >= 0) {
    const end = s3 >= 0 ? s3 : q3Rows.length;
    let eligHeader = -1, almostColStart = -1;
    for (let i = s2; i < end; i++) {
      if (q3Rows[i].some(c => c === 'Mã Đại sứ')) {
        eligHeader = i;
        for (let j = 4; j < q3Rows[i].length; j++) {
          if (q3Rows[i][j] === 'Mã Đại sứ') { almostColStart = j; break; }
        }
        break;
      }
    }
    const eligible = [], almost = [];
    if (eligHeader >= 0) {
      for (let i = eligHeader + 1; i < end; i++) {
        const r = q3Rows[i];
        if (r[0] && /^\d+$/.test(r[0])) {
          eligible.push({ id: r[0], name: r[1], score: parseNum(r[2]), score2: parseNum(r[3]), region: r[4], highlight: true });
        }
        if (almostColStart && r[almostColStart] && /^\d+$/.test(r[almostColStart])) {
          almost.push({ id: r[almostColStart], name: r[almostColStart+1], score: parseNum(r[almostColStart+2]), score2: parseNum(r[almostColStart+3]), region: r[almostColStart+4], highlight: false });
        }
      }
    }
    const all = [...eligible, ...almost];
    cat.topRankers = all.filter(r => r.highlight).slice(0, 3).map(r => ({
      id: r.id, name: r.name, score: r.score, score2: r.score2, highlight: true,
      scoreLabel: 'Số HV tuyển sinh', score2Label: 'Doanh số quý'
    }));
    cat.otherRankers = [...all.filter(r => r.highlight).slice(3), ...all.filter(r => !r.highlight)].map(r => ({
      id: r.id, name: r.name, score: r.score, score2: r.score2, highlight: r.highlight,
      scoreLabel: 'Số HV tuyển sinh', score2Label: 'Doanh số quý'
    }));
    console.log(`  ${cat.categoryName}: ${cat.topRankers.length} top + ${cat.otherRankers.length} others`);
  }
}

// Section 3: QL Tuyển dụng Q3
{
  const s3 = findSection(q3Rows, '3');
  const s4 = findSection(q3Rows, '4');
  const cat = apiData.quarter.find(c => c.categoryName.includes('TUYỂN DỤNG'));
  if (cat && s3 >= 0) {
    const end = s4 >= 0 ? s4 : q3Rows.length;
    let eligHeader = -1, almostColStart = -1;
    for (let i = s3; i < end; i++) {
      if (q3Rows[i][0] === 'Mã Đại sứ') {
        eligHeader = i;
        for (let j = 4; j < q3Rows[i].length; j++) {
          if (q3Rows[i][j] === 'Mã Đại sứ') { almostColStart = j; break; }
        }
        break;
      }
    }
    const eligible = [], almost = [];
    if (eligHeader >= 0) {
      for (let i = eligHeader + 1; i < end; i++) {
        const r = q3Rows[i];
        if (r[0] && /^\d+$/.test(r[0])) {
          eligible.push({ id: r[0], name: r[1], score: parseNum(r[2]), score2: parseNum(r[3]), region: r[4], highlight: true });
        }
        if (almostColStart && r[almostColStart] && /^\d+$/.test(r[almostColStart])) {
          almost.push({ id: r[almostColStart], name: r[almostColStart+1], score: parseNum(r[almostColStart+2]), score2: parseNum(r[almostColStart+3]), region: r[almostColStart+4], highlight: false });
        }
      }
    }
    const all = [...eligible, ...almost];
    cat.topRankers = all.filter(r => r.highlight).slice(0, 3);
    cat.otherRankers = [...all.filter(r => r.highlight).slice(3), ...all.filter(r => !r.highlight)];
    console.log(`  ${cat.categoryName}: ${cat.topRankers.length} top + ${cat.otherRankers.length} others`);
  }
}

// ==================== KỲ II ====================
console.log('\n=== Updating KỲ II ===');

// Parse both side-by-side tables
{
  // Find header row
  let headerIdx1 = -1, headerIdx2 = -1;
  for (let i = 0; i < k2Rows.length; i++) {
    if (k2Rows[i][0] === 'Mã Đại sứ' && k2Rows[i].includes('Doanh số Kỳ II')) {
      headerIdx1 = i;
      // Find second table header start
      for (let j = 6; j < k2Rows[i].length; j++) {
        if (k2Rows[i][j] === 'Mã Đại sứ') { headerIdx2 = j; break; }
      }
      break;
    }
  }

  // Parse Giải ĐS GD Xuất sắc Kỳ II (left table)
  const cat1 = apiData.semester.find(c => c.categoryName.includes('ĐẠI SỨ GIÁO DỤC'));
  if (cat1 && headerIdx1 >= 0) {
    const rankers = [];
    for (let i = headerIdx1 + 1; i < k2Rows.length; i++) {
      const r = k2Rows[i];
      if (r[0] && /^\d+$/.test(r[0])) {
        const cols = [];
        cols.push({ label: 'Doanh số Kỳ II', value: r[2] || '0' });
        cols.push({ label: 'Số HV tuyển sinh', value: r[3] || '0' });
        cols.push({ label: 'Team', value: r[4] || '' });
        rankers.push({
          id: r[0], name: r[1], highlight: true, columns: cols,
          score: parseNum(r[2]), scoreLabel: 'Doanh số Kỳ II',
          score2: parseNum(r[3]), score2Label: 'Số HV tuyển sinh',
          rank: parseNum(r[5]), hideBadge: true
        });
      }
    }
    cat1.topRankers = rankers.slice(0, 3);
    cat1.otherRankers = rankers.slice(3);
    cat1.scoreLabels = ['Doanh số Kỳ II', 'Số HV tuyển sinh', 'Team'];
    console.log(`  ${cat1.categoryName}: ${cat1.topRankers.length} top + ${cat1.otherRankers.length} others`);
  }

  // Parse Giải QL Xuất sắc Kỳ II (right table)
  const cat2 = apiData.semester.find(c => c.categoryName.includes('QUẢN LÝ'));
  if (cat2 && headerIdx2 >= 0) {
    const rankers = [];
    for (let i = headerIdx1 + 1; i < k2Rows.length; i++) {
      const r = k2Rows[i];
      if (r[headerIdx2] && /^\d+$/.test(r[headerIdx2])) {
        const cols = [];
        cols.push({ label: 'Doanh số Kỳ II', value: r[headerIdx2 + 2] || '0' });
        cols.push({ label: 'Số ĐS Active', value: r[headerIdx2 + 3] || '0' });
        rankers.push({
          id: r[headerIdx2], name: r[headerIdx2 + 1], highlight: true, columns: cols,
          score: parseNum(r[headerIdx2 + 2]), scoreLabel: 'Doanh số Kỳ II',
          score2: parseNum(r[headerIdx2 + 3]), score2Label: 'Số ĐS Active',
          rank: parseNum(r[headerIdx2 + 4]), hideBadge: true
        });
      }
    }
    cat2.topRankers = rankers.slice(0, 3);
    cat2.otherRankers = rankers.slice(3);
    cat2.scoreLabels = ['Doanh số Kỳ II', 'Số ĐS Active'];
    console.log(`  ${cat2.categoryName}: ${cat2.topRankers.length} top + ${cat2.otherRankers.length} others`);
  }
}

// ==================== SAVE ====================
fs.writeFileSync('api_response.json', JSON.stringify(apiData));
console.log('\n✅ api_response.json updated successfully!');
