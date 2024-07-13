const { sequelize, Attachment, ExtractedText } = require('../config/models');
const { extractData } = require('./data_extractor');

const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),  // Added timestamp
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'exceptions.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
    level: 'debug'  // Display logs at the 'info' level and above
  }));
}

// Sync the models with the database and create the tables if they don't exist
sequelize.sync()
  .then(() => {
    logger.info('Database tables created/updated');
    processAttachments(); // Start processing attachments after synchronization
  })
  .catch(err => {
    logger.error('Error syncing database:', err);
  });
// Function to find all attachments
const findAllAttachments = async () => {
  return await Attachment.findAll();
};

// Function to find existing text by attachment ID
const findExistingTextByAttachmentId = async (attachmentId) => {
  return await ExtractedText.findOne({
    where: { attachmentId }
  });
};

// Function to save or update the extracted text
const saveOrUpdateExtractedText = async (attachmentId, emailId, extractedData, existingText) => {
  if (existingText) {
    existingText.text = extractedData;
    await existingText.save();
    logger.info(`[saveOrUpdateExtractedText]: Updated existingText record for attachmentId ${attachmentId}`);
  } else {
    await ExtractedText.create({
      text: extractedData,
      attachmentId,
      emailId
    });
    logger.info(`[saveOrUpdateExtractedText]: Created new ExtractedText record for attachmentId ${attachmentId}`);
  }
};

// Main processing function, now simpler and calling the utility functions
const processAttachments = async () => {
  try {
    logger.info('[processAttachments]: Starting attachment processing.');
    const attachments = await findAllAttachments();

    logger.info(`[processAttachments]: Found ${attachments.length} attachments to process.`);
    logger.debug(`[processAttachments]: Fetched attachments details: ${JSON.stringify(attachments)}`);

    for (const attachment of attachments) {
      //TODO fix attachmentPath, currently shows undefined
      const { id: attachmentId, emailId, path: attachmentPath } = attachment;
      
      logger.info(`[processAttachments]: Processing attachment with ID: ${attachmentId}, associated with email ID: ${emailId}.`);
      logger.debug(`[processAttachments]: Path of attachment to be processed: ${attachmentPath}`);

      const existingText = await findExistingTextByAttachmentId(attachmentId);

      logger.debug(`[processAttachments]: Existing text record for attachmentId ${attachmentId}: ${JSON.stringify(existingText)}`);

      if (existingText && existingText.text.length > 6) {
        logger.info(`[processAttachments][existingText]: Skipping attachmentId ${attachmentId} because text is longer than 6 characters.`);
        continue;
      }

      logger.info(`[processAttachments]: Calling extractData for attachmentId ${attachmentId}.`);
      const extractedData = await extractData(attachment);

      if (extractedData !== null && (!existingText || existingText.text.length < 10)) {
        await saveOrUpdateExtractedText(attachmentId, emailId, extractedData, existingText);
      } else {
        logger.info(`[processAttachments]: Extracted data for attachmentId ${attachmentId} is null.`);
      }
    }
  } catch (err) {
    logger.error(`[processAttachments]: Error occurred - ${err.message}`);
    logger.debug(`[processAttachments]: Error details - ${JSON.stringify(err)}`);
  }
};


