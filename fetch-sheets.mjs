import * as xlsx from 'xlsx';

async function run() {
  const url = 'https://docs.google.com/spreadsheets/d/1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs/export?format=xlsx';
  console.log('Fetching:', url);
  try {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const wb = xlsx.read(buf);
    console.log('SHEETS:', wb.SheetNames);
    const firstSheet = wb.Sheets[wb.SheetNames[0]];
    console.log('FIRST SHEET:', xlsx.utils.sheet_to_json(firstSheet, {header: 1}).slice(0, 10));
    
    // Also log second sheet if any
    if (wb.SheetNames.length > 1) {
       console.log('SECOND SHEET:', xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[1]], {header: 1}).slice(0, 5));
    }
  } catch(e) {
    console.error('Error:', e);
  }
}
run();
