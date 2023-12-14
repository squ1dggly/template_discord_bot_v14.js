/*** @file Connects us to our Mongo database so we can save and retrieve data. */

const mongoose = require("mongoose");
const logger = require("../logger");

/* const models = {
	user: require("../models/userModel').model
}; */

const MONGO_URI = process.env.MONGO_URI || require("../../configs/config_client.json").MONGO_URI;

module.exports = {
	/** Connect to MongoDB */
	connect: async (uri = MONGO_URI) => {
		// Try to connect to MongoDB
		let connection = await new Promise((resolve, reject) => {
			return mongoose
				.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
				.then(() => resolve(true))
				.catch(err => reject(err));
		});

		// Log the success if connected
		if (connection) return logger.success("Successfully connected to MongoDB");

		// Log the error if the connection failed
		logger.error("Failed to connect to MongoDB", null, connection);
	}
};
