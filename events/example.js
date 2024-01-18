const { Client, Events, BaseInteraction } = require("discord.js");
const logger = require("../../../utils/logger");

module.exports = {
	name: "EVENT_NAME",
	event: Events.InteractionCreate,

	/** @param {Client} client @param {BaseInteraction} interaction */
	execute: async (client, interaction) => {
		logger.log(`${interaction.user.username} triggered an interaction`);
	}
};
