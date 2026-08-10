import fs from 'fs';
import { parse } from 'csv-parse/sync';

function formatNumber(str) {
  return parseFloat(String(str || '0').replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, '')) || 0;
}

/**
 * Parse Google Sheets CSV export for leaderboard data.
 * New format: single vertical table per category, category title in first cell of header row.
 * Status column ("Đạt/cận đạt") determines highlight status.
 */
function parseFile(filename, categoryType) {
  const csvData = fs.readFileSync(filename, 'utf8');
  const rows = parse(csvData, { skip_empty_lines: false });
  const results = [];

  // Find category boundaries: rows starting with "1.", "2.", "3.", "4." or known titles
  const categoryTitlePattern = /^[1-4]\.\s/;
  const categoryStarts = [];

  for (let i = 0; i < rows.length; i++) {
    let firstCell = String(rows[i]?.[0] || '').trim();
    if (categoryTitlePattern.test(firstCell) && firstCell.length > 5) {
      // Clean multiline titles: take only up to first newline, then clean further
      if (firstCell.includes('\n')) {
        firstCell = firstCell.split('\n')[0].trim();
      }
      // Remove embedded descriptions after the main title
      // e.g. "1. TOP 3 ĐẠI SỨ GIÁO DỤC XUẤT SẮC Số lượng học sinh..."
      const titleMatch = firstCell.match(/^([1-4]\..+?(?:THÁNG \d+|QUÝ [IVX]+|KỲ [IVX]+))\s/i);
      if (titleMatch) {
        firstCell = titleMatch[1].trim();
      } else {
        // Try to cut at known boundary words
        const cutPoints = ['Số lượng', 'Cơ chế', 'Doanh số xét', 'CÁC ĐẠI SỨ', 'Mã Đại sứ', 'DANH SÁCH'];
        for (const cp of cutPoints) {
          const idx = firstCell.indexOf(cp);
          if (idx > 10) {
            firstCell = firstCell.substring(0, idx).trim();
            break;
          }
        }
      }
      categoryStarts.push({ rowIdx: i, title: firstCell });
    }
  }

  // For Kỳ II format: two categories side by side
  if (categoryType === 'semester') {
    return parseSemesterFile(rows, categoryType);
  }

  for (let ci = 0; ci < categoryStarts.length; ci++) {
    const catStart = categoryStarts[ci];
    const catEnd = ci + 1 < categoryStarts.length ? categoryStarts[ci + 1].rowIdx : rows.length;
    const catTitle = catStart.title;

    // Skip "4. QUẢN LÝ TIÊU BIỂU" in quarter mode - handled by parseQuarterQLTieuBieu
    if (categoryType === 'quarter' && catTitle.toLowerCase().includes('tiêu biểu')) {
      continue;
    }

    // Find column indices from header - scan up to 10 rows after title
    let headerRowIdx = catStart.rowIdx;
    let idCol = -1, nameCol = -1, dataCols = [], statusCol = -1;

    const maxScan = Math.min(catStart.rowIdx + 10, catEnd);
    for (let scanIdx = catStart.rowIdx; scanIdx < maxScan; scanIdx++) {
      const scanRow = rows[scanIdx];
      if (!scanRow) continue;
      
      // Check if this row contains header keywords
      let foundName = false;
      for (let c = 0; c < scanRow.length; c++) {
        const h = String(scanRow[c]).toLowerCase().trim();
        if (h.includes('tên đại sứ') || h === 'tên') {
          foundName = true;
          break;
        }
      }
      
      if (!foundName) continue;
      
      // This is the header row
      headerRowIdx = scanIdx;
      idCol = -1; nameCol = -1; dataCols = []; statusCol = -1;
      
      for (let c = 0; c < scanRow.length; c++) {
        const h = String(scanRow[c]).toLowerCase().trim();
        if (!h) continue;
        if (h.includes('mã đại sứ') || h === 'mã' || h.includes('mã đs')) idCol = c;
        else if (h.includes('tên đại sứ') || h === 'tên' || h.includes('tên đs')) nameCol = c;
        else if (h.includes('đạt/cận đạt') || h.includes('đạt/chưa đạt')) statusCol = c;
        else if (h === 'top') dataCols.push({ colIndex: c, label: String(scanRow[c]).trim() });
        else if (h.includes('thưởng') && !h.includes('doanh')) { /* skip reward column */ }
        else if (h.includes('phần thưởng')) { /* skip */ }
        else if (h.length > 0 && h.length < 80) {
          dataCols.push({ colIndex: c, label: String(scanRow[c]).trim() });
        }
      }
      break; // Found header, stop scanning
    }

    // If dataCols is still empty but we have nameCol, infer columns from data rows
    if (nameCol !== -1 && dataCols.length === 0) {
      const sampleRow = rows[headerRowIdx + 1];
      if (sampleRow) {
        // idCol: typically column before nameCol
        if (idCol === -1 && nameCol > 0) {
          const possibleId = String(sampleRow[nameCol - 1] || '').trim();
          if (/^\d+$/.test(possibleId)) {
            idCol = nameCol - 1;
          }
        }

        const catLower = catTitle.toLowerCase();

        // Context-aware column mapping based on category title
        if (catLower.includes('giáo dục xuất sắc') && !catLower.includes('quản lý') && !catLower.includes('top 3')) {
          // Cat2: ĐS GĐXS monthly - col after name = Doanh số cá nhân (skip thưởng col which has small values like 800.000)
          const dsCol = nameCol + 1;
          if (dsCol < sampleRow.length) {
            dataCols.push({ colIndex: dsCol, label: 'Doanh số cá nhân' });
          }
        } else if (catLower.includes('tuyển dụng')) {
          // Cat3: QL Tuyển dụng - col3=SL Đại sứ mới, col4=Doanh thu ĐS mới
          const slCol = nameCol + 1;
          const dtCol = nameCol + 2;
          if (slCol < sampleRow.length) {
            dataCols.push({ colIndex: slCol, label: 'SL Đại sứ mới PSDT' });
          }
          if (dtCol < sampleRow.length) {
            dataCols.push({ colIndex: dtCol, label: 'Doanh thu ĐS mới' });
          }
        } else if (catLower.includes('tiêu biểu')) {
          // Cat4: QL Tiêu biểu - handled by explicit header detection (has "Số đại sứ mới active")
          // But if missing, infer: col4=% mục tiêu, col5=SL active
          const pctCol = nameCol + 2; // skip empty col3
          const activeCol = nameCol + 3;
          if (pctCol < sampleRow.length) {
            dataCols.push({ colIndex: pctCol, label: 'Thực đạt mục tiêu cam kết' });
          }
          if (activeCol < sampleRow.length) {
            dataCols.push({ colIndex: activeCol, label: 'Số đại sứ mới active trong đội ngũ' });
          }
        } else {
          // Generic fallback: find first numeric column after name
          for (let c = nameCol + 1; c < sampleRow.length; c++) {
            if (c === statusCol) continue;
            const val = String(sampleRow[c] || '').trim();
            if (!val) continue;
            if (/^[\d.,]+$/.test(val.replace(/\s/g, '')) && val.length > 0) {
              dataCols.push({ colIndex: c, label: 'Doanh số cá nhân' });
              break; // Only take first numeric column
            }
          }
        }
      }
    }

    // For Cat4 (tiêu biểu): also ensure % mục tiêu column is included if only "Số đại sứ mới active" was found
    if (nameCol !== -1 && dataCols.length === 1 && catTitle.toLowerCase().includes('tiêu biểu')) {
      const sampleRow = rows[headerRowIdx + 1];
      if (sampleRow) {
        const existingCol = dataCols[0].colIndex;
        const pctCol = existingCol - 1;
        const pctVal = String(sampleRow[pctCol] || '').trim();
        if (pctVal && pctVal.includes('%')) {
          dataCols.unshift({ colIndex: pctCol, label: 'Thực đạt mục tiêu cam kết' });
        }
      }
    }

    if (nameCol === -1) continue; // Can't find name column, skip

    // Parse data rows
    const ambassadors = [];
    let currentRegion = '';

    for (let j = headerRowIdx + 1; j < catEnd; j++) {
      const row = rows[j];
      if (!row) continue;

      const name = row[nameCol] ? String(row[nameCol]).trim() : '';
      if (!name || name.toLowerCase().includes('chưa có đại sứ')) continue;

      // Skip sub-header rows (e.g. rows that look like headers for sub-sections)
      const nameLower = name.toLowerCase();
      if (nameLower === 'tên đại sứ' || nameLower === 'tên' || nameLower.includes('mã đại sứ')) continue;
      // Skip info/legend rows
      if (nameLower.includes('quản lý') && nameLower.includes('cấp')) continue;
      if (nameLower === 'quản lý') continue;
      if (nameLower.includes('điều kiện đủ')) continue;
      if (nameLower.includes('đang đua top')) continue;
      if (nameLower.includes('>= ')) continue;
      if (nameLower.startsWith('cấp nhóm') || nameLower.startsWith('cấp phòng') || nameLower.startsWith('cấp khu vực')) continue;
      // Skip rows where name looks like a number (Q3 QL TB section has mã codes in name col)
      if (/^\d+$/.test(name) && categoryType === 'quarter') continue;
      // Skip "Số lượng Đại sứ mới active" info rows
      if (nameLower.includes('số lượng đại sứ') || nameLower.includes('active')) continue;

      // Check for region marker in first cell
      const firstCell = String(row[0] || '').trim();
      if (firstCell && (firstCell.includes('Cấp Nhóm') || firstCell.includes('Cấp Phòng') || firstCell.includes('Cấp Khu vực'))) {
        currentRegion = firstCell;
      }

      // Determine status
      let status = 'chưa đủ điều kiện xét giải';
      let highlight = false;
      if (statusCol !== -1) {
        const statusVal = String(row[statusCol] || '').trim().toLowerCase();
        if (statusVal.includes('đủ điều kiện xét giải') || statusVal === 'đạt điều kiện xét giải') {
          status = 'đủ điều kiện xét giải';
          highlight = true;
        } else if (statusVal.includes('chưa đủ')) {
          status = 'chưa đủ điều kiện xét giải';
        }
      }

      const ambassador = {
        id: idCol !== -1 && row[idCol] ? String(row[idCol]).trim() : '',
        name: name,
        highlight: highlight,
        status: status,
        columns: []
      };

      if (currentRegion && catTitle.toLowerCase().includes('quản lý tiêu biểu')) {
        ambassador.region = currentRegion;
      }

      let mainScoreAdded = false;
      dataCols.forEach(col => {
        let val = row[col.colIndex];
        if (val == null || String(val).trim() === '') val = '';
        else val = String(val).trim();

        // Skip the status column value if it ended up in dataCols
        if (col.label.toLowerCase().includes('đạt/cận đạt') || col.label.toLowerCase().includes('đạt/chưa đạt')) return;

        ambassador.columns.push({ label: col.label, value: val });

        const hlower = col.label.toLowerCase();
        if (!mainScoreAdded && (hlower.includes('doanh số') || hlower.includes('doanh thu') || hlower.includes('thực đạt') || hlower.includes('số hv'))) {
          ambassador.score = formatNumber(val);
          ambassador.scoreLabel = col.label;
          mainScoreAdded = true;
        } else if (ambassador.score2 === undefined &&
                  (hlower.includes('ngày tham gia') || hlower.includes('số lượng') || hlower.includes('active') || hlower.includes('số đại sứ') || hlower.includes('doanh số') || hlower.includes('số hv'))) {
          ambassador.score2 = hlower.includes('ngày') ? val : formatNumber(val);
          ambassador.score2Label = col.label;
        }
      });

      // Swap score/score2 for "Đại sứ mới" category: primary display is "Doanh số", secondary is "Ngày tham gia"
      if (catTitle.toLowerCase().includes('đại sứ mới') && ambassador.scoreLabel && ambassador.scoreLabel.toLowerCase().includes('ngày')) {
        // Ngày tham gia was picked as score, swap
        const tmpScore = ambassador.score;
        const tmpLabel = ambassador.scoreLabel;
        ambassador.score = ambassador.score2 || 0;
        ambassador.scoreLabel = ambassador.score2Label || 'Doanh số cá nhân';
        ambassador.score2 = tmpScore || tmpLabel;
        ambassador.score2Label = tmpLabel || 'Ngày tham gia';
      }

      if (ambassador.score === undefined && ambassador.columns.length > 0) {
        ambassador.score = formatNumber(ambassador.columns[0].value);
        ambassador.scoreLabel = ambassador.columns[0].label;
      }

      // For quarter and semester, handle special flags
      if (categoryType === 'quarter' || categoryType === 'semester') {
        delete ambassador.region;
      }

      ambassadors.push(ambassador);
    }

    // Determine top rankers vs other rankers
    let finalTopRankers = [];
    let finalOtherRankers = [];

    // For categories with explicit Top markers or "Đủ điều kiện"
    const isQuarterTop3 = categoryType === 'quarter' && catTitle.toLowerCase().includes('top 3');

    ambassadors.forEach(a => {
      if (a.highlight && finalTopRankers.length < 3 && !isQuarterTop3) {
        finalTopRankers.push(a);
      } else if (isQuarterTop3 && a.rank && a.rank <= 3) {
        finalTopRankers.push(a);
      } else {
        finalOtherRankers.push(a);
      }
    });

    // For quarter Top 3, pick first entries as top rankers
    if (isQuarterTop3 && finalTopRankers.length === 0) {
      const topCount = Math.min(3, ambassadors.length);
      for (let i = 0; i < topCount; i++) {
        if (ambassadors[i]) {
          ambassadors[i].highlight = true;
          ambassadors[i].rank = i + 1;
          ambassadors[i].hideBadge = true;
          finalTopRankers.push(ambassadors[i]);
        }
      }
      finalOtherRankers = ambassadors.slice(topCount);
    }

    // Fix category names
    let finalTitle = catTitle.replace(/\s+$/, '');

    // Normalize quarter category names
    if (categoryType === 'quarter') {
      if (finalTitle.toLowerCase().includes('top 3') && finalTitle.toLowerCase().includes('xuất sắc')) {
        finalTitle = '1. TOP 3 ĐẠI SỨ GIÁO DỤC XUẤT SẮC QUÝ III';
      }
    }

    // Rename "Số HV Live" to "Số HV tuyển sinh"
    // Rename "Top" and "Đạt/cận đạt" to "Trạng thái điều kiện"
    ambassadors.forEach(a => {
      if (a.columns) {
        a.columns.forEach(col => {
          if (col.label === 'Số HV Live') col.label = 'Số HV tuyển sinh';
          if (col.label === 'Top' || col.label === 'Đạt/cận đạt' || col.label === 'Đạt/chưa đạt') col.label = 'Trạng thái điều kiện';
        });
      }
      if (a.scoreLabel === 'Số HV Live') a.scoreLabel = 'Số HV tuyển sinh';
      if (a.score2Label === 'Số HV Live') a.score2Label = 'Số HV tuyển sinh';
    });

    let isUpdating = ambassadors.length === 0;

    // Generate stable categoryId
    let catId = `cat_${categoryType}_`;
    if (finalTitle.includes('ĐẠI SỨ MỚI')) catId += 'dsm';
    else if (finalTitle.includes('GIÁO DỤC XUẤT SẮC') && !finalTitle.includes('QUẢN LÝ')) catId += 'dsgd';
    else if (finalTitle.includes('TUYỂN DỤNG')) catId += 'qltd';
    else if (finalTitle.includes('TIÊU BIỂU')) catId += 'qltb';
    else if (finalTitle.includes('TOP 3')) catId += 'top3';
    else if (finalTitle.includes('VÀNG')) catId += 'vang';
    else if (finalTitle.includes('QUẢN LÝ XUẤT SẮC')) catId += 'qlxs';
    else catId += Math.random().toString(36).substring(7);

    results.push({
      categoryId: catId,
      categoryName: finalTitle,
      topRankers: isUpdating ? [] : finalTopRankers,
      otherRankers: isUpdating ? [] : finalOtherRankers,
      hasMultipleScores: dataCols.length > 1,
      scoreLabels: dataCols.map(c => {
        let label = c.label;
        if (label === 'Số HV Live') label = 'Số HV tuyển sinh';
        if (label === 'Top' || label === 'Đạt/cận đạt' || label === 'Đạt/chưa đạt') label = 'Trạng thái điều kiện';
        return label;
      }),
      ...(isUpdating ? { isUpdating: true } : {})
    });
  }

  // Special handling for Q3: parse "4. QUẢN LÝ TIÊU BIỂU" section with level grouping
  if (categoryType === 'quarter') {
    const qlTbResults = parseQuarterQLTieuBieu(rows);
    results.push(...qlTbResults);
  }

  return results;
}

/**
 * Parse Q3's "4. QUẢN LÝ TIÊU BIỂU" section with management level sub-categories.
 * CSV format: header row has "Mã Đại sứ,Họ và tên,Cấp bậc,Thực đạt mục tiêu cam kết,Số đại sứ mới active,Đạt/cận đạt"
 * Data rows have level group labels in col 0 (e.g. "Cấp Trưởng Nhóm")
 */
function parseQuarterQLTieuBieu(rows) {
  const results = [];
  
  // Find the header row for QL Tiêu biểu data section
  let dataStartIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Look for the header: "Mã Đại sứ,Họ và tên,Cấp bậc,..."
    const col1 = String(row[1] || '').trim().toLowerCase();
    if (col1 === 'mã đại sứ' && String(row[2] || '').trim().toLowerCase().includes('họ và tên')) {
      dataStartIdx = i + 1;
      break;
    }
  }
  
  if (dataStartIdx === -1) {
    console.log('  QL Tiêu biểu Q3: Header not found');
    return results;
  }

  // Parse data rows, group by level
  const levelGroups = {};
  let currentLevel = '';
  
  for (let j = dataStartIdx; j < rows.length; j++) {
    const row = rows[j];
    if (!row) continue;
    
    const col0 = String(row[0] || '').trim();
    const id = String(row[1] || '').trim();
    const name = String(row[2] || '').trim();
    
    if (!id && !name) continue; // Skip empty rows
    
    // Check if col0 has a new level label
    if (col0 && col0.startsWith('Cấp ')) {
      currentLevel = col0;
    }
    
    if (!name || !id) continue; // Need both name and id
    
    let pctStr = String(row[4] || '').trim();
    // Convert raw decimal to percentage: "1" -> "100%", "0.9174" -> "91,74%"
    if (pctStr && !pctStr.includes('%')) {
      const num = parseFloat(pctStr.replace(/,/g, '.'));
      if (!isNaN(num) && num <= 2) {
        // Value is a decimal ratio (e.g. 1 = 100%, 0.75 = 75%)
        pctStr = (num * 100).toFixed(2).replace('.', ',').replace(/,?0+$/, '') + '%';
      }
    }
    const activeCount = String(row[5] || '').trim();
    const statusStr = String(row[6] || '').trim().toLowerCase();
    
    const status = statusStr.includes('đủ điều kiện xét giải') || statusStr === 'đạt điều kiện xét giải'
      ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện xét giải';
    const highlight = status === 'đủ điều kiện xét giải';
    
    if (!levelGroups[currentLevel]) {
      levelGroups[currentLevel] = [];
    }
    
    levelGroups[currentLevel].push({
      id,
      name,
      highlight,
      status,
      region: String(row[3] || '').trim(), // Cấp bậc (e.g. "Trưởng nhóm")
      columns: [
        { label: 'Thực đạt mục tiêu cam kết', value: pctStr },
        { label: 'Số đại sứ mới active trong đội ngũ', value: activeCount },
        { label: 'Trạng thái điều kiện', value: String(row[6] || '').trim() }
      ],
      score: pctStr,
      scoreLabel: 'Thực đạt mục tiêu cam kết'
    });
  }
  
  // Create a sub-category for each level
  const levelOrder = Object.keys(levelGroups);
  let subIdx = 1;
  
  for (const level of levelOrder) {
    const ambassadors = levelGroups[level];
    if (!ambassadors.length) continue;
    
    const levelName = level || 'Khác';
    const catTitle = `4.${subIdx}. QUẢN LÝ TIÊU BIỂU QUÝ III - ${levelName}`;
    
    results.push({
      categoryId: `cat_quarter_qltb_${subIdx}`,
      categoryName: catTitle,
      topRankers: [],
      otherRankers: ambassadors,
      hasMultipleScores: true,
      scoreLabels: ['Thực đạt mục tiêu cam kết', 'Số đại sứ mới active trong đội ngũ', 'Trạng thái điều kiện'],
    });
    
    subIdx++;
  }
  
  console.log(`  QL Tiêu biểu Q3: ${levelOrder.length} levels, ${Object.values(levelGroups).flat().length} total people`);
  return results;
}

/**
 * Parse Kỳ II format: two categories side-by-side in the same rows
 */
function parseSemesterFile(rows, categoryType) {
  const results = [];
  if (!rows.length) return results;

  // First row has both category titles
  const headerRow = rows[0];
  // Find the split point between left and right categories
  let splitCol = -1;
  for (let c = 7; c < headerRow.length; c++) {
    const cell = String(headerRow[c] || '').trim();
    if (cell.length > 10 && (cell.includes('GIẢI') || cell.includes('TOP'))) {
      splitCol = c;
      break;
    }
  }

  // Parse left category (Đại sứ Giáo dục Xuất sắc)
  const leftTitle = String(headerRow[0] || '').trim().split('\n')[0].trim();
  // Parse right category (Quản lý Xuất sắc)
  const rightTitle = splitCol !== -1 ? String(headerRow[splitCol] || '').trim().split('\n')[0].trim() : '';

  // Second row has actual column headers for both
  // Format: Mã, Tên, Doanh số, Số HV, Team, Phần thưởng, Đạt/chưa, [gap], Mã, Tên, Doanh số, Số ĐS Active, Phần thưởng, Đạt/chưa

  // Parse left side
  const leftAmbassadors = [];
  const rightAmbassadors = [];

  for (let j = 2; j < rows.length; j++) {
    const row = rows[j];
    if (!row) continue;

    // Left side
    const leftId = String(row[0] || '').trim();
    const leftName = String(row[1] || '').trim();
    if (leftName && leftName.length > 1 && !leftName.toLowerCase().includes('chưa có')) {
      const doanh = String(row[2] || '').trim();
      const soHV = String(row[3] || '').trim();
      const team = String(row[4] || '').trim();
      const thuong = String(row[5] || '').trim();
      const status = String(row[6] || '').trim();

      const isQualified = status.toLowerCase().includes('đạt điều kiện xét giải');

      leftAmbassadors.push({
        id: leftId,
        name: leftName,
        highlight: isQualified,
        status: isQualified ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện xét giải',
        columns: [
          { label: 'Doanh số Kỳ II', value: doanh },
          { label: 'Số HV Tuyển sinh', value: soHV },
          { label: 'Team', value: team }
        ],
        score: formatNumber(doanh),
        scoreLabel: 'Doanh số Kỳ II',
        score2: parseInt(soHV) || 0,
        score2Label: 'Số HV Tuyển sinh',
        hideBadge: true,
        ...(thuong ? { reward: thuong } : {})
      });
    }

    // Right side
    if (splitCol !== -1) {
      const rightId = String(row[splitCol] || '').trim();
      const rightName = String(row[splitCol + 1] || '').trim();
      if (rightName && rightName.length > 1 && !rightName.toLowerCase().includes('chưa có')) {
        const doanh = String(row[splitCol + 2] || '').trim();
        const soDS = String(row[splitCol + 3] || '').trim();
        const thuong = String(row[splitCol + 4] || '').trim();
        const status = String(row[splitCol + 5] || '').trim();

        const isQualified = status.toLowerCase().includes('đạt điều kiện xét giải') ||
                           status.toLowerCase().includes('đủ điều kiện');

        rightAmbassadors.push({
          id: rightId,
          name: rightName,
          highlight: isQualified,
          status: isQualified ? 'đủ điều kiện xét giải' : 'chưa đủ điều kiện xét giải',
          columns: [
            { label: 'Doanh số Kỳ II', value: doanh },
            { label: 'Số ĐS Active', value: soDS }
          ],
          score: formatNumber(doanh),
          scoreLabel: 'Doanh số Kỳ II',
          score2: parseInt(soDS) || 0,
          score2Label: 'Số ĐS Active',
          hideBadge: true
        });
      }
    }
  }

  // Build left category
  const leftTop = leftAmbassadors.filter(a => a.highlight).slice(0, 3);
  const leftOther = leftAmbassadors.filter(a => !leftTop.includes(a));
  leftTop.forEach((a, i) => { a.rank = i + 1; });

  let leftFinalTitle = '1. GIẢI ĐẠI SỨ GIÁO DỤC XUẤT SẮC KỲ II';
  results.push({
    categoryId: 'cat_semester_dsgd',
    categoryName: leftFinalTitle,
    topRankers: leftTop,
    otherRankers: leftOther,
    hasMultipleScores: true,
    scoreLabels: ['Doanh số Kỳ II', 'Số HV Tuyển sinh', 'Team']
  });

  // Build right category
  if (rightAmbassadors.length > 0) {
    const rightTop = rightAmbassadors.filter(a => a.highlight).slice(0, 3);
    const rightOther = rightAmbassadors.filter(a => !rightTop.includes(a));
    rightTop.forEach((a, i) => { a.rank = i + 1; });

    let rightFinalTitle = '2. GIẢI QUẢN LÝ XUẤT SẮC KỲ II';
    results.push({
      categoryId: 'cat_semester_qlxs',
      categoryName: rightFinalTitle,
      topRankers: rightTop,
      otherRankers: rightOther,
      hasMultipleScores: true,
      scoreLabels: ['Doanh số Kỳ II', 'Số ĐS Active']
    });
  }

  return results;
}

// Build the leaderboard data
const data = {
  month: parseFile('t7.csv', 'month'),
  quarter: parseFile('q3.csv', 'quarter'),
  semester: parseFile('k2.csv', 'semester'),
  challenge: []
};

// Ensure "4. QUẢN LÝ TIÊU BIỂU QUÝ III" is present in quarter results
if (!data.quarter.some(c => c.categoryName.includes('QUẢN LÝ TIÊU BIỂU'))) {
  data.quarter.push({
    categoryId: 'cat_quarter_qltb',
    categoryName: '4. QUẢN LÝ TIÊU BIỂU QUÝ III',
    topRankers: [],
    otherRankers: [],
    hasMultipleScores: false,
    scoreLabels: [],
    isUpdating: true
  });
}

fs.writeFileSync('api_response.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated api_response.json');
console.log('Month categories:', data.month.map(c => c.categoryName + ' (' + (c.topRankers.length + c.otherRankers.length) + ' people)'));
console.log('Quarter categories:', data.quarter.map(c => c.categoryName + ' (' + (c.topRankers.length + c.otherRankers.length) + ' people)'));
console.log('Semester categories:', data.semester.map(c => c.categoryName + ' (' + (c.topRankers.length + c.otherRankers.length) + ' people)'));
