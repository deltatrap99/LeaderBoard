import fs from 'fs';
import { parse } from 'csv-parse/sync';

function formatNumber(str) {
  return parseFloat(String(str || '0').replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, '')) || 0;
}

function parseFile(filename, categoryType) {
  const csvData = fs.readFileSync(filename, 'utf8');
  const rows = parse(csvData, { skip_empty_lines: false });
  const results = [];

  let r = 0;
  while (r < rows.length) {
    let headerRowIdx = -1;
    for (; r < rows.length; r++) {
      if (!rows[r]) continue;
      const shortCells = rows[r].filter(c => c != null && typeof c === 'string' && c.trim().length > 0 && c.trim().length < 50);
      if (shortCells.length < 2) continue;
      
      const rowStr = shortCells.map(c => String(c).toLowerCase()).join(' ');
      if ((rowStr.includes('tên') || rowStr.includes('đại sứ') || rowStr.includes('họ và') || rowStr.includes('đs')) && 
          (rowStr.includes('mã') || rowStr.includes('doanh số') || rowStr.includes('thành tích') || rowStr.includes('n-1') || rowStr.includes('tuyển dụng') || rowStr.includes('active') || rowStr.includes('hv mới') || rowStr.includes('hệ số') || rowStr.includes('thực đạt') || rowStr.includes('mục tiêu') || rowStr.includes('doanh thu') || rowStr.includes('số hv live') || rowStr.includes('số đs'))) {
        headerRowIdx = r;
        break;
      }
    }

    if (headerRowIdx === -1) break;

    const headerRow = rows[headerRowIdx];
    let groups = [];
    let currentGroup = null;
    
    for (let c = 0; c < headerRow.length; c++) {
      let h = String(headerRow[c]).toLowerCase().trim();
      if (!h) continue;
      
      if (h.includes('mã') || h === 'stt' || h === 'chưa có đại sứ đạt') {
        if (currentGroup && currentGroup.nameCol !== -1) {
          groups.push(currentGroup);
        }
        currentGroup = { idCol: h.includes('mã') ? c : -1, nameCol: -1, dataCols: [], startCol: c, isUpdating: h === 'chưa có đại sứ đạt', topCol: -1 };
      } else if (h.includes('họ') || h.includes('tên') || h === 'đại sứ') {
        if (!currentGroup || currentGroup.nameCol !== -1) {
           if (currentGroup) groups.push(currentGroup);
           currentGroup = { idCol: -1, nameCol: c, dataCols: [], startCol: c, topCol: -1 };
        } else {
           currentGroup.nameCol = c;
        }
      } else if (currentGroup && currentGroup.nameCol !== -1) {
         let headerStr = String(headerRow[c]).trim();
         let maybeTitle = headerRowIdx >= 2 ? String(rows[headerRowIdx - 2][0]).trim().toLowerCase() : '';
         if (headerStr === 'Vùng' && maybeTitle.includes('quản lý tuyển dụng xuất sắc')) {
             headerStr = 'Team';
         }
         if (!headerStr.toLowerCase().includes('thưởng')) {
             currentGroup.dataCols.push({ colIndex: c, label: headerStr });
         }
         if (h === 'top' || h === 'hạng') currentGroup.topCol = c;
      }
    }
    if (currentGroup && currentGroup.nameCol !== -1) {
       groups.push(currentGroup);
    }

    // find end of table
    let endIdx = headerRowIdx + 1;
    for (; endIdx < rows.length; endIdx++) {
       if (!rows[endIdx] || rows[endIdx].filter(c => c != null && String(c).trim() !== '').length === 0) {
           break;
       }
    }
    
    // For each group, find its title and status by looking upwards
    groups.forEach(g => {
        g.ambassadors = [];
        let groupTitle = "Unknown Table";
        let statusText = "đủ điều kiện xét giải";
        let foundMainTitle = false;
        
        for (let k = headerRowIdx - 1; k >= Math.max(0, headerRowIdx - 15); k--) {
            const rowText = rows[k] ? String(rows[k][g.startCol] || rows[k][g.startCol-1] || rows[k][0] || '').trim() : '';
            if (!rowText) continue;
            
            let lRowText = rowText.toLowerCase();
            if (lRowText.includes('danh sách đủ điều kiện')) statusText = 'đủ điều kiện xét giải';
            else if (lRowText.includes('cận đạt') || lRowText.includes('gần đạt') || lRowText.includes('chưa đủ điều kiện')) statusText = 'chưa đủ điều kiện xét giải';
            else if (lRowText.includes('đua top')) statusText = 'đua top';
            else if (rowText.length > 5 && !lRowText.includes('cơ chế thưởng') && !lRowText.startsWith('-')) {
                groupTitle = rowText;
                foundMainTitle = true;
            }
            
            // If we found a title, but it's clearly a subtitle, keep looking
            if (foundMainTitle) {
                // If it's a known main title structure, stop looking
                if (groupTitle.includes('1.') || groupTitle.includes('2.') || groupTitle.includes('3.') || groupTitle.includes('4.') || groupTitle.includes('GIẢI') || groupTitle.includes('THƯỞNG') || groupTitle.includes('TOP')) {
                    break;
                }
            }
        }
        g.title = groupTitle;
        g.status = statusText;
    });

    // Group the groups by their main title!
    let categoriesMap = new Map();
    groups.forEach(g => {
        if (!categoriesMap.has(g.title)) {
            categoriesMap.set(g.title, {
                title: g.title,
                groups: []
            });
        }
        categoriesMap.get(g.title).groups.push(g);
    });

    for (let [title, cat] of categoriesMap) {
        let ambassadors = [];
        
        cat.groups.forEach(g => {
            for (let j = headerRowIdx + 1; j < endIdx; j++) {
                const row = rows[j];
                const name = row[g.nameCol] ? String(row[g.nameCol]).trim() : '';
                if (!name || name.toLowerCase().includes('chưa có đại sứ')) continue;
                
                let ambassador = {
                    id: g.idCol !== -1 && row[g.idCol] ? String(row[g.idCol]).trim() : '',
                    name: name,
                    highlight: g.status === 'đủ điều kiện xét giải',
                    status: g.status,
                    columns: []
                };
                
                let mainScoreAdded = false;
                g.dataCols.forEach(col => {
                    let val = row[col.colIndex];
                    if (val == null || String(val).trim() === '') val = '';
                    else val = String(val).trim();
                    
                    ambassador.columns.push({ label: col.label, value: val });
                    
                    let hlower = col.label.toLowerCase();
                    if (!mainScoreAdded && (hlower.includes('doanh số') || hlower.includes('doanh thu') || hlower.includes('thành tích') || hlower.includes('thực đạt') || hlower.includes('active') || hlower.includes('số hv') || hlower.includes('số đs'))) {
                        ambassador.score = formatNumber(val);
                        ambassador.scoreLabel = col.label;
                        mainScoreAdded = true;
                    } else if (ambassador.score2 === undefined && 
                              (hlower.includes('số lượng') || hlower.includes('active') || hlower.includes('doanh số') || hlower.includes('thực đạt') || hlower.includes('số hv') || hlower.includes('số đs') || hlower.includes('ngày tham gia'))) {
                        ambassador.score2 = hlower.includes('ngày tham gia') ? val : formatNumber(val);
                        ambassador.score2Label = col.label;
                    }
                    if (hlower.includes('chức vụ') || hlower.includes('team') || hlower.includes('cấp') || hlower.includes('khu vực')) {
                        ambassador.region = hlower.includes('team') ? (val.toLowerCase().startsWith('team') ? val : 'Team ' + val) : val;
                    }
                });

                if (g.topCol !== -1 && row[g.topCol]) {
                    ambassador.rank = parseInt(String(row[g.topCol]).replace(/[^0-9]/g, ''));
                }
                
                // User asked to remove "đua top" note for Quý III and Kỳ II
                if (categoryType === 'quarter' || categoryType === 'semester') {
                    if (ambassador.status === 'đua top') {
                        ambassador.status = undefined;
                        ambassador.highlight = true;
                        ambassador.hideBadge = true;
                    } else if (categoryType === 'semester') {
                        ambassador.hideBadge = true;
                    }
                    if (categoryType === 'quarter' && title.toLowerCase().includes('top 3 đại sứ')) {
                         ambassador.hideBadge = true;
                    }
                    // User requested removing the Team info below the name for Quý III and Kỳ II
                    delete ambassador.region;
                }

                if (ambassador.score === undefined && ambassador.columns.length > 0) {
                    ambassador.score = formatNumber(ambassador.columns[0].value);
                    ambassador.scoreLabel = ambassador.columns[0].label;
                }

                ambassadors.push(ambassador);
            }
        });

        let isUpdating = ambassadors.length === 0;
        if (title.toLowerCase().includes('4. quản lý tiêu biểu') && categoryType === 'quarter') {
            isUpdating = true;
        }

        // Preserve original Google Sheet order
        // Left table (đủ điều kiện) naturally comes before right table (cận đạt)

        let finalTopRankers = [];
        let finalOtherRankers = [];
        
        const isDaiSuVang = categoryType === 'quarter' && title.toLowerCase().includes('đại sứ vàng');

        ambassadors.forEach(a => {
            if (isDaiSuVang) {
                finalOtherRankers.push(a);
            } else if (a.status !== 'chưa đủ điều kiện xét giải' && finalTopRankers.length < 3) {
                // If it has a specific rank > 3, it shouldn't be in topRankers
                if (a.rank && a.rank > 3) {
                    finalOtherRankers.push(a);
                } else {
                    finalTopRankers.push(a);
                }
            } else {
                finalOtherRankers.push(a);
            }
        });

        // Fix category names
        let finalTitle = title;
        if (categoryType === 'quarter') {
            if (title.toLowerCase().includes('tuyển dụng')) finalTitle = '3. QUẢN LÝ TUYỂN DỤNG XUẤT SẮC QUÝ III';
            else if (title.toLowerCase().includes('tiêu biểu')) finalTitle = '4. QUẢN LÝ TIÊU BIỂU QUÝ III';
            else if (title.toLowerCase().includes('xuất sắc')) finalTitle = '1. TOP 3 ĐẠI SỨ GIÁO DỤC XUẤT SẮC QUÝ III';
            else if (title.toLowerCase().includes('vàng')) finalTitle = '2. ĐẠI SỨ VÀNG QUÝ III';
        } else if (categoryType === 'semester') {
            if (title.toLowerCase().includes('quản lý xuất sắc')) finalTitle = '2. GIẢI QUẢN LÝ XUẤT SẮC KỲ II';
            else if (title.toLowerCase().includes('giáo dục xuất sắc')) finalTitle = '1. GIẢI ĐẠI SỨ GIÁO DỤC XUẤT SẮC KỲ II';
        }

        // Rename Vùng to Team for Quản lý tuyển dụng xuất sắc
        if (finalTitle.toLowerCase().includes('quản lý tuyển dụng xuất sắc')) {
            cat.groups.forEach(g => {
                g.dataCols.forEach(col => {
                    if (col.label === 'Vùng') col.label = 'Team';
                });
            });
            ambassadors.forEach(a => {
                if (a.columns) {
                    a.columns.forEach(col => {
                        if (col.label === 'Vùng') col.label = 'Team';
                    });
                }
                if (a.scoreLabel === 'Vùng') a.scoreLabel = 'Team';
                if (a.score2Label === 'Vùng') a.score2Label = 'Team';
            });
        }

        // Global replace "Số HV Live" to "Số HV tuyển sinh"
        cat.groups.forEach(g => {
            g.dataCols.forEach(col => {
                if (col.label === 'Số HV Live') col.label = 'Số HV tuyển sinh';
            });
        });
        ambassadors.forEach(a => {
            if (a.columns) {
                a.columns.forEach(col => {
                    if (col.label === 'Số HV Live') col.label = 'Số HV tuyển sinh';
                });
            }
            if (a.scoreLabel === 'Số HV Live') a.scoreLabel = 'Số HV tuyển sinh';
            if (a.score2Label === 'Số HV Live') a.score2Label = 'Số HV tuyển sinh';
        });


        results.push({
            categoryId: `cat_${categoryType}_${Math.random().toString(36).substring(7)}`,
            categoryName: finalTitle,
            topRankers: isUpdating ? [] : finalTopRankers,
            otherRankers: isUpdating ? [] : finalOtherRankers,
            hasMultipleScores: cat.groups.some(g => g.dataCols.length > 1),
            scoreLabels: cat.groups[0] ? cat.groups[0].dataCols.map(c => c.label) : [],
            isUpdating: isUpdating
        });
    }

    r = endIdx;
  }
  return results;
}

const data = {
  month: parseFile('t7.csv', 'month'),
  quarter: parseFile('q3.csv', 'quarter'),
  semester: parseFile('k2.csv', 'semester'),
  challenge: []
};

// Ensure "4. QUẢN LÝ TIÊU BIỂU QUÝ III" is present in quarter results
if (!data.quarter.some(c => c.categoryName.includes('QUẢN LÝ TIÊU BIỂU'))) {
    data.quarter.push({
        categoryId: `cat_quarter_${Math.random().toString(36).substring(7)}`,
        categoryName: '4. QUẢN LÝ TIÊU BIỂU QUÝ III',
        topRankers: [],
        otherRankers: [],
        hasMultipleScores: false,
        scoreLabels: [],
        isUpdating: true
    });
}

fs.writeFileSync('api_response.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated api_response.json');
