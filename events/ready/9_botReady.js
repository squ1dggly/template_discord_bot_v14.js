/** @file Executed as soon as the bot's connected to Discord @author xsqu1znt */

const { Client } = require("discord.js");
const { name } = require("../../package.json");
const logger = require("../../modules/logger");

module.exports = {
	name: "BOT_READY",
	event: "ready",

	/** @param {Client} client  */
	execute: async client => {
		logger.success(`${name} successfully connected to Discord`);
	}
};
