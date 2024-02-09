/*** @file Connects us to our Mongo database so we can save and retrieve data */

const mongoose = require("mongoose");
const logger = require("../logger");

const models = {
	guild: require("../../models/guildModel").model
};

const config = { client: require("../../configs/config_client.json") };

const MONGO_URI = process.env.MONGO_URI || config.client.MONGO_URI;
const MONGO_URI_DEV = process.env.MONGO_URI_DEV || config.client.MONGO_URI_DEV;
const DEV_MODE = process.env.DEV_MODE === "true" ? true : false || config.client.DEV_MODE || false;

module.exports = {
	models,

	guildManager: require("./guildManager"),

	/** Connect to MongoDB */
	connect: async (uri = DEV_MODE ? MONGO_URI_DEV : MONGO_URI) => {
		/* - - - - - { Check for MONGO_URI } - - - - - */
		if (DEV_MODE && !MONGO_URI_DEV) return logger.error("MONGO_URI Missing", "DEV_MODE is enabled, but MONGO_URI_DEV is not set");
		if (!uri) return logger.error("MONGO_URI Missing", "MONGO_URI is not set");

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
	},

	/** Ping MongoDB */
	ping: async () => {
		if (!mongoose.connection) return "n/a";

		let before = Date.now();
		await mongoose.connection.db.admin().ping();
		let after = Date.now();

		return after - before;
	}
};
