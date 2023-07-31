const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");

const { BetterEmbed } = require(`../modules/discordTools/_dsT`);
const _jsT = require(`../modules/jsTools/_jsT`);

module.exports = {
	options: { deferReply: false },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("help")
        .setDescription("View a list of my commands"),

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
            description: _jsT.choice(choices), showTimestamp: true
        });

		return await embed_cookie.send();
	}
};
