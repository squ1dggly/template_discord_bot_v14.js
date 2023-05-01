// Connects us to our Mongo database so we can save and retrieve data.

const logger = require('./logger');

// Models
const models = {
    // user: require('../models/userModel')
};

const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI;

//! Database Operations

module.exports = {
    /** Connect to MongoDB */
    connect: () => {
        mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => logger.success("successfully connected to MongoDB"))
            .catch(err => logger.error("failed to connect to MongoDB", null, err));
    }
};