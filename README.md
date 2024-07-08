# LibreFOIA

LibreFOIA is a comprehensive tool designed to handle various tasks related to email processing, data extraction, and database management. 

This repository contains scripts and configurations for reading emails, extracting data from different file types, storing information in a database, and sending emails.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Reading Emails](#reading-emails)
  - [Adding Emails to Database](#adding-emails-to-database)
  - [Sending Emails](#sending-emails)
  - [Bulk Email Sender](#bulk-email-sender)
  - [Finding Emails Not in Database](#finding-emails-not-in-database)
- [Scripts](#scripts)
  - [config/emailService.js](#configemailservicejs)
  - [config/models.js](#configmodelsjs)
  - [data_extractor](#data_extractor)
- [Contributing](#contributing)
- [License](#license)

## Installation

To install the necessary dependencies, run:

```bash
npm install
```

## Usage

Navigate to the src folder
```bash
cd ./src
```

### Sending Emails

To send an email:

```bash
node step_1_0_send_email.js --from 544@coruptiaucide.com --to baditaflorin@gmail.com --subject "Subject" --body "Body of the email"
```

### Bulk Email Sender

To send emails in bulk from a JSON file:

```bash
node step_1_1_bulkEmailSender.js --file <path_to_json_file> --subject "Subject" --body <path_to_body_file> --from <from_email>
```


### Reading Emails

To read emails from a specified email address:

```bash
node step_3_0_read_emails.js --email <email_address> --max <number_of_emails> --download
```

To read emails from a specified email address and save to a file:

```bash
node step_3_0_read_emails.js --email <email_address> --max <number_of_emails> --download
```

### Adding Emails to Database

To add the fetched emails to the database:

```bash
curl -X POST -H "Content-Type: application/json" --data-binary "@response_read_emails.json" http://localhost:3000/add-emails
```

### Identify unanswered emails by subject

To find emails that are not in the database but are present in a JSON file of emails you have send:

```bash
node step_2_2_identify_unanswered_emails_by_subject.js --subject "Subject" --file <path_to_json_file>
```

## Scripts

### config/emailService.js

Handles the creation of sent email records.

### config/models.js

Defines the Sequelize models for interacting with the database.

### data_extractor

Contains utilities for extracting data from various file types:
- `csvUtils.js`: Extracts text from CSV files.
- `data_extractor.js`: Main data extraction logic.
- `db_setup.js`: Sets up the database connection.
- `excelUtils.js`: Extracts text from Excel files.
- `fileUtils.js`: Utilities for file extraction.
- `pdfUtils.js`: Extracts text from PDF files.
- `wordUtils.js`: Extracts text from Word and ODT files.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request with your changes.

## License

This project is licensed under the MIT License.
