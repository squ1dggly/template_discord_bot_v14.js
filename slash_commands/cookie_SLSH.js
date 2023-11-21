const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools");
const jt = require("../modules/jsTools");

module.exports = {
	options: { icon: "🍪", deferReply: false },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("cookie")
		.setDescription("Get a cookie or a glass of milk"),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		// prettier-ignore
		let choices = [
			"What's up, **$USERNAME**! Have a cookie! :cookie:",
			"Hey, **$USERNAME**! Have a glass of milk! :milk:",
		];

		// prettier-ignore
		let embed_cookie = new BetterEmbed({
			interaction, author: { user: interaction.member },
			description: jt.choice(choices)
		});

		return await embed_cookie.send();
	}
};
