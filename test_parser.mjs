import fs from 'fs';
import { parse } from 'csv-parse/sync';

const csvData = fs.readFileSync('quarter1.csv', 'utf8');
const rows = parse(csvData, { skip_empty_lines: false });

let tables = [];
let r = 0;
while (r < rows.length) {
  let headerRowIdx = -1;
  for (; r < rows.length; r++) {
    if (!rows[r]) continue;
    const nonNullCells = rows[r].filter(c => c != null && String(c).trim() !== '');
    if (nonNullCells.length < 2) continue;
    const shortCells = rows[r].filter(c => c != null && typeof c === 'string' && c.trim().length > 0 && c.trim().length < 50);
    if (shortCells.length < 2) continue;
    
    const rowStr = shortCells.map(c => String(c).toLowerCase()).join(' ');
    if ((rowStr.includes('tên') || rowStr.includes('đại sứ') || rowStr.includes('họ và') || rowStr.includes('đs')) && 
        (rowStr.includes('mã') || rowStr.includes('doanh số') || rowStr.includes('thành tích') || rowStr.includes('n-1') || rowStr.includes('tuyển dụng') || rowStr.includes('active') || rowStr.includes('hv mới') || rowStr.includes('hệ số') || rowStr.includes('thực đạt') || rowStr.includes('mục tiêu'))) {
      headerRowIdx = r;
      break;
    }
  }

  if (headerRowIdx === -1) break;

  let title = "Unknown Table";
  for (let k = headerRowIdx - 1; k >= Math.max(0, headerRowIdx - 5); k--) {
    const nonNull = rows[k].filter(c => c != null && String(c).trim() !== '');
    if (nonNull.length > 0 && nonNull[0].length > 5) { // found a title
       title = nonNull.join(' ');
       break;
    }
  }

  console.log(`Found table: "${title}" at row ${headerRowIdx}`);
  
  // Skip to next empty row or next header
  r = headerRowIdx + 1;
  let endIdx = r;
  for (; endIdx < rows.length; endIdx++) {
     if (!rows[endIdx] || rows[endIdx].filter(c => c != null && String(c).trim() !== '').length === 0) {
         break;
     }
  }
  
  console.log(`Table ends at row ${endIdx}`);
  r = endIdx;
}
