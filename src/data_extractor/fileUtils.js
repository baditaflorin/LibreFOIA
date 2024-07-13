
const extractFromCSV = require('./csvUtils');
const { extractFromWord, extractFromDoc, extractFromODT, readTxtFile } = require('./wordUtils');
const { extractFromExcel, extractFromXLS } = require('./excelUtils');
const { extractFromPDF, convertImageToPdfAndOcr, runOCRmyPDF } = require('./pdfUtils');

module.exports = {
  extractFromWord,
  extractFromExcel,
  extractFromPDF,
  extractFromXLS,
  convertImageToPdfAndOcr,
  extractFromDoc,
  extractFromCSV,
  extractFromODT,
  readTxtFile
};