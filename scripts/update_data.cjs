/**
 * Update api_response.json with latest data from Google Sheets CSVs.
 * ONLY updates numerical data. Preserves existing structure/format exactly.
 */
const fs = require('fs');

function parseNum(s) {
  if (!s) return 0;
  return Number(String(s).replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.\-]/g, '')) || 0;
}

function fmtNum(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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

// ==================== LOAD ====================
const apiData = JSON.parse(fs.readFileSync('/tmp/api_response_backup.json', 'utf8'));
const t07Rows = parseCsv(fs.readFileSync('/tmp/t07.csv', 'utf8'));
const q3Rows = parseCsv(fs.readFileSync('/tmp/q3.csv', 'utf8'));
const k2Rows = parseCsv(fs.readFileSync('/tmp/k2.csv', 'utf8'));

function findSection(rows, num) {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].startsWith(num + '.')) return i;
  }
  return -1;
}

// ==================== THÁNG 7 ====================
console.log('=== THÁNG 7 ===');

const s1 = findSection(t07Rows, '1');
const s2 = findSection(t07Rows, '2');
const s3 = findSection(t07Rows, '3');
const s4 = findSection(t07Rows, '4');

// Section 1: ĐẠI SỨ MỚI THÁNG 7
{
  const cat = apiData.month.find(c => c.categoryName.includes('ĐẠI SỨ MỚI'));
  if (cat) {
    // Find header row with "Mã Đại sứ"
    let hdr = -1, almostStart = -1;
    for (let i = s1; i < s2; i++) {
      if (t07Rows[i][1] === 'Mã Đại sứ') {
        hdr = i;
        for (let j = 5; j < t07Rows[i].length; j++) {
          if (t07Rows[i][j] === 'Mã Đại sứ') { almostStart = j; break; }
        }
        break;
      }
    }
    
    const eligible = [], almost = [];
    for (let i = hdr + 1; i < s2; i++) {
      const r = t07Rows[i];
      // Eligible: col 1=mã, 2=tên, 3=ngày, 4=doanh số, 5=thưởng
      if (r[1] && /^\d+$/.test(r[1])) {
        eligible.push({
          id: r[1], name: r[2],
          columns: [
            { label: 'Ngày tham gia', value: r[3] || '' },
            { label: 'Doanh số cá nhân', value: r[4] || '0' }
          ],
          score2: r[3] || '', score2Label: 'Ngày tham gia',
          score: parseNum(r[4]), scoreLabel: 'Doanh số cá nhân',
          highlight: true, status: 'đủ điều kiện xét giải'
        });
      }
      // Almost: col 8=mã, 9=tên, 10=ngày, 11=doanh số
      if (almostStart && r[almostStart] && /^\d+$/.test(r[almostStart])) {
        almost.push({
          id: r[almostStart], name: r[almostStart + 1],
          columns: [
            { label: 'Ngày tham gia', value: r[almostStart + 2] || '' },
            { label: 'Doanh số cá nhân', value: r[almostStart + 3] || '0' }
          ],
          score2: r[almostStart + 2] || '', score2Label: 'Ngày tham gia',
          score: parseNum(r[almostStart + 3]), scoreLabel: 'Doanh số cá nhân',
          highlight: false, status: 'cận đạt'
        });
      }
    }
    cat.topRankers = eligible.slice(0, 3);
    cat.otherRankers = [...eligible.slice(3), ...almost];
    console.log(`  ${cat.categoryName}: ${eligible.length} eligible + ${almost.length} almost`);
  }
}

// Section 2: ĐS GD XUẤT SẮC THÁNG 7
{
  const cat = apiData.month.find(c => c.categoryName.includes('GIÁO DỤC XUẤT SẮC'));
  if (cat) {
    let hdr = -1, almostStart = -1;
    for (let i = s2; i < s3; i++) {
      if (t07Rows[i][1] === 'Mã Đại sứ') {
        hdr = i;
        for (let j = 5; j < t07Rows[i].length; j++) {
          if (t07Rows[i][j] === 'Mã Đại sứ') { almostStart = j; break; }
        }
        break;
      }
    }
    
    const eligible = [], almost = [];
    for (let i = hdr + 1; i < s3; i++) {
      const r = t07Rows[i];
      if (r[1] && /^\d+$/.test(r[1])) {
        eligible.push({
          id: r[1], name: r[2],
          columns: [{ label: 'Doanh số cá nhân', value: r[3] || '0' }],
          score: parseNum(r[3]), scoreLabel: 'Doanh số cá nhân',
          highlight: true, status: 'đủ điều kiện xét giải'
        });
      }
      if (almostStart && r[almostStart] && /^\d+$/.test(r[almostStart])) {
        almost.push({
          id: r[almostStart], name: r[almostStart + 1],
          columns: [{ label: 'Doanh số cá nhân', value: r[almostStart + 2] || '0' }],
          score: parseNum(r[almostStart + 2]), scoreLabel: 'Doanh số cá nhân',
          highlight: false, status: 'cận đạt'
        });
      }
    }
    cat.topRankers = eligible.slice(0, 3);
    cat.otherRankers = [...eligible.slice(3), ...almost];
    console.log(`  ${cat.categoryName}: ${eligible.length} eligible + ${almost.length} almost`);
  }
}

// Section 3: QL TUYỂN DỤNG XUẤT SẮC THÁNG 7
{
  const cat = apiData.month.find(c => c.categoryName.includes('TUYỂN DỤNG') && c.categoryName.includes('7'));
  if (cat) {
    let hdr = -1, almostStart = -1;
    for (let i = s3; i < s4; i++) {
      if (t07Rows[i][1] === 'Mã Đại sứ') {
        hdr = i;
        for (let j = 5; j < t07Rows[i].length; j++) {
          if (t07Rows[i][j] === 'Mã Đại sứ') { almostStart = j; break; }
        }
        break;
      }
    }
    
    const eligible = [], almost = [];
    for (let i = hdr + 1; i < s4; i++) {
      const r = t07Rows[i];
      // col1=mã, 2=tên, 3=SL ĐS mới, 4=Doanh thu, 5=thưởng
      if (r[1] && /^\d+$/.test(r[1])) {
        eligible.push({
          id: r[1], name: r[2],
          columns: [
            { label: 'SL Đại sứ mới PSDT', value: r[3] || '0' },
            { label: 'Doanh thu ĐS mới', value: r[4] || '0' }
          ],
          score: parseNum(r[3]), scoreLabel: 'SL Đại sứ mới PSDT',
          score2: parseNum(r[4]), score2Label: 'Doanh thu ĐS mới',
          highlight: true, status: 'đủ điều kiện xét giải'
        });
      }
      if (almostStart && r[almostStart] && /^\d+$/.test(r[almostStart])) {
        almost.push({
          id: r[almostStart], name: r[almostStart + 1],
          columns: [
            { label: 'SL Đại sứ mới PSDT', value: r[almostStart + 2] || '0' },
            { label: 'Doanh thu ĐS mới', value: r[almostStart + 3] || '0' }
          ],
          score: parseNum(r[almostStart + 2]), scoreLabel: 'SL Đại sứ mới PSDT',
          score2: parseNum(r[almostStart + 3]), score2Label: 'Doanh thu ĐS mới',
          highlight: false, status: 'cận đạt'
        });
      }
    }
    cat.topRankers = eligible.slice(0, 3);
    cat.otherRankers = [...eligible.slice(3), ...almost];
    console.log(`  ${cat.categoryName}: ${eligible.length} eligible + ${almost.length} almost`);
  }
}

// Section 4: QL TIÊU BIỂU THÁNG 7
{
  const cat = apiData.month.find(c => c.categoryName.includes('TIÊU BIỂU') && c.categoryName.includes('7'));
  if (cat) {
    let hdr = -1, almostStart = -1;
    for (let i = s4; i < t07Rows.length; i++) {
      if (t07Rows[i][1] === 'Mã Đại sứ') {
        hdr = i;
        for (let j = 5; j < t07Rows[i].length; j++) {
          if (t07Rows[i][j] === 'Mã Đại sứ') { almostStart = j; break; }
        }
        break;
      }
    }
    
    let currentLevel = '';
    const eligible = [], almost = [];
    for (let i = hdr + 1; i < t07Rows.length; i++) {
      const r = t07Rows[i];
      if (r[0] && r[0].startsWith('Cấp')) currentLevel = r[0];
      if (!currentLevel) continue;
      
      // Eligible: col0=cấp/empty, 1=mã, 2=tên, 3=cấp bậc, 4=% đạt, 5=SL ĐS active
      if (r[1] && /^\d+$/.test(r[1])) {
        eligible.push({
          id: r[1], name: r[2], region: currentLevel,
          columns: [
            { label: 'Cấp bậc', value: r[3] || '' },
            { label: 'Thực đạt mục tiêu cam kết', value: r[4] || '' },
            { label: 'Số đại sứ mới active trong đội ngũ', value: r[5] || '0' }
          ],
          score: parseNum(r[4]), scoreLabel: 'Thực đạt mục tiêu cam kết',
          score2: parseNum(r[5]), score2Label: 'Số đại sứ mới active trong đội ngũ',
          highlight: true, status: 'đủ điều kiện xét giải'
        });
      }
      if (almostStart && r[almostStart] && /^\d+$/.test(r[almostStart])) {
        almost.push({
          id: r[almostStart], name: r[almostStart + 1], region: currentLevel,
          columns: [
            { label: 'Cấp bậc', value: r[almostStart + 2] || '' },
            { label: 'Thực đạt mục tiêu cam kết', value: r[almostStart + 3] || '' },
            { label: 'Số đại sứ mới active trong đội ngũ', value: r[almostStart + 4] || '0' }
          ],
          score: parseNum(r[almostStart + 3]), scoreLabel: 'Thực đạt mục tiêu cam kết',
          score2: parseNum(r[almostStart + 4]), score2Label: 'Số đại sứ mới active trong đội ngũ',
          highlight: false, status: 'cận đạt'
        });
      }
    }
    cat.topRankers = eligible.slice(0, 3);
    cat.otherRankers = [...eligible.slice(3), ...almost];
    console.log(`  ${cat.categoryName}: ${eligible.length} eligible + ${almost.length} almost`);
  }
}

// ==================== QUÝ III ====================
console.log('\n=== QUÝ III ===');

const q1 = findSection(q3Rows, '1');
const q2 = findSection(q3Rows, '2');
const q3s = findSection(q3Rows, '3');
const q4 = findSection(q3Rows, '4');

// Section 1: TOP 3 ĐS GD XUẤT SẮC QUÝ III
{
  const cat = apiData.quarter.find(c => c.categoryName.includes('TOP 3'));
  if (cat) {
    let hdr = -1;
    for (let i = q1; i < q2; i++) {
      if (q3Rows[i][0] === 'Mã Đại sứ') { hdr = i; break; }
    }
    const rankers = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < q2; i++) {
        const r = q3Rows[i];
        if (!r[0] || !/^\d+$/.test(r[0])) break;
        rankers.push({
          id: r[0], name: r[1], highlight: true,
          columns: [
            { label: 'Số HV tuyển sinh', value: r[2] || '0' },
            { label: 'Doanh số quý', value: r[3] || '0' },
            { label: 'Team', value: r[4] || '' }
          ],
          score: parseNum(r[2]), scoreLabel: 'Số HV tuyển sinh',
          score2: parseNum(r[3]), score2Label: 'Doanh số quý',
          rank: parseNum(r[5]), hideBadge: true
        });
      }
    }
    cat.topRankers = rankers.slice(0, 3);
    cat.otherRankers = rankers.slice(3);
    cat.scoreLabels = ['Số HV tuyển sinh', 'Doanh số quý', 'Team'];
    console.log(`  ${cat.categoryName}: ${rankers.length} rankers`);
  }
}

// Section 2: ĐẠI SỨ VÀNG QUÝ III
{
  const cat = apiData.quarter.find(c => c.categoryName.includes('VÀNG'));
  if (cat) {
    let hdr = -1, almostStart = -1;
    for (let i = q2; i < q3s; i++) {
      if (q3Rows[i][0] === 'Mã Đại sứ') {
        hdr = i;
        for (let j = 5; j < q3Rows[i].length; j++) {
          if (q3Rows[i][j] === 'Mã Đại sứ') { almostStart = j; break; }
        }
        break;
      }
    }
    const eligible = [], almost = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < q3s; i++) {
        const r = q3Rows[i];
        if (r[0] && /^\d+$/.test(r[0])) {
          eligible.push({
            id: r[0], name: r[1], highlight: true,
            columns: [
              { label: 'Số HV tuyển sinh', value: r[2] || '0' },
              { label: 'Doanh số quý', value: r[3] || '0' },
              { label: 'Team', value: r[4] || '' }
            ],
            score: parseNum(r[2]), scoreLabel: 'Số HV tuyển sinh',
            score2: parseNum(r[3]), score2Label: 'Doanh số quý',
            status: 'đủ điều kiện xét giải'
          });
        }
        if (almostStart && r[almostStart] && /^\d+$/.test(r[almostStart])) {
          almost.push({
            id: r[almostStart], name: r[almostStart+1], highlight: false,
            columns: [
              { label: 'Số HV tuyển sinh', value: r[almostStart+2] || '0' },
              { label: 'Doanh số quý', value: r[almostStart+3] || '0' },
              { label: 'Team', value: r[almostStart+4] || '' }
            ],
            score: parseNum(r[almostStart+2]), scoreLabel: 'Số HV tuyển sinh',
            score2: parseNum(r[almostStart+3]), score2Label: 'Doanh số quý',
            status: 'cận đạt'
          });
        }
      }
    }
    cat.topRankers = eligible.slice(0, 3);
    cat.otherRankers = [...eligible.slice(3), ...almost];
    cat.scoreLabels = ['Số HV tuyển sinh', 'Doanh số quý', 'Team'];
    console.log(`  ${cat.categoryName}: ${eligible.length} eligible + ${almost.length} almost`);
  }
}

// Section 3: QL TUYỂN DỤNG XUẤT SẮC QUÝ III
{
  const cat = apiData.quarter.find(c => c.categoryName.includes('TUYỂN DỤNG') && c.categoryName.includes('III'));
  if (cat) {
    let hdr = -1, almostStart = -1;
    const end = q4 >= 0 ? q4 : q3Rows.length;
    for (let i = q3s; i < end; i++) {
      if (q3Rows[i][0] === 'Mã Đại sứ') {
        hdr = i;
        for (let j = 5; j < q3Rows[i].length; j++) {
          if (q3Rows[i][j] === 'Mã Đại sứ') { almostStart = j; break; }
        }
        break;
      }
    }
    const eligible = [], almost = [];
    if (hdr >= 0) {
      for (let i = hdr + 1; i < end; i++) {
        const r = q3Rows[i];
        if (r[0] && /^\d+$/.test(r[0])) {
          eligible.push({
            id: r[0], name: r[1], highlight: true,
            columns: [
              { label: 'Số lượng Đại sứ mới active', value: r[2] || '0' },
              { label: 'Tổng doanh số Đại sứ mới active', value: r[3] || '0' },
              { label: 'Team', value: r[4] || '' }
            ],
            score: parseNum(r[2]), scoreLabel: 'Số lượng Đại sứ mới active',
            score2: parseNum(r[3]), score2Label: 'Tổng doanh số Đại sứ mới active',
            status: 'đủ điều kiện xét giải'
          });
        }
        if (almostStart && r[almostStart] && /^\d+$/.test(r[almostStart])) {
          almost.push({
            id: r[almostStart], name: r[almostStart+1], highlight: false,
            columns: [
              { label: 'Số lượng Đại sứ mới active', value: r[almostStart+2] || '0' },
              { label: 'Tổng doanh số Đại sứ mới active', value: r[almostStart+3] || '0' },
              { label: 'Team', value: r[almostStart+4] || '' }
            ],
            score: parseNum(r[almostStart+2]), scoreLabel: 'Số lượng Đại sứ mới active',
            score2: parseNum(r[almostStart+3]), score2Label: 'Tổng doanh số Đại sứ mới active',
            status: 'cận đạt'
          });
        }
      }
    }
    cat.topRankers = eligible.slice(0, 3);
    cat.otherRankers = [...eligible.slice(3), ...almost];
    cat.scoreLabels = ['Số lượng Đại sứ mới active', 'Tổng doanh số Đại sứ mới active', 'Team'];
    console.log(`  ${cat.categoryName}: ${eligible.length} eligible + ${almost.length} almost`);
  }
}

// ==================== KỲ II ====================
console.log('\n=== KỲ II ===');
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

  // Left: ĐS GD Xuất sắc Kỳ II
  const cat1 = apiData.semester.find(c => c.categoryName.includes('ĐẠI SỨ GIÁO DỤC'));
  if (cat1 && hdr >= 0) {
    const rankers = [];
    for (let i = hdr + 1; i < k2Rows.length; i++) {
      const r = k2Rows[i];
      if (!r[0] || !/^\d+$/.test(r[0])) continue;
      rankers.push({
        id: r[0], name: r[1], highlight: true,
        columns: [
          { label: 'Doanh số Kỳ II', value: r[2] || '0' },
          { label: 'Số HV tuyển sinh', value: r[3] || '0' },
          { label: 'Team', value: r[4] || '' }
        ],
        score: parseNum(r[2]), scoreLabel: 'Doanh số Kỳ II',
        score2: parseNum(r[3]), score2Label: 'Số HV tuyển sinh',
        rank: parseNum(r[5]), hideBadge: true
      });
    }
    cat1.topRankers = rankers.slice(0, 3);
    cat1.otherRankers = rankers.slice(3);
    cat1.scoreLabels = ['Doanh số Kỳ II', 'Số HV tuyển sinh', 'Team'];
    console.log(`  ${cat1.categoryName}: ${rankers.length} rankers`);
  }

  // Right: QL Xuất sắc Kỳ II
  const cat2 = apiData.semester.find(c => c.categoryName.includes('QUẢN LÝ'));
  if (cat2 && rightStart >= 0) {
    const rankers = [];
    for (let i = hdr + 1; i < k2Rows.length; i++) {
      const r = k2Rows[i];
      if (!r[rightStart] || !/^\d+$/.test(r[rightStart])) continue;
      rankers.push({
        id: r[rightStart], name: r[rightStart + 1], highlight: true,
        columns: [
          { label: 'Doanh số Kỳ II', value: r[rightStart + 2] || '0' },
          { label: 'Số ĐS Active', value: r[rightStart + 3] || '0' }
        ],
        score: parseNum(r[rightStart + 2]), scoreLabel: 'Doanh số Kỳ II',
        score2: parseNum(r[rightStart + 3]), score2Label: 'Số ĐS Active',
        rank: parseNum(r[rightStart + 4]), hideBadge: true
      });
    }
    cat2.topRankers = rankers.slice(0, 3);
    cat2.otherRankers = rankers.slice(3);
    cat2.scoreLabels = ['Doanh số Kỳ II', 'Số ĐS Active'];
    console.log(`  ${cat2.categoryName}: ${rankers.length} rankers`);
  }
}

// ==================== SAVE ====================
fs.writeFileSync('api_response.json', JSON.stringify(apiData));
console.log('\n✅ Done!');

// Verify
const verify = JSON.parse(fs.readFileSync('api_response.json', 'utf8'));
console.log('\n=== VERIFY ===');
['month', 'quarter', 'semester'].forEach(tab => {
  verify[tab]?.forEach(c => {
    const t = c.topRankers?.[0];
    if (t) console.log(`${c.categoryName}: #1 = ${t.name}, score=${t.score}, columns=${JSON.stringify(t.columns?.map(c=>c.value))}`);
    else console.log(`${c.categoryName}: no rankers`);
  });
});
