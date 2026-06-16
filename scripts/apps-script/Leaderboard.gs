// ==================================================
// Leaderboard Data Parser (Apps Script)
// ==================================================

function getLeaderboardData() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets = ss.getSheets();
  var data = { month: [], quarter: [], challenge: [], semester: [] };

  // Build dedup map
  var baseNameMap = {};
  for (var i = 1; i < sheets.length; i++) {
    var sheet = sheets[i];
    if (sheet.isSheetHidden()) continue;
    var sheetName = sheet.getName();
    var cat = categorizeSheet(sheetName);
    if (!cat) continue;
    var base = getSheetBaseName(sheetName);
    baseNameMap[base] = i;
  }
  var validIdxs = {};
  for (var key in baseNameMap) validIdxs[baseNameMap[key]] = true;

  for (var i = 1; i < sheets.length; i++) {
    if (!validIdxs[i]) continue;
    var sheet = sheets[i];
    var sheetName = sheet.getName();
    var categoryType = categorizeSheet(sheetName);
    if (!categoryType) continue;

    var rows = sheet.getDataRange().getValues();
    if (!rows || rows.length < 2) continue;

    if (sheetName.toLowerCase().indexOf('ge.t6') >= 0 || sheetName.toLowerCase().indexOf('tổng hợp') >= 0 || (rows[0] && rows[0][0] && String(rows[0][0]).trim().match(/^[0-9]\.\s+[A-ZĐ]/))) {
      parseStackedSheet(data, categoryType, rows, sheetName, i);
      continue;
    }
    var headerRowIdx = findHeaderRow(rows);
    if (headerRowIdx === -1) continue;

    var headerRow = rows[headerRowIdx];
    var recruitment = isRecruitment(sheetName);
    var gold = isGoldAmbassador(sheetName);
    var mgr = isManager(sheetName);

    if (mgr) {
      parseManagerSheet(data, categoryType, rows, headerRow, sheetName, i);
      continue;
    }
    if (gold) {
      parseGoldSheet(data, categoryType, rows, headerRow, headerRowIdx, sheetName, i);
      continue;
    }
    if (recruitment) {
      parseRecruitmentSheet(data, categoryType, rows, headerRow, headerRowIdx, sheetName, i);
      continue;
    }
    parseNormalSheet(data, categoryType, rows, headerRow, headerRowIdx, sheetName, i);
  }

  // Post-processing
  ['month','quarter','semester','challenge'].forEach(function(tab) {
    data[tab].forEach(function(cat) {
      if (cat.categoryName.toLowerCase().indexOf('bứt tốc') >= 0) {
        cat.categoryName = cat.categoryName.replace(/Bứt tốc\s*(quý|q\d*)/i, 'Đại sứ Bứt tốc Ấn tượng');
      }
    });
  });
  ['month','quarter','semester'].forEach(function(tab) {
    data[tab].forEach(function(cat) {
      if (!cat.categoryName.toLowerCase().startsWith('giải thưởng')) {
        cat.categoryName = 'Giải thưởng ' + cat.categoryName;
      }
      if (cat.categoryName.toLowerCase().indexOf('quản lý tuyển dụng') >= 0 || cat.categoryName.toLowerCase().indexOf('trang tính20') >= 0 || cat.categoryName.toLowerCase().indexOf('trang tính29') >= 0) {
        if (tab === 'month') {
          cat.categoryName = 'Giải thưởng Quản lý Tuyển dụng Xuất sắc Tháng 06';
        } else if (tab === 'quarter') {
          cat.categoryName = 'Giải thưởng Quản lý Tuyển dụng Xuất sắc Quý II/2026';
        }
      }
      if (cat.categoryName.toLowerCase().indexOf('trang tính25') >= 0) cat.categoryName = 'Giải thưởng Đại sứ Giáo dục xuất sắc Quý II/2026';
      if (cat.categoryName.toLowerCase().indexOf('trang tính26') >= 0) cat.categoryName = 'Giải thưởng Đại sứ Vàng Quý II/2026';
      if (cat.categoryName.toLowerCase().indexOf('trang tính30') >= 0) cat.categoryName = 'Giải thưởng Quản lý tiêu biểu Quý II/2026';
    });
  });
  // Subtitles
  ['month','quarter','semester','challenge'].forEach(function(tab) {
    data[tab].forEach(function(cat) {
      var n = cat.categoryName.toLowerCase();
      if (n.indexOf('đại sứ mới') >= 0 || n.indexOf('bứt tốc') >= 0 || n.indexOf('giáo dục xuất sắc') >= 0) {
        cat.categorySubtitle = 'Biểu dương các Đại sứ mới xuất sắc, căn cứ theo số liệu tuyển sinh';
      }
      if (n.indexOf('vàng') >= 0) {
        cat.categorySubtitle = 'Biểu dương các Đại sứ Giáo dục có thành tích tuyển sinh xuất sắc';
      }
    });
  });

  return data;
}

// ============ MANAGER SHEET ============
function parseManagerSheet(data, categoryType, rows, headerRow, sheetName, idx) {
  var isHighlight = true, currentLevel = 'Cấp Nhóm';
  var levels = { 'Cấp Nhóm': [], 'Cấp Phòng': [], 'Cấp Khu vực': [] };
  var currentPairs = null;
  var heSoLabel = 'Hệ số % THMT', slActiveLabel = 'SL Đại sứ mới active';

  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    if (!row || row.length === 0) continue;
    var rowStr = row.map(function(e) { return String(e).toLowerCase(); }).join(' ');

    if (rowStr.indexOf('cận đạt') >= 0) isHighlight = false;

    if ((rowStr.indexOf('tên') >= 0 || rowStr.indexOf('đại sứ') >= 0) &&
        (rowStr.indexOf('hệ số') >= 0 || rowStr.indexOf('doanh số') >= 0 || rowStr.indexOf('thực đạt') >= 0 || rowStr.indexOf('mục tiêu') >= 0)) {
      currentPairs = [];
      row.forEach(function(col, ci) {
        if (typeof col === 'string' && col.toLowerCase().trim().indexOf('tên') >= 0) {
          currentPairs.push({ nameIdx: ci, idIdx: -1, heSoIdx: -1, slActiveIdx: -1 });
        }
      });
      currentPairs.forEach(function(p) {
        for (var j = Math.max(0, p.nameIdx - 2); j <= p.nameIdx + 5 && j < row.length; j++) {
          var c = String(row[j]).toLowerCase().trim();
          if (c.indexOf('mã') >= 0) p.idIdx = j;
          if (c.indexOf('hệ số') >= 0 || c.indexOf('doanh số') >= 0 || c.indexOf('thực đạt') >= 0 || c.indexOf('mục tiêu cam kết') >= 0) { p.heSoIdx = j; heSoLabel = row[j].trim(); }
          if (c.indexOf('số lượng') >= 0 || c.indexOf('active') >= 0 || c.indexOf('đs mới active') >= 0 || c.indexOf('đại sứ mới') >= 0) { p.slActiveIdx = j; slActiveLabel = row[j].trim(); }
        }
      });
      if (sheetName.toLowerCase().indexOf('kỳ i') >= 0 && sheetName.toLowerCase().indexOf('quản lý xuất sắc') >= 0 && currentPairs.length > 0) {
        currentPairs[0].slActiveIdx = 4; // Cột E
        slActiveLabel = 'SL Đại sứ mới active';
      }
      continue;
    }

    if (currentPairs && currentPairs.length > 0) {
      var levelCol = String(row[0] || '').trim();
      if (levelCol.indexOf('Cấp') === 0) currentLevel = levelCol;

      currentPairs.forEach(function(p, pi) {
        var name = String(row[p.nameIdx] || '').trim();
        if (!name || name.toLowerCase().indexOf('tên') >= 0 || name.toLowerCase().indexOf('danh sách') >= 0) return;
        if (name.toLowerCase().indexOf('tổng') >= 0 || name.toLowerCase().indexOf('đại sứ') >= 0) return;

        var realId = (p.idIdx !== -1 && row[p.idIdx]) ? String(row[p.idIdx]) : 'u_' + r + '_' + p.nameIdx;
        var heSoStr = String(row[p.heSoIdx]).replace(/,/g, '');
        if (heSoStr.endsWith('%')) heSoStr = heSoStr.slice(0, -1);
        var heSo = parseFloat(heSoStr);
        var slActive = (p.slActiveIdx !== -1) ? parseFloat(String(row[p.slActiveIdx]).replace(/,/g, '')) : 0;
        if (isNaN(heSo)) return;
        if (isNaN(slActive)) slActive = 0;

        if (heSo > 0 || slActive > 0) {
          var targetKey = 'Cấp Nhóm';
          if (currentLevel.indexOf('Phòng') >= 0) targetKey = 'Cấp Phòng';
          if (currentLevel.indexOf('Khu vực') >= 0) targetKey = 'Cấp Khu vực';
          levels[targetKey].push({
            id: realId, name: name, score: heSo, score2: slActive,
            scoreLabel: heSoLabel, score2Label: slActiveLabel,
            highlight: (currentPairs.length > 1) ? (pi === 0) : isHighlight,
            region: String(row[3] || '').trim()
          });
        }
      });
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
      topRankers: eligible.slice(0, 3),
      otherRankers: eligible.slice(3).concat(almost),
      hasMultipleScores: true,
      scoreLabels: [heSoLabel, slActiveLabel]
    });
  });
}

// ============ GOLD AMBASSADOR SHEET ============
function parseGoldSheet(data, categoryType, rows, headerRow, headerRowIdx, sheetName, idx) {
  var nameIdx = -1, idIdx = -1, hvMoiIdx = -1, doanhSoIdx = -1;
  var hvMoiLabel = 'Số lượng HV mới', doanhSoLabel = 'Doanh số cá nhân';

  headerRow.forEach(function(col, ci) {
    if (typeof col !== 'string') return;
    var c = col.toLowerCase().trim();
    if (c.indexOf('tên') >= 0) nameIdx = ci;
    if (c.indexOf('mã') >= 0) idIdx = ci;
    if (c.indexOf('số lượng') >= 0 && c.indexOf('hv') >= 0) { hvMoiIdx = ci; hvMoiLabel = col.trim(); }
    if (c.indexOf('hv mới') >= 0 && hvMoiIdx === -1) { hvMoiIdx = ci; hvMoiLabel = col.trim(); }
    if (c.indexOf('doanh số') >= 0) { doanhSoIdx = ci; doanhSoLabel = col.trim(); }
  });

  if (nameIdx === -1 || (hvMoiIdx === -1 && doanhSoIdx === -1)) return;

  var ambassadors = [];
  for (var r = headerRowIdx + 1; r < rows.length; r++) {
    var row = rows[r];
    if (!row || row.length === 0) continue;
    var name = row[nameIdx];
    if (!name || typeof name !== 'string') continue;
    if (name.toLowerCase().indexOf('tổng') >= 0 || name.toLowerCase().indexOf('đại sứ') >= 0) continue;

    var realId = (idIdx !== -1 && row[idIdx]) ? String(row[idIdx]) : 'u_' + r;
    var hvMoi = (hvMoiIdx !== -1 && row[hvMoiIdx] != null) ? parseFloat(String(row[hvMoiIdx]).replace(/,/g, '')) : 0;
    var doanhSo = (doanhSoIdx !== -1 && row[doanhSoIdx] != null) ? parseFloat(String(row[doanhSoIdx]).replace(/,/g, '')) : 0;
    if (isNaN(hvMoi)) hvMoi = 0;
    if (isNaN(doanhSo)) doanhSo = 0;

    if (hvMoi > 0 || doanhSo > 0) {
      ambassadors.push({
        id: realId, name: name.trim(), score: hvMoi, score2: doanhSo,
        scoreLabel: hvMoiLabel, score2Label: doanhSoLabel
      });
    }
  }

  ambassadors.sort(function(a, b) { return b.score - a.score || (b.score2||0) - (a.score2||0); });
  if (ambassadors.length === 0) return;

  var catName = sheetName.trim().replace(/^Giải thưởng\s+/i, '').replace(/^EGC\s*-\s*/, '');
  if (catName.toLowerCase().indexOf('vàng q') >= 0) {
    if (catName.toLowerCase().indexOf('ii') >= 0 || catName.indexOf('2') >= 0) {
      catName = 'Đại sứ Vàng Quý II/2026';
    } else {
      catName = 'Đại sứ Vàng Quý I/2026';
    }
  }
  catName = catName.charAt(0).toUpperCase() + catName.slice(1);

  ambassadors.forEach(function(a) {
    if (catName.toLowerCase().indexOf('quý ii') >= 0 || catName.toLowerCase().indexOf('quý 2') >= 0) {
      a.highlight = a.score >= 25;
    } else {
      a.highlight = a.score >= 15 && (a.score2 || 0) >= 150000000;
    }
  });

  var eligible = ambassadors.filter(function(a) { return a.highlight; });
  var almost = ambassadors.filter(function(a) { return !a.highlight; });

  data[categoryType].push({
    categoryId: 'cat_' + idx, categoryName: catName,
    topRankers: eligible.slice(0, 3),
    otherRankers: eligible.slice(3).concat(almost),
    hasMultipleScores: true,
    scoreLabels: [hvMoiLabel, doanhSoLabel]
  });
}

// ============ RECRUITMENT SHEET ============
function parseRecruitmentSheet(data, categoryType, rows, headerRow, headerRowIdx, sheetName, idx) {
  var n1ActiveLabel = 'SL N-1 active', n1RevenueLabel = 'DS N-1 mới';
  var pairs = [];
  headerRow.forEach(function(col, ci) {
    if (typeof col === 'string' && col.toLowerCase().trim().indexOf('tên') >= 0) {
      pairs.push({ nameIdx: ci, idIdx: -1, n1ActiveIdx: -1, n1RevenueIdx: -1 });
    }
  });

  pairs.forEach(function(p) {
    for (var j = Math.max(0, p.nameIdx - 2); j <= p.nameIdx + 5 && j < headerRow.length; j++) {
      var c = String(headerRow[j]).toLowerCase().trim();
      if (c.indexOf('mã') >= 0) p.idIdx = j;
      if ((c.indexOf('số lượng') >= 0 && c.indexOf('n-1') >= 0) || c.indexOf('sl đại sứ mới psdt') >= 0 || c.indexOf('sl đại sứ mới') >= 0) p.n1ActiveIdx = j;
      if ((c.indexOf('doanh số') >= 0 && c.indexOf('n-1') >= 0) || c.indexOf('doanh thu đs mới') >= 0) p.n1RevenueIdx = j;
    }
  });

  if (pairs.length === 0) return;

  var ambassadors = [];
  var isHighlight = true;
  for (var r = headerRowIdx + 1; r < rows.length; r++) {
    var row = rows[r];
    if (!row || row.length === 0) continue;
    var rowStr = row.map(function(e) { return String(e).toLowerCase(); }).join(' ');
    if (rowStr.indexOf('cận đạt') >= 0) isHighlight = false;

    pairs.forEach(function(p, pi) {
      var name = row[p.nameIdx];
      if (!name || typeof name !== 'string') return;
      if (name.toLowerCase().indexOf('tổng') >= 0 || name.toLowerCase().indexOf('đại sứ') >= 0) return;

      var realId = (p.idIdx !== -1 && row[p.idIdx]) ? String(row[p.idIdx]) : 'u_' + r + '_' + p.nameIdx;
      var n1Active = (p.n1ActiveIdx !== -1 && row[p.n1ActiveIdx] != null) ? parseFloat(String(row[p.n1ActiveIdx]).replace(/,/g, '')) : 0;
      var n1Revenue = (p.n1RevenueIdx !== -1 && row[p.n1RevenueIdx] != null) ? parseFloat(String(row[p.n1RevenueIdx]).replace(/,/g, '')) : 0;
      if (isNaN(n1Active)) n1Active = 0;
      if (isNaN(n1Revenue)) n1Revenue = 0;

      if (n1Active > 0 || n1Revenue > 0) {
        ambassadors.push({
          id: realId, name: name.trim(), score: n1Active, score2: n1Revenue,
          scoreLabel: n1ActiveLabel, score2Label: n1RevenueLabel,
          highlight: (pairs.length > 1) ? (pi === 0) : isHighlight
        });
      }
    });
  }

  ambassadors.sort(function(a, b) { return (b.score2||0) - (a.score2||0) || b.score - a.score; });
  if (ambassadors.length === 0) return;

  var catName = sheetName.trim().replace(/^Giải thưởng\s+/i, '');
  catName = catName.charAt(0).toUpperCase() + catName.slice(1);

  var eligible = ambassadors.filter(function(a) { return a.highlight !== false; });
  var almost = ambassadors.filter(function(a) { return a.highlight === false; });

  data[categoryType].push({
    categoryId: 'cat_' + idx, categoryName: catName,
    topRankers: eligible.slice(0, 3),
    otherRankers: eligible.slice(3).concat(almost),
    hasMultipleScores: true,
    scoreLabels: [n1ActiveLabel, n1RevenueLabel]
  });
}

// ============ NORMAL SHEET ============
function parseNormalSheet(data, categoryType, rows, headerRow, headerRowIdx, sheetName, idx) {
  var pairs = [];
  headerRow.forEach(function(col, ci) {
    if (typeof col === 'string' && col.toLowerCase().indexOf('tên') >= 0) {
      var scoreIdx = -1, score2Idx = -1, idIdx2 = -1;
      var scoreLabel = '', score2Label = '';
      for (var j = 0; j < headerRow.length; j++) {
        if (typeof headerRow[j] === 'string' && headerRow[j].toLowerCase().indexOf('mã') >= 0 && Math.abs(j - ci) <= 3) {
          idIdx2 = j; break;
        }
      }
      for (var j2 = ci + 1; j2 <= ci + 5 && j2 < headerRow.length; j2++) {
        var c = String(headerRow[j2]).toLowerCase();
        if (c.indexOf('số lượng') >= 0 || c.indexOf('sl') >= 0 || c.indexOf('tuyển sinh') >= 0 || c.indexOf('hv mới') >= 0) {
          if (score2Idx === -1) { score2Idx = j2; score2Label = String(headerRow[j2]).trim(); }
        } else if (c.indexOf('doanh số') >= 0 || c.indexOf('doanh thu') >= 0 || c.indexOf('tuyển dụng') >= 0 || c.indexOf('điểm') >= 0 ||
            c.indexOf('tổng số') >= 0 || c.indexOf('hệ số') >= 0 || c.indexOf('thành tích') >= 0 ||
            c.indexOf('thực đạt') >= 0 || c.indexOf('mục tiêu') >= 0) {
          if (scoreIdx === -1) { scoreIdx = j2; scoreLabel = String(headerRow[j2]).trim(); }
        }
      }
      if (scoreIdx === -1 && score2Idx !== -1) { scoreIdx = score2Idx; scoreLabel = score2Label; score2Idx = -1; }
      if (scoreIdx !== -1) pairs.push({ nameIdx: ci, scoreIdx: scoreIdx, scoreLabel: scoreLabel, score2Idx: score2Idx, score2Label: score2Label, idIdx: idIdx2 });
    }
  });

  if (pairs.length === 0) {
    var nIdx = -1, sIdx = -1, s2Idx = -1, iIdx = -1;
    var sLabel = '', s2Label = '';
    headerRow.forEach(function(col, ci) {
      if (typeof col === 'string') {
        var c = col.toLowerCase();
        if (nIdx === -1 && c.indexOf('tên') >= 0) nIdx = ci;
        else if (s2Idx === -1 && (c.indexOf('số lượng') >= 0 || c.indexOf('sl') >= 0 || c.indexOf('tuyển sinh') >= 0 || c.indexOf('hv mới') >= 0)) { s2Idx = ci; s2Label = col.trim(); }
        else if (sIdx === -1 && (c.indexOf('doanh số') >= 0 || c.indexOf('doanh thu') >= 0 || c.indexOf('điểm') >= 0 || c.indexOf('thành tích') >= 0 || c.indexOf('thực đạt') >= 0 || c.indexOf('mục tiêu') >= 0)) { sIdx = ci; sLabel = col.trim(); }
        else if (iIdx === -1 && c.indexOf('mã') >= 0) iIdx = ci;
      }
    });
    if (sIdx === -1 && s2Idx !== -1) { sIdx = s2Idx; sLabel = s2Label; s2Idx = -1; }
    if (nIdx !== -1 && sIdx !== -1) {
      pairs.push({ nameIdx: nIdx, scoreIdx: sIdx, scoreLabel: sLabel, score2Idx: s2Idx, score2Label: s2Label, idIdx: iIdx !== -1 ? iIdx : nIdx - 1 });
    }
  }

  if (pairs.length === 0) return;

  // Challenge side-by-side
  if (categoryType === 'challenge' && pairs.length > 1) {
    pairs.forEach(function(p, pi) {
      var amb = [];
      for (var r = headerRowIdx + 1; r < rows.length; r++) {
        var row = rows[r];
        if (!row || row.length === 0) continue;
        var name = row[p.nameIdx];
        if (!name || typeof name !== 'string') continue;
        var nl = name.toLowerCase();
        if (nl.indexOf('tổng') >= 0 || nl.indexOf('đại sứ') >= 0 || nl.indexOf('chưa có') >= 0) continue;
        var numScore = parseFloat(String(row[p.scoreIdx]).replace(/,/g, ''));
        if (isNaN(numScore)) numScore = 0;
        var numScore2 = 0;
        if (p.score2Idx !== -1) {
          numScore2 = parseFloat(String(row[p.score2Idx]).replace(/,/g, ''));
          if (isNaN(numScore2)) numScore2 = 0;
        }
        if (numScore <= 0 && numScore2 <= 0) continue;
        var realId = (p.idIdx !== -1 && row[p.idIdx]) ? String(row[p.idIdx]) : 'u_' + r + '_' + p.nameIdx;
        amb.push({ id: realId, name: name.trim(), score: numScore, score2: numScore2 });
      }
      amb.sort(function(a, b) { return b.score - a.score || (b.score2||0) - (a.score2||0); });
      if (amb.length === 0) return;

      var subTitle = '';
      var titleRow = rows[1] || rows[0];
      if (titleRow) {
        for (var ci = p.nameIdx; ci >= Math.max(0, p.nameIdx - 3); ci--) {
          if (titleRow[ci] && typeof titleRow[ci] === 'string' && titleRow[ci].trim().length > 5) {
            subTitle = String(titleRow[ci]).trim().replace(/\n/g, ' ');
            break;
          }
        }
      }
      var catName = subTitle || sheetName.trim();
      catName = catName.replace(/^DANH SÁCH\s+/i, '').replace(/\s*ĐỦ ĐIỀU KIỆN.*/i, '').replace(/\s*NHẬN THƯỞNG.*/i, '');
      if (catName === catName.toUpperCase()) {
        catName = catName.toLowerCase().replace(/(^|\s)(đại|sứ|mới|tháng|quý|doanh|số|từ|triệu|trong|đạt|mốc|cá|nhân)/g, function(m) { return m.charAt(0) + m.slice(1); })
          .replace(/^./, function(c) { return c.toUpperCase(); });
      }
      var scoreLabels = undefined;
      if (amb.some(function(a) { return a.score2 !== undefined && a.score2 > 0; })) {
        scoreLabels = [p.scoreLabel, p.score2Label];
      }
      data.challenge.push({
        categoryId: 'cat_' + idx + '_p' + pi, categoryName: catName,
        topRankers: amb.slice(0, 3), otherRankers: amb.slice(3),
        hasMultipleScores: scoreLabels !== undefined, scoreLabels: scoreLabels
      });
    });
    return;
  }

  // Normal single table
  var ambassadors = [];
  var isHighlight = true;
  for (var r = headerRowIdx + 1; r < rows.length; r++) {
    var row = rows[r];
    if (!row || row.length === 0) continue;
    var rowStr = row.map(function(e) { return String(e).toLowerCase(); }).join(' ');
    if (rowStr.indexOf('cận đạt') >= 0) isHighlight = false;

    pairs.forEach(function(p, pi) {
      var name = row[p.nameIdx];
      if (!name || typeof name !== 'string') return;
      if (name.toLowerCase().indexOf('tổng') >= 0 || name.toLowerCase().indexOf('đại sứ') >= 0) return;
      var numScore = parseFloat(String(row[p.scoreIdx]).replace(/,/g, ''));
      if (isNaN(numScore)) numScore = 0;
      var numScore2 = 0;
      if (p.score2Idx !== -1) {
        numScore2 = parseFloat(String(row[p.score2Idx]).replace(/,/g, ''));
        if (isNaN(numScore2)) numScore2 = 0;
      }
      if (numScore <= 0 && numScore2 <= 0) return;
      var realId = (p.idIdx !== -1 && row[p.idIdx]) ? String(row[p.idIdx]) : 'u_' + r + '_' + p.nameIdx;
      ambassadors.push({
        id: realId, name: name.trim(), score: numScore, score2: numScore2,
        highlight: (pairs.length > 1) ? (pi === 0) : isHighlight
      });
    });
  }

  ambassadors.sort(function(a, b) { return b.score - a.score || (b.score2||0) - (a.score2||0); });
  if (ambassadors.length === 0) return;

  var catName = cleanCategoryName(sheetName, categoryType);
  var eligible = ambassadors.filter(function(a) { return a.highlight !== false; });
  var almost = ambassadors.filter(function(a) { return a.highlight === false; });
  
  var scoreLabels = undefined;
  if (ambassadors.some(function(a) { return a.score2 !== undefined && a.score2 > 0; })) {
    scoreLabels = [pairs[0].scoreLabel, pairs[0].score2Label];
  }

  data[categoryType].push({
    categoryId: 'cat_' + idx, categoryName: catName,
    topRankers: eligible.slice(0, 3), otherRankers: eligible.slice(3).concat(almost),
    hasMultipleScores: scoreLabels !== undefined, scoreLabels: scoreLabels
  });
}

// ============ STACKED SHEET ============
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
