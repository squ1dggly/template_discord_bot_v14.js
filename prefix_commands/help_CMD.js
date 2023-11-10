const { Client, Message } = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools");

const config = { client: require("../configs/config_client.json") };

module.exports = {
	name: "help",
	description: "View a list of my commands",

	/** @param {Client} client @param {Message} message */
	execute: async (client, message, { prefix }) => {
		let embed_help = new BetterEmbed();

		// Create an array out of the slash commands that have icons
		let prefixCommands = [...client.prefixCommands.values()].filter(cmd => cmd?.options?.icon);

		// The description to be added to the embed
		let embed_help_description = [];

		// prettier-ignore
		// Iterate through each slash command and append it to a string
		for (let _cmd of prefixCommands) embed_help_description.push(
			`- $CMD_ICON | **$PREFIX$CMD_NAME**\n - *$DESCRIPTION*`
				.replace("$CMD_ICON", _cmd.options.icon)
				.replace("$PREFIX", prefix)
				.replace("$CMD_NAME", _cmd.name)
				.replace("$DESCRIPTION", _cmd.description)
		);

		// prettier-ignore
		// Send the embed with the command list, if available
		if (embed_help_description.length) return await embed_help.reply(message, {
			description: embed_help_description.join("\n"),
            allowedMentions: { repliedUser: false }
		});

		// Send the embed with an error
		return await embed_help.reply(message, {
			description: "**There aren't any commands available**",
			allowedMentions: { repliedUser: false }
		});
	}
};
