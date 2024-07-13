const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { exec } = require('child_process');
const fs = require('fs');
const { createSentEmail } = require('./config/emailService');
const { Email, Attachment, sequelize, Sequelize } = require('./config/models');
sequelize.sync();

version="0.1"

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

const argv = yargs(hideBin(process.argv))
  .option('json', {
    describe: 'JSON array of email addresses',
    type: 'string',
    demandOption: false
  })
  .option('file', {
    describe: 'JSON file containing email addresses',
    type: 'string',
    demandOption: false
  })
  .option('subject', {
    describe: 'Subject of the email',
    type: 'string',
    demandOption: false
  })
  .option('from', {
    alias: 'f',
    type: 'string',
    description: 'Email address to send from'
  })
  .option('body', {
    describe: 'Body of the email',
    type: 'string',
    demandOption: false
  })
  .option('attachment', {
    describe: 'Link to the attachment',
    type: 'string',
    demandOption: false
  })
  .demandOption(['from', 'subject', 'body'], 'Please provide all necessary flags to run the command.')
  .help()
  .version(version) // Set the version
  .alias('version', 'v') // Add an alias for the --version option
  .argv;

let emailList;
let subject = argv.subject || 'Test Email';
let from = argv.from;
const emailBody = getEmailBody(argv.body);

let body = emailBody || 'This is a test email.';
// console.log(body)
let attachment = argv.attachment ? `--attachment "${argv.attachment}"` : '';

if (argv.json) {
  try {
    emailList = JSON.parse(argv.json);
    if (!Array.isArray(emailList)) throw new Error();
  } catch(e) {
    console.log("Invalid json input. Please provide a valid JSON array.");
    process.exit();
  }
} else if (argv.file) {
  try {
    const fileContent = fs.readFileSync(argv.file, 'utf8');
    console.log(argv.file)
    console.log(fileContent)
    const entries = JSON.parse(fileContent);
    if (!Array.isArray(entries)) throw new Error();
    emailList = entries.map(entry => ({
      email: entry.email,
      to_name: entry.name
    }));
  } catch(e) {
    console.log("Invalid file input. Please provide a valid JSON file.");
    process.exit();
  }
} else {
  console.log("Please provide either --json or --file flag with the appropriate input.");
  process.exit();
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


(async () => {
  for (let i = 0; i < emailList.length; i++) {
    const { to_name, email } = emailList[i];
    createSentEmail(
      to_name,
      from,
      email,
      subject
    )
      .then(sentEmail => {
        // Handle the created sent email
        console.log('Sent email created:', sentEmail);
      })
      .catch(error => {
        // Handle the error
        console.error('Error creating sent email:', error);
      });

    const command = `node step_1_0_send_email.js --from ${from} --to ${email} --subject "${subject}" --body "${body}" ${attachment}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });

    // Generate a random delay between 500ms and 1000ms (1 second)
    const randomDelay = Math.floor(Math.random() * 500) + 500;
    await delay(randomDelay);
  }
})();

// emailList.forEach(({ to_name, email }) => {
//   createSentEmail(
//     to_name,
//     '544@coruptiaucide.com',
//     email,
//     subject
//   )
//     .then(sentEmail => {
//       // Handle the created sent email
//       console.log('Sent email created:', sentEmail);
//     })
//     .catch(error => {
//       // Handle the error
//       console.error('Error creating sent email:', error);
//     });

//   const command = `node send_email.js --from 544@coruptiaucide.com --to ${email} --subject "${subject}" --body "${body}" ${attachment}`;
//   exec(command, (error, stdout, stderr) => {
//     if (error) {
//       console.log(`error: ${error.message}`);
//       return;
//     }
//     if (stderr) {
//       console.log(`stderr: ${stderr}`);
//       return;
//     }
//     console.log(`stdout: ${stdout}`);
//   });
// });
