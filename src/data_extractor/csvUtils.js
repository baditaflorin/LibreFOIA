const fs = require('fs');
const csv = require('csv-parser');

const extractFromCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const texts = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Extract text from each row/column in the CSV
        const rowTexts = Object.values(data).map((value) => String(value));
        texts.push(rowTexts.join(', ')); // Adjust the separator if needed
      })
      .on('end', () => {
        const result = texts.join('\n'); // Join all row texts with line breaks
        resolve(result);
      })
      .on('error', (error) => {
        console.error('Error extracting text from CSV:', error);
        reject(error);
      });
  });
};

module.exports = extractFromCSV;
