/**
 * Script to update the Quản lý tiêu biểu Quý II data in api_response.json
 * based on the latest Google Sheet CSV.
 */
import { readFileSync, writeFileSync } from 'fs';

// Parse the CSV data from the Google Sheet (gid=2104602919)
// Data parsed from: https://docs.google.com/spreadsheets/d/1LktWs8p4xbTToJJaEu2y6RBwj5W26daoVFKiKMNHhJs/edit?gid=2104602919

const scoreLabel = 'Hệ số % thực hiện mục tiêu';
const score2Label = 'Số lượng Đại sứ mới active';

// Eligible (Đủ điều kiện)
const eligible = {
  'Cấp Nhóm': [], // Chưa có Đại sứ đạt
  'Cấp Phòng': [
    { id: '2772', name: 'Nguyễn Thị Hảo', score: 5.2554, score2: 23, region: 'Trưởng phòng' },
    { id: '9960', name: 'Đường Thị Thương', score: 1.594, score2: 24, region: 'Trưởng phòng cấp cao' },
  ],
  'Cấp Khu vực': [
    { id: '2086', name: 'Lê Thanh Thúy', score: 2.240, score2: 37, region: 'GĐ khu vực' },
    { id: '10899', name: 'Nguyễn Thị Hường', score: 2.004, score2: 37, region: 'GĐ khu vực' },
  ],
};

// Almost (Cận đạt)
const almost = {
  'Cấp Nhóm': [
    { id: '12779', name: 'Nguyễn Minh Nguyệt', score: 2.5834, score2: 5, region: 'Trưởng nhóm' },
    { id: '10923', name: 'Vũ Oanh', score: 2.2160, score2: 6, region: 'Trưởng nhóm' },
    { id: '11303', name: 'Ngô Thị Thủy', score: 1.8766, score2: 7, region: 'Trưởng nhóm' },
    { id: '5792', name: 'Bùi Thị Hằng', score: 3.7328, score2: 5, region: 'Trưởng nhóm cấp cao' },
    { id: '3289', name: 'Nguyễn Thị Thu Hà', score: 2.7098, score2: 7, region: 'Trưởng nhóm cấp cao' },
    { id: '4588', name: 'Vũ Thị Luyến', score: 2.1384, score2: 6, region: 'Trưởng nhóm cấp cao' },
  ],
  'Cấp Phòng': [
    { id: '11126', name: 'Thái Vui', score: 2.7887, score2: 13, region: 'Trưởng phòng' },
    { id: '4249', name: 'Vũ Thị Mận', score: 1.893, score2: 7, region: 'Trưởng phòng' },
    { id: '10386', name: 'Le Vinh', score: 1.579, score2: 8, region: 'Trưởng phòng' },
    { id: '2121', name: 'Mai Thị Tố Nga', score: 2.090, score2: 18, region: 'Trưởng phòng cấp cao' },
    { id: '9769', name: 'Trần Thị Ngọc Dung', score: 2.039, score2: 9, region: 'Trưởng phòng cấp cao' },
  ],
  'Cấp Khu vực': [
    { id: '10911', name: 'Phạm Thị Huệ', score: 1.465, score2: 25, region: 'GĐ khu vực' },
  ],
};

// Build the three category entries
const levels = ['Cấp Nhóm', 'Cấp Phòng', 'Cấp Khu vực'];
const newCategories = levels.map((level, li) => {
  const elig = (eligible[level] || []).map(a => ({
    ...a, scoreLabel, score2Label, highlight: true,
  }));
  const alm = (almost[level] || []).map(a => ({
    ...a, scoreLabel, score2Label, highlight: false,
  }));

  const all = [...elig, ...alm].sort((a, b) => b.score - a.score || b.score2 - a.score2);
  const topRankers = all.filter(a => a.highlight).slice(0, 3);
  const otherRankers = all.filter(a => a.highlight).slice(3).concat(all.filter(a => !a.highlight));

  return {
    categoryId: `cat_26_lv_${li}`,
    categoryName: `Giải thưởng Quản lý tiêu biểu Quý II/2026 - ${level}`,
    topRankers,
    otherRankers,
    hasMultipleScores: true,
    scoreLabels: [scoreLabel, score2Label],
  };
});

// Read api_response.json
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const apiPath = join(__dirname, '..', 'api_response.json');
const apiData = JSON.parse(readFileSync(apiPath, 'utf8'));

// Replace the old cat_26 entries in the quarter array
apiData.quarter = apiData.quarter.filter(cat => !cat.categoryId.startsWith('cat_26'));
// Insert at the end (or find original position)
apiData.quarter.push(...newCategories);

writeFileSync(apiPath, JSON.stringify(apiData));
console.log('✅ Updated api_response.json with new Quản lý tiêu biểu Quý II data');
console.log('Levels updated:');
newCategories.forEach(c => {
  console.log(`  ${c.categoryName}: ${c.topRankers.length} eligible, ${c.otherRankers.length} others`);
});
