const xlsx = require('xlsx');

async function run() {
  const url = 'https://docs.google.com/spreadsheets/d/1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs/export?format=xlsx';
  console.log('Fetching:', url);
  try {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const wb = xlsx.read(buf, { type: 'buffer' });
    
    for (const name of wb.SheetNames) {
      if (name.toLowerCase().includes('tiêu biểu')) {
        console.log(`\n\n=== SHEET: ${name} ===`);
        const sheet = wb.Sheets[name];
        const rows = xlsx.utils.sheet_to_json(sheet, {header: 1});
        rows.slice(0, 50).forEach((r, i) => console.log(`Row ${i}:`, r));
      }
    }
  } catch(e) {
    console.error('Error:', e);
  }
}
run();
