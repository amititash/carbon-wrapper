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

/*
    * Method for connecting to neo4j
*/

const connectToNeo4j = () => {
    const uri = constants.Neo4j_URI;
    const user = constants.Neo4j_USER;
    const password = constants.Neo4j_PASSWORD;
    const dbName = constants.Neo4j_DATABASE;

    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session({ database: dbName });

    //Neo4j connection status
    driver.getServerInfo()
        .then((serverInfo) => {
            console.log('Connected to Neo4j on :', serverInfo.address);
        })
        .catch((error) => {
            console.error('Failed to connect to Neo4j:', error.message);
        });

    // Handle driver errors
    driver.onError = (error) => {
        console.error('Neo4j driver instantiation failed:', error);
    };

    return session;
};


module.exports = {
    connectToMongoDb,
    connectToNeo4j
};