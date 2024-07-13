const { exec } = require('child_process');

const runOCRmyPDF = (inputFile, outputFile) => {
  return new Promise((resolve, reject) => {
    const command = `ocrmypdf --force-ocr --rotate-pages -l eng+ron "${inputFile}" "${outputFile}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        console.log('OCRmyPDF completed successfully');
        resolve();
      }
    });
  });
};

module.exports = runOCRmyPDF;
