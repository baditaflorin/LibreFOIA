//data_extractor.js
const path = require('path');

// Function definitions...
const { extractFromWord, 
  extractFromExcel, 
  extractFromPDF, 
  extractFromXLS, 
  extractFromDoc, 
  convertImageToPdfAndOcr,
  extractFromCSV,
  extractFromODT,
  readTxtFile
} = require('./fileUtils');


// Main function to identify file type and call the appropriate extraction function
const extractData = async (attachment) => {
  const emailId = attachment.emailId;
  const filename = attachment.filename;
  const filePath = `../saved/attachments/${emailId}_${filename}`;
  console.log(filePath)
  

  // Call the appropriate extraction function based on the file extension
  let ext = path.extname(filename).toLowerCase();

  switch (ext) {
    case '.docx':
      return await extractFromWord(filePath); //partial implement in scrape_hub
    case '.doc':
      return await extractFromDoc(filePath);
    case '.csv':
      return await extractFromCSV(filePath);
    case '.odt':
      return await extractFromODT(filePath);
    case '.txt':
      return await readTxtFile(filePath); //implemented in scrape_hub
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.tiff':
    case '.tif':
    case '.bmp':
    case '.gif':
      return await convertImageToPdfAndOcr(filePath); //partial implement in scrape_hub
    case '.xlsx':
      return await extractFromExcel(filePath); //partial implement in scrape_hub
    case '.xls':
      return await extractFromXLS(filePath); //partial implement in scrape_hub
    case '.pdf':
      return await extractFromPDF(filePath); //partial implement in scrape_hub
    default:
      console.error(`File type not supported: ${filename}`);
      return null; // Skip unsupported file types
  }
}

module.exports = {
  extractData
};


