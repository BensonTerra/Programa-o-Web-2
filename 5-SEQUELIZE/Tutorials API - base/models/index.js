const dbConfig = require('../config/db.config.js');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect
    ,
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection do DB has been established successfully.');
    } catch (err) {
        console.error('Unable to connect to the database:', err);
    }
})();

const db = {};
//export the sequelize object (DB connection)
db.sequelize = sequelize;
//export TUTORIAL model
db.tutorial = require("./tutorials.model.js")(sequelize, DataTypes);
//export COMMENT model
db.comment = require("./comments.model.js")(sequelize, DataTypes);
//export TAGS model
db.tag = require("./tags.model.js")(sequelize, DataTypes);

// Nota: Criar relação 1:N
// 1:N
db.tutorial.hasMany(db.comment, {onDelete: 'CASCADE'})
db.comment.belongsTo(db.tutorial)

// Nota: Criar relação N:M
db.tutorial.belongsToMany(db.tag, {
    through: 'TagsInTutorials', timestamps: false
})
db.tag.belongsToMany(db.tutorial, {
    through: 'TagsInTutorials', timestamps: false
})

// // optionally: SYNC
// (async () => {
//     try {
//         // await sequelize.sync({ force: true }); // creates tables, dropping them first if they already existed
//         // await sequelize.sync({ alter: true }); // checks the tables in the database (which columns they have, what are their data types, etc.), and then performs the necessary changes to make then match the models
//         // await sequelize.sync(); // creates tables if they don't exist (and does nothing if they already exist)
//         console.log('DB is successfully synchronized')
//     } catch (error) {
//         console.log(error)
//     }
// })();

module.exports = db;
