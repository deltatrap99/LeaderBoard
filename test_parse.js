const fs = require('fs');

// Dummy structures
var data = { month: [], quarter: [], semester: [], challenge: [] };

function cleanCategoryName(sheetName, categoryType) {
  var name = sheetName.trim();
  name = name.replace(/^(Giải thưởng|Thưởng)\s+/i, '');
  if (name.toLowerCase().endsWith('giáo d')) name = name.slice(0, -6) + 'Giáo dục';
  else if (name.toLowerCase().indexOf('giáo d ') >= 0 && name.toLowerCase().indexOf('giáo dục') < 0) name = name.replace(/Giáo d\s/i, 'Giáo dục ');
  if (categoryType === 'semester' && name.toLowerCase().indexOf('giáo dục') >= 0) name = 'Đại sứ Giáo dục xuất sắc Kỳ I';
  name = name.replace(/^EGC\s*-\s*/, '');
  if (name.toLowerCase().indexOf('vàng q') >= 0) {
    if (name.toLowerCase().indexOf('ii') >= 0 || name.indexOf('2') >= 0) name = 'Đại sứ Vàng Quý II/2026';
    else name = 'Đại sứ Vàng Quý I/2026';
  }
  name = name.replace(/tiêu biểu\s+T$/i, 'tiêu biểu');
  name = name.replace(/tiêu biểu\s+Q$/i, 'tiêu biểu');
  name = name.replace(/cấp q$/i, 'cấp Quản lý');
  name = name.charAt(0).toUpperCase() + name.slice(1);
  return name;
}

function findHeaderRow(rows) {
  for (var r = 0; r < Math.min(10, rows.length); r++) {
    if (!rows[r]) continue;
    var nonNull = rows[r].filter(function(c) { return c != null && String(c).trim() !== ''; });
    if (nonNull.length < 2) continue;
    var shortCells = rows[r].filter(function(c) {
      return c != null && typeof c === 'string' && c.trim().length > 0 && c.trim().length < 50;
    });
    if (shortCells.length < 2) continue;
    var rowStr = shortCells.map(function(c) { return String(c).toLowerCase(); }).join(' ');
    if ((rowStr.indexOf('tên') >= 0 || rowStr.indexOf('đại sứ') >= 0 || rowStr.indexOf('họ và') >= 0) &&
        (rowStr.indexOf('mã') >= 0 || rowStr.indexOf('doanh số') >= 0 || rowStr.indexOf('thành tích') >= 0 ||
         rowStr.indexOf('n-1') >= 0 || rowStr.indexOf('tuyển dụng') >= 0 || rowStr.indexOf('active') >= 0 ||
         rowStr.indexOf('hv mới') >= 0 || rowStr.indexOf('hệ số') >= 0 || rowStr.indexOf('thực đạt') >= 0 ||
         rowStr.indexOf('mục tiêu') >= 0)) {
      return r;
    }
  }
  for (var r2 = 0; r2 < Math.min(10, rows.length); r2++) {
    if (!rows[r2]) continue;
    var rStr = rows[r2].map(function(e){ return String(e).toLowerCase();}).join(' ');
    if (rStr.indexOf('tên') >= 0 && (rStr.indexOf('doanh số') >= 0 || rStr.indexOf('số lượng') >= 0)) return r2;
  }
  return -1;
}

// ----------------- COPY FROM Leaderboard.gs -----------------
function parseNormalSheet(data, categoryType, rows, headerRow, headerRowIdx, sheetName, idx) {
  var pairs = [];
  headerRow.forEach(function(col, ci) {
    if (typeof col === 'string' && col.toLowerCase().indexOf('tên') >= 0) {
      var scoreIdx = -1, idIdx2 = -1;
      for (var j = 0; j < headerRow.length; j++) {
        if (typeof headerRow[j] === 'string' && headerRow[j].toLowerCase().indexOf('mã') >= 0 && Math.abs(j - ci) <= 3) {
          idIdx2 = j; break;
        }
      }
      for (var j2 = ci + 1; j2 <= ci + 5 && j2 < headerRow.length; j2++) {
        var c = String(headerRow[j2]).toLowerCase();
        if (c.indexOf('doanh số') >= 0 || c.indexOf('tuyển dụng') >= 0 || c.indexOf('điểm') >= 0 ||
            c.indexOf('tổng số') >= 0 || c.indexOf('hệ số') >= 0 || c.indexOf('thành tích') >= 0 ||
            c.indexOf('thực đạt') >= 0 || c.indexOf('mục tiêu') >= 0) {
          scoreIdx = j2; break;
        }
      }
      if (scoreIdx !== -1) pairs.push({ nameIdx: ci, scoreIdx: scoreIdx, idIdx: idIdx2 });
    }
  });

  if (pairs.length === 0) {
    var nIdx = -1, sIdx = -1, iIdx = -1;
    headerRow.forEach(function(col, ci) {
      if (typeof col === 'string') {
        var c = col.toLowerCase();
        if (nIdx === -1 && c.indexOf('tên') >= 0) nIdx = ci;
        if (sIdx === -1 && (c.indexOf('doanh số') >= 0 || c.indexOf('điểm') >= 0 || c.indexOf('thành tích') >= 0 || c.indexOf('thực đạt') >= 0 || c.indexOf('mục tiêu') >= 0)) sIdx = ci;
        if (iIdx === -1 && c.indexOf('mã') >= 0) iIdx = ci;
      }
    });
    if (nIdx !== -1 && sIdx !== -1) {
      pairs.push({ nameIdx: nIdx, scoreIdx: sIdx, idIdx: iIdx !== -1 ? iIdx : nIdx - 1 });
    }
  }

  if (pairs.length === 0) return;

  var ambassadors = [];
  var isHighlight = true;
  for (var r = headerRowIdx + 1; r < rows.length; r++) {
    var row = rows[r];
    if (!row || row.length === 0) continue;
    var rowStr = row.map(function(e) { return String(e).toLowerCase(); }).join(' ');
    if (rowStr.indexOf('cận đạt') >= 0) isHighlight = false;

    pairs.forEach(function(p) {
      var name = row[p.nameIdx];
      if (!name || typeof name !== 'string') return;
      if (name.toLowerCase().indexOf('tổng') >= 0 || name.toLowerCase().indexOf('đại sứ') >= 0) return;
      var numScore = parseFloat(String(row[p.scoreIdx]).replace(/,/g, ''));
      if (isNaN(numScore) || numScore <= 0) return;
      var realId = (p.idIdx !== -1 && row[p.idIdx]) ? String(row[p.idIdx]) : 'u_' + r + '_' + p.nameIdx;
      ambassadors.push({ id: realId, name: name.trim(), score: numScore, highlight: isHighlight });
    });
  }

  ambassadors.sort(function(a, b) { return b.score - a.score; });
  if (ambassadors.length === 0) return;

  var catName = cleanCategoryName(sheetName, categoryType);
  var eligible = ambassadors.filter(a => a.highlight);
  var almost = ambassadors.filter(a => !a.highlight);
  data[categoryType].push({
    categoryId: 'cat_' + idx, categoryName: catName,
    topRankers: eligible.slice(0, 3), otherRankers: eligible.slice(3).concat(almost)
  });
}

function parseRecruitmentSheet(data, categoryType, rows, headerRow, headerRowIdx, sheetName, idx) {
  var nameIdx = -1, idIdx = -1, n1ActiveIdx = -1, n1RevenueIdx = -1;
  var n1ActiveLabel = 'SL N-1 active', n1RevenueLabel = 'DS N-1 mới';

  headerRow.forEach(function(col, ci) {
    if (typeof col !== 'string') return;
    var c = col.toLowerCase().trim();
    if (c.indexOf('tên') >= 0) nameIdx = ci;
    if (c.indexOf('mã') >= 0) idIdx = ci;
    if ((c.indexOf('số lượng') >= 0 && c.indexOf('n-1') >= 0) || c.indexOf('sl đại sứ mới psdt') >= 0 || c.indexOf('sl đại sứ mới') >= 0) { n1ActiveIdx = ci; n1ActiveLabel = col.trim(); }
    if (c.indexOf('active') >= 0 && c.indexOf('số lượng') < 0 && c.indexOf('n-1') >= 0) { n1ActiveIdx = ci; n1ActiveLabel = col.trim(); }
    if ((c.indexOf('doanh số') >= 0 && c.indexOf('n-1') >= 0) || c.indexOf('doanh thu đs mới') >= 0) { n1RevenueIdx = ci; n1RevenueLabel = col.trim(); }
  });

  if (nameIdx === -1 || (n1ActiveIdx === -1 && n1RevenueIdx === -1)) return;

  var isHighlight = true;
  var ambassadors = [];
  for (var r = headerRowIdx + 1; r < rows.length; r++) {
    var row = rows[r];
    if (!row || row.length === 0) continue;
    var rowStr = row.map(function(e) { return String(e).toLowerCase(); }).join(' ');
    if (rowStr.indexOf('cận đạt') >= 0) isHighlight = false;

    var name = row[nameIdx];
    if (!name || typeof name !== 'string') continue;
    if (name.toLowerCase().indexOf('tổng') >= 0 || name.toLowerCase().indexOf('đại sứ') >= 0) continue;

    var realId = (idIdx !== -1 && row[idIdx]) ? String(row[idIdx]) : 'u_' + r;
    var n1Active = (n1ActiveIdx !== -1 && row[n1ActiveIdx] != null) ? parseFloat(String(row[n1ActiveIdx]).replace(/,/g, '')) : 0;
    var n1Revenue = (n1RevenueIdx !== -1 && row[n1RevenueIdx] != null) ? parseFloat(String(row[n1RevenueIdx]).replace(/,/g, '')) : 0;
    if (isNaN(n1Active)) n1Active = 0;
    if (isNaN(n1Revenue)) n1Revenue = 0;

    if (n1Active > 0 || n1Revenue > 0) {
      ambassadors.push({
        id: realId, name: name.trim(), score: n1Active, score2: n1Revenue,
        scoreLabel: n1ActiveLabel, score2Label: n1RevenueLabel, highlight: isHighlight
      });
    }
  }

  ambassadors.sort(function(a, b) { return (b.score2||0) - (a.score2||0) || b.score - a.score; });
  if (ambassadors.length === 0) return;

  var catName = cleanCategoryName(sheetName, categoryType);
  var eligible = ambassadors.filter(a => a.highlight);
  var almost = ambassadors.filter(a => !a.highlight);

  data[categoryType].push({
    categoryId: 'cat_' + idx, categoryName: catName,
    topRankers: eligible.slice(0, 3), otherRankers: eligible.slice(3).concat(almost),
    hasMultipleScores: true, scoreLabels: [n1ActiveLabel, n1RevenueLabel]
  });
}

function parseManagerSheet(data, categoryType, rows, headerRow, sheetName, idx) {
  var isHighlight = true, currentLevel = 'Cấp Nhóm';
  var levels = { 'Cấp Nhóm': [], 'Cấp Phòng': [], 'Cấp Khu vực': [] };
  var nameIdx = -1, idIdx = -1, heSoIdx = -1, slActiveIdx = -1;
  var heSoLabel = 'Hệ số % THMT', slActiveLabel = 'SL Đại sứ mới active';

  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    if (!row || row.length === 0) continue;
    var rowStr = row.map(function(e) { return String(e).toLowerCase(); }).join(' ');

    if (rowStr.indexOf('cận đạt') >= 0) isHighlight = false;

    if ((rowStr.indexOf('tên') >= 0 || rowStr.indexOf('đại sứ') >= 0) &&
        (rowStr.indexOf('hệ số') >= 0 || rowStr.indexOf('doanh số') >= 0 || rowStr.indexOf('thực đạt') >= 0 || rowStr.indexOf('mục tiêu') >= 0)) {
      var usedIdxs = {};
      row.forEach(function(col, ci) {
        if (typeof col !== 'string') return;
        var c = col.toLowerCase().trim();
        if (c.indexOf('mã') >= 0) { idIdx = ci; usedIdxs[ci] = true; }
        if (c.indexOf('hệ số') >= 0 || c.indexOf('doanh số') >= 0 || c.indexOf('thực đạt') >= 0 || c.indexOf('mục tiêu cam kết') >= 0) { heSoIdx = ci; heSoLabel = col.trim(); usedIdxs[ci] = true; }
        if (c.indexOf('số lượng') >= 0 || c.indexOf('active') >= 0 || c.indexOf('đs mới active') >= 0 || c.indexOf('đại sứ mới') >= 0) { slActiveIdx = ci; slActiveLabel = col.trim(); usedIdxs[ci] = true; }
      });
      row.forEach(function(col, ci) {
        if (typeof col !== 'string' || usedIdxs[ci]) return;
        var c = col.toLowerCase().trim();
        if (c.indexOf('tên') >= 0 || c === 'đại sứ' || c === 'tên đại sứ') nameIdx = ci;
      });
      continue;
    }

    if (nameIdx !== -1 && heSoIdx !== -1) {
      var name = String(row[nameIdx] || '').trim();
      if (!name || name.toLowerCase().indexOf('tên') >= 0 || name.toLowerCase().indexOf('danh sách') >= 0) continue;
      if (name.toLowerCase().indexOf('tổng') >= 0 || name.toLowerCase().indexOf('đại sứ') >= 0) continue;

      var levelCol = String(row[0] || '').trim();
      if (levelCol.indexOf('Cấp') === 0) currentLevel = levelCol;

      var realId = (idIdx !== -1 && row[idIdx]) ? String(row[idIdx]) : 'u_' + r;
      var heSoStr = String(row[heSoIdx]).replace(/,/g, '');
      if (heSoStr.endsWith('%')) heSoStr = heSoStr.slice(0, -1);
      var heSo = parseFloat(heSoStr);
      var slActive = (slActiveIdx !== -1) ? parseFloat(String(row[slActiveIdx]).replace(/,/g, '')) : 0;
      if (isNaN(heSo)) continue;
      if (isNaN(slActive)) slActive = 0;

      if (heSo > 0 || slActive > 0) {
        var targetKey = 'Cấp Nhóm';
        if (currentLevel.indexOf('Phòng') >= 0) targetKey = 'Cấp Phòng';
        if (currentLevel.indexOf('Khu vực') >= 0) targetKey = 'Cấp Khu vực';
        levels[targetKey].push({
          id: realId, name: name, score: heSo, score2: slActive,
          scoreLabel: heSoLabel, score2Label: slActiveLabel, highlight: isHighlight
        });
      }
    }
  }

  var baseName = cleanCategoryName(sheetName, categoryType);
  ['Cấp Nhóm','Cấp Phòng','Cấp Khu vực'].forEach(function(level, li) {
    var amb = levels[level];
    if (amb.length === 0 && level !== 'Cấp Nhóm') return;
    amb.sort(function(a, b) { return b.score - a.score || (b.score2||0) - (a.score2||0); });
    var eligible = amb.filter(function(a) { return a.highlight !== false; });
    var almost = amb.filter(function(a) { return a.highlight === false; });
    data[categoryType].push({
      categoryId: 'cat_' + idx + '_lv_' + li,
      categoryName: baseName + ' - ' + level,
      topRankers: eligible.slice(0, 3), otherRankers: eligible.slice(3).concat(almost),
      hasMultipleScores: true, scoreLabels: [heSoLabel, slActiveLabel]
    });
  });
}

function parseStackedSheet(data, categoryType, rows, sheetName, idx) {
  var blocks = [];
  var currentBlock = null;
  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    var firstCell = String(row[0] || '').trim();
    if (/^[0-9]+\.\s/.test(firstCell) && firstCell.toUpperCase() === firstCell) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { title: firstCell, rows: [] };
    }
    if (currentBlock) {
      currentBlock.rows.push(row);
    }
  }
  if (currentBlock) blocks.push(currentBlock);

  blocks.forEach(function(block, bIdx) {
    var title = block.title.replace(/^[0-9]+\.\s*/, '');
    var bRows = block.rows;
    var headerRowIdx = findHeaderRow(bRows);
    if (headerRowIdx === -1) return;
    var headerRow = bRows[headerRowIdx];
    
    var subIdx = idx + '_' + bIdx;
    if (title.toLowerCase().indexOf('tuyển dụng') >= 0) {
      parseRecruitmentSheet(data, categoryType, bRows, headerRow, headerRowIdx, title, subIdx);
    } else if (title.toLowerCase().indexOf('tiêu biểu') >= 0) {
      parseManagerSheet(data, categoryType, bRows, headerRow, title, subIdx);
    } else {
      parseNormalSheet(data, categoryType, bRows, headerRow, headerRowIdx, title, subIdx);
    }
  });
}

const csv = fs.readFileSync('t06_leaderboard.csv', 'utf8');
const rows = csv.split('\n').map(l => l.split(','));

parseStackedSheet(data, 'month', rows, 'GE.T6.26', 99);

console.log(JSON.stringify(data.month.map(c => c.categoryName), null, 2));
