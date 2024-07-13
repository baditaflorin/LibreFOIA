const { SentEmail } = require('./models');

async function createSentEmail( to_name, from, to, subject) {
    try {
        const sentEmail = await SentEmail.create({
            to_name,
            from,
            to,
            subject
                });
        console.log('Sent email created:', sentEmail);
        return sentEmail;
    } catch (error) {
        console.error('Error creating sent email:', error);
        throw error;
    }
}

module.exports = {
    createSentEmail
};