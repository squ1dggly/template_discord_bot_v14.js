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
            "Hey, %USER! Have a cookie! :cookie:",
            "%USER. It's your lucky day! Have a glass of milk! :milk:",
        ];

		let response = _jsT.choice(choices).replace("%USER", interaction.user);
		return await interaction.reply({ content: response });
	}
};
