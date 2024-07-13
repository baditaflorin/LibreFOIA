const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const Jimp = require('jimp');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');

const runOCRmyPDF = require('./runOCRmyPDF');

const convertImageToPdfAndOcr = async (filePath) => {
  const outputDir = '../pdf_images';
  const outputFilePath = path.join(outputDir, `${uuidv4()}.pdf`);

  await fsExtra.ensureDir(outputDir);

  try {
    const image = await Jimp.read(filePath);
    const convertedImageBuffer = await image.getBufferAsync(Jimp.MIME_PNG);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    page.setSize(image.bitmap.width, image.bitmap.height);

    // As we are converting all images to PNG, we directly use embedPng method.
    const pdfImage = await pdfDoc.embedPng(convertedImageBuffer);

    page.drawImage(pdfImage, {
      x: 0,
      y: 0,
      width: image.bitmap.width,
      height: image.bitmap.height,
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFilePath, pdfBytes);

    await runOCRmyPDF(outputFilePath, outputFilePath);
    const dataBuffer = fs.readFileSync(outputFilePath);
    const data = await pdfParse(dataBuffer);

    // console.log("[convertImageToPdfAndOcr][data.text]:", data.text);
    return data.text;
  } catch (error) {
    console.error('Error converting image to PDF and performing OCR:', error);
    return '';
  } finally {
    fsExtra.removeSync(outputFilePath);
  }
};

const extractFromPDF = async (filePath) => {
  const outputDir = '../pdf_images'; // Directory to store the converted images
  const outputFilePath = path.join(outputDir, `${uuidv4()}.pdf`);

  await fsExtra.ensureDir(outputDir); // Create the output directory if it doesn't exist

  try {
    await runOCRmyPDF(filePath, outputFilePath);
    const dataBuffer = fs.readFileSync(outputFilePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    return '';
  } finally {
    fsExtra.removeSync(outputFilePath);
  }
};

module.exports = {
  extractFromPDF,
  convertImageToPdfAndOcr,
  runOCRmyPDF
};
