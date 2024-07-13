//node check_emails_not_send_with_file.js ./templates/emails/3200_all_emails.json
//node step_2_2_find_emails_not_in_database.js ./templates/test_system/emails.json
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');
const version = "0.1"

const argv = yargs(hideBin(process.argv))
  .option('subject', {
    alias: 's',
    type: 'string',
    description: 'Subject of the email'
  })
  .option('file', {
    describe: 'JSON file containing email addresses send template',
    type: 'string',
    demandOption: false
  })
  .demandOption(['subject', 'file'], 'Please provide all necessary flags to run the command.')
  .help()
  .argv;

// Function to remove angle brackets from email addresses
function removeAngleBrackets(email) {
  return email.replace(/[<>]/g, '');
}

// Function to load emails from a JSON file
function loadEmailsFromJson(jsonPath) {
  try {
    const jsonData = fs.readFileSync(jsonPath);
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading or parsing the JSON file:', error.message);
    return [];
  }
}

const { Email, Attachment, sequelize, Sequelize } = require('./config/models');

/**
 * Finds and logs email addresses that exist in a JSON file but not in the database.
 * The function loads email data from both the JSON file and the database,
 * compares them, and logs the email addresses that are missing in the database.
 * It also saves the missing email addresses to a JSON file for reference.
 *
 * @throws {Error} If there is an issue with database connectivity or file operations.
 */
async function main() {
  try {
    // Connect to the database
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Load the existing emails from the database 'Email' model with the specified subject
    const emailInstances = await Email.findAll({
      where: {
        subject: argv.subject,
      },
      attributes: ['to'],
      raw: true,
    });

    // Extract only the email addresses from the 'to' field in the database
    const existingEmails = emailInstances.map((emailEntry) => removeAngleBrackets(emailEntry.to));

    // Ask the user to provide the JSON file path via terminal argument
    const jsonFilePath = argv.file;
    if (!jsonFilePath) {
      console.error('Please provide the JSON file path as an argument.');
      return;
    }

    // Load emails from the JSON file
    const jsonEmails = loadEmailsFromJson(jsonFilePath);
    if (jsonEmails.length === 0) {
      console.log('No emails found in the JSON file.');
      return;
    }

    // Process the JSON emails to remove angle brackets
    const processedEmails = jsonEmails.map((entry) => ({
      ...entry,
      name: entry.name,
      email: removeAngleBrackets(entry.email),
    }));

    // Find the emails that exist in the JSON file but not in the database
    const newEmails = processedEmails.filter(
      (entry) => !existingEmails.includes(entry.email)
    );

    // Output the new email addresses
    console.log('New emails:');
    newEmails.forEach((entry) => {
      console.log(entry.email, entry.name);
    });

    // Save the new email addresses to a file called "missing_emails_not_send_yet.json"
    const outputFile = 'missing_emails_not_send_yet.json';
    fs.writeFileSync(outputFile, JSON.stringify(newEmails, null, 2));
    console.log(`New emails saved to ${outputFile}.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    sequelize.close();
    console.log('Database connection has been closed.');
  }
}

// Run the main function
main();
