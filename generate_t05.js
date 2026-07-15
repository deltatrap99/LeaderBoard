import fs from 'fs';

const csv = fs.readFileSync('sheet_t5.csv', 'utf8');
const lines = csv.split('\n').map(l => l.trim()).filter(l => l);

let isData = false;
const entries = [];

for (const line of lines) {
  if (line.includes('Mã Đại sứ')) {
    isData = true;
    continue;
  }
  if (!isData) continue;
  const parts = line.split(',');
  if (parts.length < 6) continue;
  const ma = parts[1].trim();
  const ten = parts[2].trim();
  const doanhThu = parts[3].trim() + ' ₫';
  const l5 = parts[4].trim();
  const thuong = parts[5].trim() + ' ₫';
  entries.push({ cells: [ma, ten, doanhThu, l5, thuong] });
}

const tsCode = `import { ResultsData } from './resultsData';

export const t05ResultsData: ResultsData = {
  mainTitle: 'Kết quả Thi đua Tháng 05/2026',
  sections: [
    {
      id: 'but-pha-vuot-gioi-han',
      title: 'Thưởng Bứt Phá Vượt Giới Hạn',
      columns: ['Mã Đại sứ', 'Tên Đại sứ', 'Doanh thu', 'Số L5', 'Thưởng'],
      entries: ${JSON.stringify(entries, null, 2)}
    }
  ]
};
`;

fs.writeFileSync('src/data/t05Results.ts', tsCode);
console.log('Done!');
