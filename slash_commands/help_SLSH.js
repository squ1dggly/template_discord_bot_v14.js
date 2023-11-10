const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools");

module.exports = {
	options: { deferReply: false },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("help")
        .setDescription("View a list of my commands"),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		let embed_help = new BetterEmbed({ interaction, timestamp: true });

		// Create an array out of the slash commands that have icons
		let slashCommands = [...client.slashCommands.values()].filter(slsh => slsh?.options?.icon);

		// The description to be added to the embed
		let embed_help_description = [];

		// prettier-ignore
		// Iterate through each slash command and append it to a string
		for (let _slsh of slashCommands) embed_help_description.push(
			`- **\`$CMD_ICON /$CMD_NAME\`**\n - *$DESCRIPTION*`
				.replace("$CMD_ICON", _slsh.options.icon)
				.replace("$CMD_NAME", _slsh.builder.name)
				.replace("$DESCRIPTION", _slsh.builder.description)
		);

		// prettier-ignore
		// Send the embed with the command list, if available
		if (embed_help_description.length) return await embed_help.send({
			description: embed_help_description.join("\n"),
		});

		// Send the embed with an error
		return await embed_help.send({ description: "**There aren't any commands available**" });
	}
};
