const { google } = require('googleapis');
const key = require('./config/service_account.json');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');
const winston = require('winston');

// Custom logger setup
const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console({
      format: winston.format.printf(({ message }) => message),
    }),
  ],
});

// Custom logging function
function customLog(message, isJson = false) {
  if (process.stdout.isTTY || !isJson) {
    logger.info(message);
  } else if (isJson) {
    console.log(message);
  }
}

const argv = getYargsConfig();

function getYargsConfig() {
  return yargs(hideBin(process.argv))
      .option('email', {
        alias: 'e',
        type: 'string',
        demandOption: true,
        describe: 'Email address to be used',
      })
      .option('max', {
        alias: 'm',
        type: 'number',
        default: 10,
        describe: 'Max number of emails to fetch',
      })
      .option('download', {
        alias: 'd',
        type: 'boolean',
        default: false,
        describe: 'Download attachments',
      })
      .option('folder', {
        alias: 'f',
        type: 'string',
        describe: 'Folder to save attachments (optional)',
      })
      .help()
      .version('0.1')
      .alias('version', 'v')
      .argv;
}

const jwtClient = new google.auth.JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  subject: argv.email,
});

function listMessages(gmail, pageToken) {
  return new Promise((resolve, reject) => {
    gmail.users.messages.list(
        {
          userId: 'me',
          maxResults: argv.max,
          pageToken: pageToken,
        },
        (err, res) => {
          if (err) {
            reject('The API returned an error: ' + err);
          } else {
            resolve(res.data);
          }
        }
    );
  });
}

async function getAllMessages(gmail) {
  let allMessages = [];
  let pageToken = null;

  do {
    try {
      const result = await listMessages(gmail, pageToken);

      allMessages.push(...result.messages);

      if (allMessages.length >= argv.max) {
        break;
      }

      pageToken = result.nextPageToken;
    } catch (error) {
      customLog(`Failed to fetch page: ${error}`);
      break;
    }
  } while (pageToken);

  return allMessages;
}

function extractTextFromPayload(payload) {
  if (payload && payload.mimeType === 'multipart/alternative') {
    const textPart = payload.parts.find((part) => part.mimeType === 'text/plain');
    if (textPart) {
      return textPart.body.data;
    } else {
      for (const part of payload.parts) {
        const textData = extractTextFromPayload(part);
        if (textData) {
          return textData;
        }
      }
    }
  } else if (payload && payload.mimeType === 'multipart/mixed') {
    const textPart = payload.parts.find((part) => part.mimeType === 'text/html');
    if (textPart) {
      return textPart.body.data;
    } else {
      for (const part of payload.parts) {
        const textData = extractTextFromPayload(part);
        if (textData) {
          return textData;
        }
      }
    }
  } else if (payload && payload.body) {
    return payload.body.data;
  }

  return '';
}

function extractEmailHeaders(headers) {
  let from, to, subject;
  headers.forEach((header) => {
    if (header.name === 'From') {
      from = header.value;
    } else if (header.name === 'To') {
      to = header.value;
    } else if (header.name === 'Subject') {
      subject = header.value;
    }
  });
  return { from, to, subject };
}

function buildEmailData(res, bodyData) {
  const { from, to, subject } = extractEmailHeaders(res.data.payload.headers);
  const snippet = res.data.snippet;
  const threadId = res.data.threadId;
  const text = bodyData ? Buffer.from(bodyData, 'base64').toString('utf-8') : '';
  const attachments = extractAttachments(res.data.payload);

  return {
    id: res.data.id,
    threadId,
    from,
    to,
    subject,
    snippet,
    text,
    attachments,
  };
}

function extractAttachments(payload) {
  return payload && payload.parts
      ? payload.parts.filter((part) => part.filename && part.body.attachmentId && part.body.attachmentId !== '')
      : [];
}

function ensureFolderExists(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}

function downloadAllAttachments(gmail, userId, messageId, attachments, folder) {
  attachments.forEach((attachment) => {
    const attachmentId = attachment.body.attachmentId;
    const sanitizedFilename = attachment.filename.replace(/ /g, '_');
    const path = require('path');
    const filename = `${messageId}_${sanitizedFilename}`;
    const attachmentPath = path.join(folder, filename);

    downloadAttachment(gmail, userId, messageId, attachmentId, attachmentPath);
  });
}

function getMessage(gmail, userId, messageId, downloadAttachments, downloadFolder, callback) {
  if (process.stdout.isTTY) {
    customLog(`userId: ${userId}`);
    customLog(`messageId: ${messageId}`);
  }

  gmail.users.messages.get(
      {
        userId: userId,
        id: messageId,
        format: 'full',
      },
      (err, res) => {
        if (err) {
          customLog('The API returned an error: ' + err);
          return;
        }

        let bodyData;
        try {
          bodyData = extractTextFromPayload(res.data.payload);
        } catch (error) {
          customLog(error);
          bodyData = '';
        }

        const emailData = buildEmailData(res, bodyData);

        if (downloadAttachments) {
          const folder = downloadFolder || './saved/attachments';
          ensureFolderExists(folder);
          downloadAllAttachments(gmail, userId, messageId, emailData.attachments, folder);
        }

        callback(emailData);
      }
  );
}

function downloadAttachment(gmail, userId, messageId, attachmentId, attachmentPath) {
  gmail.users.messages.attachments.get(
      {
        userId: userId,
        messageId: messageId,
        id: attachmentId,
      },
      (err, res) => {
        if (err) {
          customLog('The API returned an error: ' + err);
          return;
        }

        const data = res.data.data;
        const buff = Buffer.from(data, 'base64');
        const fileStream = fs.createWriteStream(attachmentPath);
        fileStream.write(buff);
        fileStream.end();
      }
  );
}

jwtClient.authorize(async (err) => {
  if (err) {
    customLog(err);
    return;
  }

  const gmail = google.gmail({ version: 'v1', auth: jwtClient });

  const messages = await getAllMessages(gmail);

  if (!messages || messages.length === 0) {
    customLog('No new messages.');
    return;
  }

  if (messages.length) {
    let promises = messages.map((message, index) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          getMessage(
              gmail,
              'me',
              message.id,
              argv.download,
              argv.folder,
              (emailData) => {
                resolve(emailData);
              }
          );
        }, index * 150);
      });
    });

    Promise.all(promises)
        .then((allEmails) => customLog(JSON.stringify(allEmails, null, 2), true))
        .catch((err) => customLog('An error occurred: ' + err));
  } else {
    customLog('No new messages.');
  }
});