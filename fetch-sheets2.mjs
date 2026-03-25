import * as xlsx from 'xlsx';
async function run() {
  const url = 'https://docs.google.com/spreadsheets/d/1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs/export?format=xlsx';
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const wb = xlsx.read(buf);
  console.log('SHEETS:', JSON.stringify(wb.SheetNames));
  // print third sheet
  if(wb.SheetNames.length > 2) {
    const s = wb.Sheets[wb.SheetNames[2]];
    console.log('THIRD SHEET:', JSON.stringify(xlsx.utils.sheet_to_json(s, {header: 1}).slice(0, 5)));
  }
}
run();
