require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const carbonRoutes = require('./routes/carbonRoutes');
const browseRoutes = require('./routes/browseAIroutes');
const { constants } = require('./config');
const { connectToMongoDb } = require('./db');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = constants.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

//carbon routes
app.use('/carbon', carbonRoutes);
app.use('/browse', browseRoutes);

//connect to mongo DB
connectToMongoDb();

// Start the server
app.listen(port, () => {
    console.log('Server is listening on port  ' + port);
});
