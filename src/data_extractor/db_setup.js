//db_setup.js
const Sequelize = require('sequelize');

// Connection to the database
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  storage: '../config/database.sqlite' // SQLite only
  // Uncomment the following lines if you want to use Postgres in the future
  // dialect: 'postgres',
  // host: 'localhost',
});

// Define models
const Attachment = sequelize.define('attachment', {
  filename: Sequelize.STRING,
  threadId: Sequelize.STRING,
  emailId: {
    type: Sequelize.STRING,
    allowNull: false,
    references: {
      model: 'emails',
      key: 'id'
    }
  }
});

const ExtractedText = sequelize.define('extractedText', {
  text: Sequelize.TEXT,
  reqNumber: Sequelize.TEXT,
  emailId: Sequelize.TEXT,
  attachmentId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'attachments',
      key: 'id'
    }
  }
}, {
  tableName: 'extractedTexts' // Set the table name explicitly
});

module.exports = {
  sequelize,
  Attachment,
  ExtractedText
};
