const ExcelJS = require("exceljs");
const path = require("path");

async function analyze() {
  const filePath = path.join(__dirname, "../src/assets/templates/2026mapogu.xlsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  const row1 = worksheet.getRow(1);
  const headers = [];
  row1.eachCell((cell, colNumber) => {
    headers.push({ col: colNumber, value: cell.value });
  });
  console.log(JSON.stringify(headers, null, 2));
}

analyze().catch(err => console.error(err));
