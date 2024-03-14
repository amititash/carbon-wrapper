require('dotenv').config();
const mongoose = require('mongoose');
const { constants } = require('../config');

/*
    * Method for connecting to mongoDB
*/
const connectToMongoDb = () => {

    // connect to database
    mongoose.connect(constants.DATABASE, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    // on error
    mongoose.connection.on('error', (err) => {
        console.log('database connection error ' + err);
    })

    // on connection
    mongoose.connection.on('connected', () => {
        console.log('connected to database ');
    });

    // on disconnection

    mongoose.connection.on('disconnected', () => {
        console.log('Mongodb disconnected!');
    });
};

module.exports = {
    connectToMongoDb,
};