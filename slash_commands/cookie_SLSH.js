const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");
const { BetterEmbed } = require("../utils/discordTools");
const jt = require("../utils/jsTools");

/** @type {import("../configs/typedefs").SlashCommandExports} */
module.exports = {
	category: "Fun",
	options: { icon: "🍪" },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("cookie")
		.setDescription("Get a cookie or a glass of milk"),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		// Create an array of responses
		let choices = [
			"What's up, **$USERNAME**! Have a cookie! :cookie:",
			"Hey, **$USERNAME**! Have a glass of milk! :milk:"
		];

		// Create the embed :: { COOKIE }
		let embed_cookie = new BetterEmbed({
			interaction,
			description: jt.choice(choices)
		});

		// Reply to the interaction with the embed
		return await embed_cookie.send();
	}
};
