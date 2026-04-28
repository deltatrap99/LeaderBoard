import * as xlsx from 'xlsx';

async function run() {
  const url = 'https://docs.google.com/spreadsheets/d/1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs/export?format=xlsx';
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const wb = xlsx.read(buf);
  
  // For the "tiêu biểu" sheets, check if they have data or are empty/old
  for (const idx of [11, 12]) {
    const name = wb.SheetNames[idx];
    const sheet = wb.Sheets[name];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n=== [${idx}] "${name}" (${rows.length} rows) ===`);
    for (let r = 0; r < Math.min(rows.length, 20); r++) {
      const row = rows[r];
      if (!row || row.every(c => c == null || String(c).trim() === '')) continue;
      const cells = row.map(c => c == null ? '' : String(c).trim()).filter(c => c);
      console.log(`  Row ${r}: ${cells.join(' | ')}`);
    }
  }
}
run();
