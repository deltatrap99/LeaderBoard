import * as xlsx from 'xlsx';

async function run() {
  const url = 'https://docs.google.com/spreadsheets/d/1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs/export?format=xlsx';
  console.log('Fetching:', url);
  try {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const wb = xlsx.read(buf);
    const sheetName = 'Diễn giải Tháng 5';
    if (!wb.SheetNames.includes(sheetName)) {
      console.log('Sheet not found. Available:', wb.SheetNames);
      return;
    }
    const sheet = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error('Error:', e);
  }
}
run();
