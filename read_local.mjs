import * as xlsx from 'xlsx';
import fs from 'fs';

const buf = fs.readFileSync('sheet_temp.xlsx');
const wb = xlsx.read(buf, {type: 'buffer'});
console.log('Sheets:', wb.SheetNames.join(', '));
if (wb.SheetNames.includes('Diễn giải Tháng 5')) {
  const sheet = wb.Sheets['Diễn giải Tháng 5'];
  const rows = xlsx.utils.sheet_to_json(sheet, {header: 1});
  console.log('=== Diễn giải Tháng 5 ===');
  for (let i = 0; i < Math.min(200, rows.length); i++) {
    if (rows[i] && rows[i].some(c => c)) {
      console.log(`[${i}]`, rows[i].join(' | '));
    }
  }
}
