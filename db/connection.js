require('dotenv').config();
const mongoose = require('mongoose');
const neo4j = require('neo4j-driver');
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
        console.log('mongo database connection error ' + err);
    })

    // on connection
    mongoose.connection.on('connected', () => {
        console.log('Connected to Mongo database ');
    });

    // on disconnection

    mongoose.connection.on('disconnected', () => {
        console.log('Mongodb disconnected!');
    });
};


module.exports = {
    connectToMongoDb
};