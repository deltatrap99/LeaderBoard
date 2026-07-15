const fs = require('fs');
const csv = fs.readFileSync('t06_leaderboard.csv', 'utf8');
const rows = csv.split('\n').map(l => l.split(','));

// find row index containing QUẢN LÝ TUYỂN DỤNG
let startIdx = 0;
for(let i=0; i<rows.length; i++) {
  if (rows[i][0] && rows[i][0].includes('QUẢN LÝ TUYỂN DỤNG')) {
    startIdx = i; break;
  }
}

let bRows = rows.slice(startIdx, startIdx + 15);
let headerRowIdx = 3; // The row with Mã Đại sứ
let headerRow = bRows[headerRowIdx];

var pairs = [];
headerRow.forEach(function(col, ci) {
  if (typeof col !== 'string') return;
  var c = col.toLowerCase().trim();
  if (c.indexOf('tên') >= 0) {
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

console.log("PAIRS:", pairs);

var ambassadors = [];
for (var r = headerRowIdx + 1; r < bRows.length; r++) {
  var row = bRows[r];
  pairs.forEach(function(p, pi) {
    var name = row[p.nameIdx];
    if (!name || typeof name !== 'string') return;
    if (name.toLowerCase().indexOf('tổng') >= 0 || name.toLowerCase().indexOf('đại sứ') >= 0) return;
    
    var realId = (p.idIdx !== -1 && row[p.idIdx]) ? String(row[p.idIdx]) : 'u_' + r;
    var n1Active = (p.n1ActiveIdx !== -1 && row[p.n1ActiveIdx] != null) ? parseFloat(String(row[p.n1ActiveIdx]).replace(/,/g, '')) : 0;
    var n1Revenue = (p.n1RevenueIdx !== -1 && row[p.n1RevenueIdx] != null) ? parseFloat(String(row[p.n1RevenueIdx]).replace(/,/g, '')) : 0;
    if (isNaN(n1Active)) n1Active = 0;
    if (isNaN(n1Revenue)) n1Revenue = 0;

    if (n1Active > 0 || n1Revenue > 0) {
      ambassadors.push({
        id: realId, name: name.trim(), score: n1Active, score2: n1Revenue,
        highlight: pi === 0 // 0 is left (eligible), 1 is right (cận đạt)
      });
    }
  });
}
console.log(ambassadors);
