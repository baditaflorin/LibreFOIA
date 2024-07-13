// models.js
const Sequelize = require('sequelize');
const path = require('path');
// Construct the absolute path to the SQLite database file
const dbPath = path.resolve(__dirname, 'database.sqlite');


// Connection to the database
const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    storage: dbPath, // Use the absolute path to the database file
    // logging: console.log,

    // Uncomment the following lines if you want to use Postgres in the future
    // dialect: 'postgres',
    // host: 'localhost',
});

const SentEmail = sequelize.define('sentEmail', {
    to_name: {
        type: Sequelize.STRING
    },
    from: {
        type: Sequelize.STRING
    },
    to: {
        type: Sequelize.STRING
    },
    subject: {
        type: Sequelize.STRING
    },
    timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
});

const ResponseSummary = sequelize.define('responseSummary', {
    emailFrom: {
      type: Sequelize.STRING
    },
    nonEmptyCount: {
      type: Sequelize.INTEGER
    }
  });

const Email = sequelize.define('email', {
    id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
    },
    threadId: {
        type: Sequelize.STRING
    },
    reqNumber: {
        type: Sequelize.STRING
    },
    from: {
        type: Sequelize.STRING
    },
    to: {
        type: Sequelize.STRING
    },
    subject: {
        type: Sequelize.STRING
    },
    snippet: {
        type: Sequelize.TEXT
    },
    text: {
        type: Sequelize.TEXT
    },
    category: {
        type: Sequelize.STRING,
        defaultValue: 'Uncategorized'
    }
});


const Attachment = sequelize.define('attachment', {
    filename: {
        type: Sequelize.STRING
    },
    threadId: {
        type: Sequelize.STRING
    },
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
    text: {
        type: Sequelize.TEXT
    },
    reqNumber: {
        type: Sequelize.TEXT
    },
    emailId: {
        type: Sequelize.TEXT
    },
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
// Email.hasMany(Attachment, { foreignKey: 'emailId' });
// Attachment.belongsTo(Email, { foreignKey: 'emailId' });

// Attachment.hasOne(ExtractedText, { foreignKey: 'attachmentId' });
// ExtractedText.belongsTo(Attachment, { foreignKey: 'attachmentId' });

Email.hasMany(Attachment, { foreignKey: 'emailId', as: 'emailAttachments' });
Attachment.belongsTo(Email, { foreignKey: 'emailId', as: 'email' });

Attachment.hasOne(ExtractedText, { foreignKey: 'attachmentId', as: 'extractedText' });
ExtractedText.belongsTo(Attachment, { foreignKey: 'attachmentId', as: 'attachment' });



const CsvData = sequelize.define('csvData', {
    attachmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'attachments',
            key: 'id'
        }
    },
    emailId: {
        type: Sequelize.STRING  // Removed references
    },
    threadId: {
        type: Sequelize.STRING  // Removed references
    },
    "1_Suma_alocata_2022": Sequelize.STRING,
    "2_Suma_alocata_2021": Sequelize.STRING,
    "3_Suma_alocata_2020": Sequelize.STRING,
    "4a_Numar_proiecte_2022": Sequelize.STRING,
    "4b_Suma_alocata_castigate_2022": Sequelize.STRING,
    "5a_Numar_proiecte_2021": Sequelize.STRING,
    "5b_Suma_alocata_castigate_2021": Sequelize.STRING,
    "6a_Numar_proiecte_2020": Sequelize.STRING,
    "6b_Suma_alocata_castigate_2020": Sequelize.STRING,
    "7a_Numar_asocieri_2022": Sequelize.STRING,
    "7b_Suma_alocata_asocieri_2022": Sequelize.STRING,
    "8a_Numar_asocieri_2021": Sequelize.STRING,
    "8b_Suma_alocata_asocieri_2021": Sequelize.STRING,
    "9a_Numar_asocieri_2020": Sequelize.STRING,
    "9b_Suma_alocata_asocieri_2020": Sequelize.STRING,
    "10_Plan_construire_centru_tineret": Sequelize.STRING,
    "11_Stadiu_termen_finalizare_centru_tineret": Sequelize.STRING,
    "12a_Numar_tineri_plecati_curent": Sequelize.STRING,
    "12b_Numar_tineri_plecati_ultimii_5_ani": Sequelize.STRING,
    "13a_Plan_angajare_lucratori_tineret": Sequelize.STRING,
    "13b_Plan_colaborare_ONG_tineret": Sequelize.STRING,
    "14_Numar_ proceduri_consultare": Sequelize.STRING,
}, {
    tableName: 'csvData'
});

module.exports = {
    Email,
    Attachment,
    ExtractedText,
    sequelize,
    Sequelize,
    SentEmail,
    CsvData,
    ResponseSummary
};
