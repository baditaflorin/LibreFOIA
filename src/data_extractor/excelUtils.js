const ExcelJS = require('exceljs');
var XLSX = require("xlsx");

const extractFromExcel = async (filePath) => {
  console.debug('Start reading Excel file:', filePath);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  console.debug('Finished reading Excel file');

  let worksheet = workbook.worksheets[0]; // assuming data is in the first worksheet
  console.debug('Got the first worksheet');

  let data = worksheet.getSheetValues();
  console.debug('Extracted sheet values');

  let dataString = String(data);
  console.debug('Converted data to string');
  console.log(dataString);

  return dataString;
};

const extractFromXLS = (filePath) => {
  console.debug('Start reading XLS file:', filePath);

  const workbook = XLSX.read(filePath);
  console.debug('Finished reading XLS file');

  const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // assuming data is in the first worksheet
  console.debug('Got the first worksheet');

  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  console.debug('Converted worksheet to JSON');

  let dataString = String(data);
  console.debug('Converted data to string');

  return dataString;
};

module.exports = {
  extractFromExcel,
  extractFromXLS
};
