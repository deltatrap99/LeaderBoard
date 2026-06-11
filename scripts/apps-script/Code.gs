// ==================================================
// Google Apps Script — Leaderboard JSON API
// Deploy as Web App: doGet(e) returns JSON
// ==================================================

var SPREADSHEET_ID = '1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs';

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'leaderboard';
  var result;
  if (action === 'results') {
    result = getResultsData();
  } else {
    result = getLeaderboardData();
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============ HELPERS ============

function categorizeSheet(name) {
  var n = name.toLowerCase();
  if ((n.indexOf('trang tính') >= 0 && ['trang tính20','trang tính25','trang tính26','trang tính29','trang tính30'].indexOf(n) < 0) ||
      n.indexOf('mục lục') >= 0 || n.indexOf('index') >= 0 || n.indexOf('diễn giải') >= 0) return null;
  if (n.indexOf('giải thưởng quý') >= 0 && n.indexOf('tiêu biểu') < 0 && n.indexOf('xuất sắc') < 0) return null;
  if (/tháng\s*0?[345]/.test(n) || n.indexOf('05.2026') >= 0 || n.indexOf('t5') >= 0 || n === 'trang tính20') return null;
  if (n.indexOf('challenge') >= 0 || n.indexOf('cá nhân') >= 0) return null;

  if (['trang tính25','trang tính26','trang tính29','trang tính30'].indexOf(n) >= 0) return 'quarter';
  if (n.indexOf('tháng') >= 0 || /t\d{1,2}(?!\w)/.test(n) || n.indexOf('tiêu biểu t') >= 0 || /\b\d{2}\.2026\b/.test(n)) return 'month';
  if (n.indexOf('quý') >= 0 || n.indexOf('vàng q') >= 0 || n.indexOf('tiêu biểu q') >= 0 || n.indexOf('ii.2026') >= 0) return 'quarter';
  if (n.indexOf('kỳ') >= 0 || n.indexOf('k1') >= 0 || n.indexOf('k 1') >= 0 || n.indexOf('qlxs') >= 0 || n.indexOf('giáo d') >= 0 ||
      (n.indexOf('quản lý') >= 0 && n.indexOf('tuyển dụng') < 0 && n !== 'trang tính20' && n !== 'trang tính29')) return 'semester';
  return 'month';
}

function isRecruitment(name) {
  var n = name.toLowerCase().trim();
  return n.indexOf('tuyển dụng') >= 0 || n.indexOf('quản lý tuyển') >= 0 || n === 'trang tính20' || n === 'trang tính29';
}

function isGoldAmbassador(name) {
  var n = name.toLowerCase().trim();
  return n.indexOf('vàng') >= 0 || n.indexOf('egc') >= 0 || n === 'trang tính25' || n === 'trang tính26';
}

function isManager(name) {
  var n = name.toLowerCase().trim();
  if (n.indexOf('tuyển dụng') >= 0 || n === 'trang tính20' || n === 'trang tính29') return false;
  return ((n.indexOf('tiêu biểu') >= 0 || n.indexOf('xuất sắc') >= 0) && n.indexOf('quản lý') >= 0) ||
    n.indexOf('qlxs') >= 0 || n === 'trang tính30';
}

function getSheetBaseName(name) {
  return name.toLowerCase()
    .replace(/\s*tháng\s*\d+.*$/i, '')
    .replace(/\s*quý\s*\d+.*$/i, '')
    .replace(/\s+[tqk]\d*\s*$/i, '')
    .replace(/\s+\d+\s*$/i, '')
    .replace(/\s+[tqk]\s*$/i, '')
    .trim();
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
  // Fallback
  for (var r2 = 0; r2 < Math.min(10, rows.length); r2++) {
    if (!rows[r2]) continue;
    var rowStr2 = rows[r2].map(function(c) { return String(c).toLowerCase(); }).join(' ');
    if ((rowStr2.indexOf('mã') >= 0 || rowStr2.indexOf('stt') >= 0 || rowStr2.indexOf('nhóm') >= 0) &&
        (rowStr2.indexOf('đại sứ') >= 0 || rowStr2.indexOf('doanh số') >= 0 || rowStr2.indexOf('hệ số') >= 0)) {
      return r2;
    }
  }
  return -1;
}

function cleanCategoryName(sheetName, categoryType) {
  var name = sheetName.trim();
  name = name.replace(/^(Giải thưởng|Thưởng)\s+/i, '');
  
  if (name.toLowerCase().endsWith('giáo d')) {
    name = name.slice(0, -6) + 'Giáo dục';
  } else if (name.toLowerCase().indexOf('giáo d ') >= 0 && name.toLowerCase().indexOf('giáo dục') < 0) {
    name = name.replace(/Giáo d\s/i, 'Giáo dục ');
  }
  if (categoryType === 'semester' && name.toLowerCase().indexOf('giáo dục') >= 0) {
    name = 'Đại sứ Giáo dục xuất sắc Kỳ I';
  }
  name = name.replace(/^EGC\s*-\s*/, '');
  if (name.toLowerCase().indexOf('vàng q') >= 0) {
    if (name.toLowerCase().indexOf('ii') >= 0 || name.indexOf('2') >= 0) {
      name = 'Đại sứ Vàng Quý II/2026';
    } else {
      name = 'Đại sứ Vàng Quý I/2026';
    }
  }
  name = name.replace(/tiêu biểu\s+T$/i, 'tiêu biểu');
  name = name.replace(/tiêu biểu\s+Q$/i, 'tiêu biểu');
  name = name.replace(/cấp q$/i, 'cấp Quản lý');
  name = name.charAt(0).toUpperCase() + name.slice(1);
  return name;
}
