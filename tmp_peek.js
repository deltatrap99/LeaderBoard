import * as xlsx from 'xlsx';
import fs from 'fs';

async function test() {
  const url = 'https://docs.google.com/spreadsheets/d/1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs/export?format=xlsx';
  const r = await fetch(url);
  const buf = await r.arrayBuffer();
  const wb = xlsx.read(buf, { type: 'array' });
  let out = '';
  for (const name of wb.SheetNames) {
      if (name.includes('Vàng Q')) {
          const sheet = wb.Sheets[name];
          const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
          out += `\n--- Sheet: ${name} ---\n`;
          for(let r=0; r<6; r++) out += `Row ${r}: ${JSON.stringify(rows[r])}\n`;
      }
  }
  fs.writeFileSync('header_out.txt', out);
}
test();
