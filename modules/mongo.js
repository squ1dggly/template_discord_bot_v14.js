// Connects us to our Mongo database so we can save and retrieve data.

const logger = require('./logger');

// Models
const models = {
    // users: require('../models/users');
};

const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI;

// Connect to Mongo
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => logger.success("successfully connected to MongoDB"))
    .catch(err => logger.error("failed to connect to MongoDB", null, err));

//! Database Functions
module.exports = {

};

//! Helper Functions