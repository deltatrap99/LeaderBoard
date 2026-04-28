import fs from 'fs';

const file = 'src/data/liveData.ts';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    
    let headerRowIdx = -1;
    for (let r = 0; r < 10; r++) {
       if (!rows[r]) continue;
       // Kiểm tra row có ít nhất 2 cột non-null riêng biệt (loại bỏ title rows gộp)
       const nonNullCells = rows[r].filter((c: any) => c != null && String(c).trim() !== '');
       if (nonNullCells.length < 2) continue;
       // Kiểm tra các cột keyword phải là cột ngắn (header), không phải title dài
       const shortCells = rows[r].filter((c: any) => c != null && typeof c === 'string' && c.trim().length > 0 && c.trim().length < 50);
       if (shortCells.length < 2) continue;
       const rowStr = shortCells.map((c: any) => String(c).toLowerCase()).join(' ');
       if ((rowStr.includes('tên') || rowStr.includes('đại sứ') || rowStr.includes('họ và')) && (rowStr.includes('mã') || rowStr.includes('doanh số') || rowStr.includes('thành tích') || rowStr.includes('n-1') || rowStr.includes('tuyển dụng') || rowStr.includes('active') || rowStr.includes('hv mới') || rowStr.includes('hệ số') || rowStr.includes('thực đạt') || rowStr.includes('mục tiêu'))) {
         headerRowIdx = r;
         break;
       }
    }

    if (headerRowIdx === -1) {
       for (let r = 0; r < 10; r++) {
         if (!rows[r]) continue;
         const rowStr = rows[r].map((c: any) => String(c).toLowerCase()).join(' ');
         if ((rowStr.includes('mã') || rowStr.includes('stt') || rowStr.includes('nhóm')) && (rowStr.includes('đại sứ') || rowStr.includes('doanh số') || rowStr.includes('hệ số'))) {
           headerRowIdx = r;
           break;
         }
       }
    }

    if (headerRowIdx === -1) continue;

    const headerRow = rows[headerRowIdx];
    const recruitment = isRecruitmentSheet(sheetName);
    const goldAmbassador = isGoldAmbassadorSheet(sheetName);
    const manager = isManagerSheet(sheetName);
`;

const replaceStr = `
    const sheet = wb.Sheets[sheetName];
    const allRows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    
    const tables: {title: string, headerIdx: number, endIdx: number}[] = [];
    let r = 0;
    while (r < allRows.length) {
      let headerRowIdx = -1;
      for (; r < allRows.length; r++) {
         if (!allRows[r]) continue;
         const nonNullCells = allRows[r].filter((c: any) => c != null && String(c).trim() !== '');
         if (nonNullCells.length < 2) continue;
         const shortCells = allRows[r].filter((c: any) => c != null && typeof c === 'string' && c.trim().length > 0 && c.trim().length < 50);
         if (shortCells.length < 2) continue;
         const rowStr = shortCells.map((c: any) => String(c).toLowerCase()).join(' ');
         if ((rowStr.includes('tên') || rowStr.includes('đại sứ') || rowStr.includes('họ và') || rowStr.includes('đs')) && 
             (rowStr.includes('mã') || rowStr.includes('doanh số') || rowStr.includes('thành tích') || rowStr.includes('n-1') || rowStr.includes('tuyển dụng') || rowStr.includes('active') || rowStr.includes('hv mới') || rowStr.includes('hệ số') || rowStr.includes('thực đạt') || rowStr.includes('mục tiêu'))) {
           headerRowIdx = r;
           break;
         }
      }

      if (headerRowIdx === -1) break;

      let title = sheetName;
      for (let k = headerRowIdx - 1; k >= Math.max(0, headerRowIdx - 5); k--) {
         const nonNull = allRows[k] ? allRows[k].filter((c: any) => c != null && String(c).trim() !== '') : [];
         if (nonNull.length > 0 && String(nonNull[0]).trim().length > 5) {
            title = String(nonNull[0]).trim();
            break;
         }
      }

      let endIdx = headerRowIdx + 1;
      for (; endIdx < allRows.length; endIdx++) {
         if (!allRows[endIdx]) continue;
         const nonNull = allRows[endIdx].filter((c: any) => c != null && String(c).trim() !== '');
         if (nonNull.length === 0) break;
         const shortCells = allRows[endIdx].filter((c: any) => c != null && typeof c === 'string' && c.trim().length > 0 && c.trim().length < 50);
         if (shortCells.length >= 2) {
             const rowStr = shortCells.map((c: any) => String(c).toLowerCase()).join(' ');
             if ((rowStr.includes('tên') || rowStr.includes('đại sứ') || rowStr.includes('họ và') || rowStr.includes('đs')) && 
                 (rowStr.includes('mã') || rowStr.includes('doanh số') || rowStr.includes('thành tích') || rowStr.includes('n-1') || rowStr.includes('tuyển dụng') || rowStr.includes('active') || rowStr.includes('hv mới') || rowStr.includes('hệ số') || rowStr.includes('thực đạt') || rowStr.includes('mục tiêu'))) {
                 break;
             }
         }
      }
      
      tables.push({ title, headerIdx: headerRowIdx, endIdx });
      r = endIdx;
    }

    if (tables.length === 0) continue;

    for (const table of tables) {
      const rows = allRows.slice(table.headerIdx, table.endIdx);
      const headerRowIdx = 0;
      const headerRow = rows[0];
      const sheetTitle = table.title !== sheetName ? table.title : sheetName;
      
      const recruitment = isRecruitmentSheet(sheetTitle) || isRecruitmentSheet(sheetName);
      const goldAmbassador = isGoldAmbassadorSheet(sheetTitle) || isGoldAmbassadorSheet(sheetName);
      const manager = isManagerSheet(sheetTitle) || isManagerSheet(sheetName);
`;

code = code.replace(targetStr.trim(), replaceStr.trim());

// We also need to add a closing brace for the \`for (const table of tables)\` loop at the end of the sheet processing.
// The end of the sheet processing is just before \`  }\` of the wb.SheetNames loop.
// It looks like:
/*
    data[categoryType].push({
      categoryId: \`cat_\${i}\`,
      categoryName,
      topRankers: ambassadors.slice(0, 3),
      otherRankers: ambassadors.slice(3),
    });
  }

  // Đổi tên "Bứt tốc quý"
*/

const targetEndStr = \`    data[categoryType].push({
      categoryId: \\\`cat_\\\${i}\\\`,
      categoryName,
      topRankers: ambassadors.slice(0, 3),
      otherRankers: ambassadors.slice(3),
    });
  }\`;

const replaceEndStr = \`    data[categoryType].push({
      categoryId: \\\`cat_\\\${i}\\\`,
      categoryName,
      topRankers: ambassadors.slice(0, 3),
      otherRankers: ambassadors.slice(3),
    });
    } // end for table of tables
  }\`;

code = code.replace(targetEndStr, replaceEndStr);

// Change \`let categoryName = sheetName.trim();\` to \`let categoryName = sheetTitle.trim();\`
code = code.replace(/let categoryName = sheetName\\.trim\\(\\);/g, 'let categoryName = sheetTitle.trim();');

// Change \`let baseCategoryName = sheetName.trim();\` to \`let baseCategoryName = sheetTitle.trim();\`
code = code.replace(/let baseCategoryName = sheetName\\.trim\\(\\);/g, 'let baseCategoryName = sheetTitle.trim();');

// Change \`let categoryName = subTitle || sheetName.trim();\` to \`let categoryName = subTitle || sheetTitle.trim();\`
code = code.replace(/let categoryName = subTitle \\|\\| sheetName\\.trim\\(\\);/g, 'let categoryName = subTitle || sheetTitle.trim();');


fs.writeFileSync(file, code, 'utf8');
console.log('Refactored liveData.ts');
