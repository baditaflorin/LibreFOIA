const textract = require('textract');
const mammoth = require('mammoth');
const fs = require('fs');

const extractFromWord = async (filePath) => {
  try {
    let result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from .doc file:', error);
    return '';
  }
};

const extractFromDoc = (filePath) => {
  return new Promise((resolve, reject) => {
    textract.fromFileWithPath(filePath, { preserveLineBreaks: true }, (error, text) => {
      if (error) {
        console.error('Error extracting text from Word file:', error);
        reject(error);
      } else {
        resolve(text);
      }
    });
  });
};

const readTxtFile = (filePath) => {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (error, data) => {
        if (error) {
          console.error('Error reading TXT file:', error);
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  };

const extractFromODT = (filePath) => {
    return new Promise((resolve, reject) => {
      textract.fromFileWithPath(filePath, { preserveLineBreaks: true }, (error, text) => {
        if (error) {
          console.error('Error extracting text from ODT file:', error);
          reject(error);
        } else {
          resolve(text);
        }
      });
    });
  };
  

module.exports = {
  extractFromWord,
  extractFromDoc,
  extractFromODT,
  readTxtFile
};
