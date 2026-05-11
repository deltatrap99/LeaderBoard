// ==================================================
// Results Data Parser (Apps Script)
// ==================================================

function getResultsData() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets = ss.getSheets();
  var targetSheet = null;

  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().indexOf('Giải thưởng Quý') >= 0) {
      targetSheet = sheets[i];
      break;
    }
  }

  if (!targetSheet) {
    return { mainTitle: 'Kết quả Thi đua Quý I/2026', sections: [] };
  }

  var rows = targetSheet.getDataRange().getValues();
  var mainTitle = (rows[0] && rows[0][0]) ? String(rows[0][0]).trim() : 'KẾT QUẢ THI ĐUA QUÝ I/2026';
  var sections = [];
  var r = 1; // skip main title row

  while (r < rows.length) {
    var row = rows[r];
    if (!row || row.length === 0) { r++; continue; }

    var nonNull = row.filter(function(c) { return c != null && String(c).trim() !== ''; });
    if (nonNull.length === 0) { r++; continue; }

    // Detect header rows
    var shortCells = row.filter(function(c) {
      return c != null && typeof c === 'string' && c.trim().length > 0 && c.trim().length < 60;
    });
    var isHeader = shortCells.length >= 2 &&
      row.some(function(c) { return typeof c === 'string' && (c.toLowerCase().indexOf('tên') >= 0 || c.toLowerCase().indexOf('họ và') >= 0); }) &&
      row.some(function(c) { return typeof c === 'string' && (c.toLowerCase().indexOf('mã') >= 0 || c.toLowerCase().indexOf('doanh') >= 0 || c.toLowerCase().indexOf('thưởng') >= 0 || c.toLowerCase().indexOf('team') >= 0 || c.toLowerCase().indexOf('cấp bậc') >= 0); });

    if (!isHeader) { r++; continue; }

    // Find title above header
    var title = '';
    for (var k = r - 1; k >= Math.max(0, r - 5); k--) {
      if (!rows[k]) continue;
      var kNonNull = rows[k].filter(function(c) { return c != null && String(c).trim() !== ''; });
      if (kNonNull.length > 0) {
        var candidate = String(kNonNull[0]).trim();
        if (candidate.length > 3) { title = candidate; break; }
      }
    }
    if (!title) title = 'Hạng mục ' + (sections.length + 1);

    // Extract columns
    var columns = row.map(function(c) { return c != null ? String(c).trim().replace(/\n/g, ' ') : ''; })
      .filter(function(c) { return c.length > 0; });

    // Extract entries
    var entries = [];
    var isEmpty = false;
    var emptyMessage = '';
    var dr = r + 1;

    for (; dr < rows.length; dr++) {
      var dataRow = rows[dr];
      if (!dataRow) continue;
      var dataNonNull = dataRow.filter(function(c) { return c != null && String(c).trim() !== ''; });
      if (dataNonNull.length === 0) break;

      var firstCell = String(dataRow[0] || '').trim();
      if (firstCell.toLowerCase().indexOf('chưa có') >= 0 || firstCell.toLowerCase().indexOf('không có') >= 0) {
        isEmpty = true;
        emptyMessage = firstCell;
        dr++;
        break;
      }

      if (dataNonNull.length === 1 && firstCell.length > 10) break;

      var dataShortCells = dataRow.filter(function(c) { return c != null && typeof c === 'string' && c.trim().length > 0 && c.trim().length < 60; });
      if (dataShortCells.length >= 2) {
        var rs = dataShortCells.map(function(c) { return String(c).toLowerCase(); }).join(' ');
        if ((rs.indexOf('tên') >= 0 || rs.indexOf('họ và') >= 0) && (rs.indexOf('mã') >= 0 || rs.indexOf('doanh') >= 0 || rs.indexOf('thưởng') >= 0)) break;
      }

      var cells = [];
      for (var ci = 0; ci < columns.length; ci++) {
        cells.push(formatResultNumber(dataRow[ci]));
      }
      entries.push({ cells: cells });
    }

    sections.push({
      id: 'section_' + sections.length,
      title: cleanResultTitle(title),
      columns: columns,
      entries: entries,
      isEmpty: isEmpty,
      emptyMessage: emptyMessage
    });

    r = dr;
  }

  return { mainTitle: mainTitle, sections: sections };
}

function formatResultNumber(val) {
  if (val == null) return '';
  var s = String(val).trim();
  if (!s) return '';
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return s;
  var num = parseFloat(s.replace(/,/g, ''));
  if (!isNaN(num) && num > 999) {
    return num.toLocaleString('vi-VN');
  }
  return s;
}

function cleanResultTitle(raw) {
  return raw.trim().replace(/^\d+\.\s*/, '');
}
