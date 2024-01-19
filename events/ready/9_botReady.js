const { Client, Events } = require("discord.js");
const { name } = require("../../package.json");
const logger = require("../../utils/logger");

/** @type {import("../../configs/typedefs.js").EventExports} */
module.exports = {
	name: "clientReady",
	eventType: Events.ClientReady,

	/** @param {Client} client  */
	execute: async client => {
		logger.success(`${name} successfully connected to Discord`);
	}
};
