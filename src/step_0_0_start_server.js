//curl -X POST -H "Content-Type: application/json" --data-binary "@response_read_emails.json" http://localhost:3000/add-emails
const express = require('express');
const bodyParser = require('body-parser');
const { Email, Attachment, sequelize } = require('./config/models');
const fs = require('fs');
const path = require('path');

const app = express();

// Body Parser Middleware with error handling
app.use((req, res, next) => {
    bodyParser.json({ limit: '50mb' })(req, res, (err) => {
        if (err) {
            console.error("Error parsing JSON:", err);
            return res.status(400).json({ error: "Invalid JSON data", details: err.message });
        }
        next();
    });
});

app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));

// Relations
Email.hasMany(Attachment, {as: 'attachments'});

// Sync the model with the database
sequelize.sync().then(() => {
    console.log("Database synced");
}).catch(err => {
    console.error("Error syncing database:", err);
});

// Route to add emails
app.post('/add-emails', async (req, res) => {
    console.log("Received request to add emails");

    let emailsData;
    try {
        // If the request body is empty, try to read from file
        if (Object.keys(req.body).length === 0) {
            const filePath = path.join(__dirname, 'response_read_emails_v2.json');
            const fileContent = fs.readFileSync(filePath, 'utf8');
            console.log("Reading from file:", filePath);
            emailsData = JSON.parse(fileContent);
        } else {
            emailsData = req.body;
        }
    } catch (error) {
        console.error("Error parsing data:", error);
        return res.status(400).json({ error: "Invalid data", details: error.message });
    }

    if (!Array.isArray(emailsData)) {
        return res.status(400).json({ error: "Invalid data format. Expected an array of emails." });
    }

    let newEmails = 0;
    let existingEmails = 0;

    try {
        for(let i = 0; i < emailsData.length; i++) {
            const emailData = emailsData[i];
            const [email, created] = await Email.findOrCreate({
                where: { id: emailData.id },
                defaults: {
                    emailId: emailData.id,
                    threadId: emailData.threadId,
                    from: emailData.from,
                    to: emailData.to,
                    subject: emailData.subject,
                    snippet: emailData.snippet,
                    text: emailData.text,
                }
            });
            if(created) {
                newEmails++;
                // add attachments
                for(let j = 0; j < emailData.attachments.length; j++) {
                    const attachmentData = emailData.attachments[j];
                    await Attachment.create({
                        filename: attachmentData.filename.replace(/ /g, '_'),
                        threadId: emailData.threadId,
                        emailId: emailData.id
                    });
                }
            } else {
                existingEmails++;
            }
        }
        res.json({ newEmails, existingEmails });
    } catch (error) {
        console.error("Error processing emails:", error);
        res.status(500).json({ error: "Error processing emails", details: error.message });
    }
});

// start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));