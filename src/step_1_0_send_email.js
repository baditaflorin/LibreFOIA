const {google} = require('googleapis');
const key = require('./config/service_account.json');
const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');
const version = '0.1'; // Get the version from package.json
const fs = require('fs');

const argv = yargs(hideBin(process.argv))
  .option('subject', {
    alias: 's',
    type: 'string',
    description: 'Subject of the email'
  })
  .option('body', {
    alias: 'b',
    type: 'string',
    description: 'Body of the email'
  })
  .option('to', {
    alias: 't',
    type: 'string',
    description: 'Email address to send to'
  })
  .option('from', {
    alias: 'f',
    type: 'string',
    description: 'Email address to send from'
  })
  .option('attachment', {
    alias: 'a',
    type: 'string',
    description: 'Path to the attachment file (optional)'
  })
  .demandOption(['to', 'from', 'subject', 'body'], 'Please provide all necessary flags to run the command.')
  .help()
  .version(version) // Set the version
  .alias('version', 'v') // Add an alias for the --version option
  .argv;

const jwtClient = new google.auth.JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: ['https://www.googleapis.com/auth/gmail.send'],
  subject: argv.from
});

jwtClient.authorize(err => {
  if (err) {
    console.log(err);
    return;
  }

  const gmail = google.gmail({version: 'v1', auth: jwtClient});
  sendMessage(gmail, 'me', argv.to, argv.subject, argv.body, argv.attachment);
});

function getEmailBody(body) {
  if (fs.existsSync(body)) {
    const fileContent = fs.readFileSync(body);

    // Check if the file extension is .md
    const fileExtension = body.split('.').pop().toLowerCase();
    if (fileExtension === 'md') {
      const markdown = require('markdown-it')();
      return markdown.render(fileContent.toString('utf-8'));
    }

    // Convert the buffer to a string and replace newlines with <br> tags for HTML  
    return fileContent.toString('utf-8').replace(/\n/g, '<br>');
  } else {
    // Use the body directly
    return body;
  }
}


function sendMessage(gmail, userId, to, subject, body, attachment) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

  const emailBody = getEmailBody(body);

  const messageParts = [
    `From: <${argv.from}>`,
    `To: <${to}>`,
    'Content-Type: multipart/mixed; boundary="boundary"',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    '--boundary',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    emailBody
  ];

  if (attachment) {
    const fs = require('fs');
    const attachmentData = fs.readFileSync(attachment).toString('base64');
    const attachmentName = attachment.split('/').pop();

    messageParts.push(
      '--boundary',
      'Content-Type: application/octet-stream',
      `Content-Disposition: attachment; filename="${attachmentName}"`,
      'Content-Transfer-Encoding: base64',
      '',
      attachmentData
    );
  }

  // const message = messageParts.join('\n');
  const message = messageParts.join('\r\n');
  // console.log(message)
  const encodedMessage = Buffer.from(message)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');
  
  // console.log(encodedMessage)
  gmail.users.messages.send({
    userId: userId,
    requestBody: {
      raw: encodedMessage
    }
  }, (err, res) => {
    if (err) {
      console.log('Failed to send email: ' + err);
      return;
    }
    console.log('Email sent: ' + res.data.id);
  });
}
