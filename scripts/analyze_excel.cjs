const ExcelJS = require("exceljs");
require("path");

async function analyze() {
  const filePath = require("path").join(__dirname, "../src/assets/templates/2026mapogu.xlsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  console.log("Worksheets:", workbook.worksheets.map(ws => ws.name));
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
      console.error("No worksheet found!");
      return;
  }

  console.log("Sheet Name:", worksheet.name);
  console.log("Dimension:", worksheet.dimensions ? worksheet.dimensions.toString() : "Unknown");

  worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const values = row.values.slice(1); // Row values are 1-indexed
    console.log(`Row ${rowNumber}:`, JSON.stringify(values));
    if (rowNumber > 20) return; // Only first 20 rows
  });
}

analyze().catch(err => console.error(err));
