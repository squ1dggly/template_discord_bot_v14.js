const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools/_dsT");
const _jsT = require("../modules/jsTools/_jsT");

module.exports = {
	// prettier-ignore
	builder: new SlashCommandBuilder().setName("cookie")
        .setDescription("Get a cookie, or a glass of milk."),

	// ownerOnly: true, // Only allow the owner and admins defined in config_client to use this command
	// requireGuildAdmin: true, // Only allow users with admin to use this command

	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 */
	execute: async (client, interaction) => {
		// prettier-ignore
		let choices = [
            "Hey, $USER! Have a cookie! :cookie:",
            "$USER. It's your lucky day! Have a glass of milk! :milk:",
        ];

		// prettier-ignore
		let embed_cookie = new BetterEmbed({
			interaction, author: { text: "I am an embed", user: interaction.member },
			description: _jsT.choice(choices)
		});

		return await embed_cookie.send();
	}
};
