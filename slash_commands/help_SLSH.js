const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");
const { BetterEmbed, EmbedNavigator } = require("../../utils/discordTools");
const jt = require("../../utils/jsTools");

/** @type {import("../../configs/typedefs").SlashCommandExports} */
module.exports = {
	category: "Utility",
	options: { hidden: true },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("help")
		.setDescription("View a list of my commands"),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		// Get the current slash commands and filter out ones that are set to be hidden
		let commands = [...client.slashCommands.all.values()].filter(cmd => !cmd?.options?.hidden);

		// Check if there's available commands
		if (!commands.length)
			return await new BetterEmbed({ title: "There aren't any commands available." }).send({ interaction });

		// Get the available categories
		let command_categories = jt.unique(
			commands.map(cmd => ({ name: cmd.category || "Other", icon: cmd.categoryIcon || null })),
			"name"
		);

		// Sort the categories alphabetically
		command_categories.sort((a, b) => a.name.localeCompare(b.name));

		// Parse slash commands into a readable format
		let commands_f = [];

		// Iterate through each slash command
		for (let cmd of commands) {
			// the main line
			let _f = "- $ICON**/$COMMAND**"
				.replace("$ICON", cmd?.options?.icon ? `${cmd.options.icon} | ` : "")
				.replace("$COMMAND", cmd.builder.name);

			/* - - - - - { Extra Command Options } - - - - - */
			let _extra = [];

			// prettier-ignore
			if (cmd.builder?.description)
				_extra.push(` - *${cmd.builder.description}*`);

			// Append the extra options to the main line
			if (_extra.length) _f += `\n${_extra.join("\n")}`;

			// Push the formatted command to the main array
			commands_f.push({ str: _f, name: cmd.builder.name, category: cmd.category || "Other" });
		}

		// Create an array to store each group of embeds for each command category
		let embeds_categories = [];

		// Iterate through the command categories and create the appropriate command pages
		for (let category of command_categories) {
			// Get all the commands for the current category
			let _cmds = commands_f.filter(cmd => cmd.category === category.name);
			// Skip empty categories
			if (!_cmds.length) continue;

			// Sort commands by alphabetical order
			_cmds.sort((a, b) => a.name.localeCompare(b.name));

			// Make it a max of 10 command per page
			let _cmds_split = jt.chunk(_cmds, 10);

			// Create an array to store each "page" for the current category
			let _embeds = [];

			// Create an embed for each page
			for (let i = 0; i < _cmds_split.length; i++) {
				let group = _cmds_split[i];

				// Create the embed :: { COMMANDS (PAGE) }
				let _embed = new BetterEmbed({
					title: `Help | ${category.icon ? `${category.icon} ` : ""}${category.name}`,
					description: group.map(g => g.str).join("\n"),
					footer: `Page ${i + 1} of ${_cmds_split.length} | Total: ${_cmds.length}`
				});

				// Push the embed to the array
				_embeds.push(_embed);
			}

			// Push the embed array to the main command category array
			if (_embeds.length) embeds_categories.push(_embeds);
		}

		// Setup page navigation
		let embedNav = new EmbedNavigator({
			interaction,
			embeds: embeds_categories,
			pagination: { type: "short", dynamic: false },
			selectMenuEnabled: true
		});

		// Configure select menu options
		embedNav.addSelectMenuOptions(...command_categories.map(cat => ({ emoji: cat.icon, label: cat.name })));

		// Send the navigator
		return await embedNav.send();
	}
};
