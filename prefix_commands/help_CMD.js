const { Client, Message } = require("discord.js");
const { BetterEmbed, EmbedNavigator } = require("../utils/discordTools");
const jt = require("../utils/jsTools");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "help",
	description: "View a list of my commands",
	category: "Utility",

	options: { hidden: true },

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
	execute: async (client, message, { prefix }) => {
		// Get the current prefix commands and filter out ones that are set to be hidden
		// also filters out un-unique commands to prevent double when commands have aliases
		let commands = jt.unique(
			[...client.prefixCommands.values()].filter(cmd => !cmd?.options?.hidden),
			"name"
		);

		// Check if there's available commands
		if (!commands.length) return await new BetterEmbed({ title: "There aren't any commands available." }).reply(message);

		// Get the available categories
		let command_categories = jt.unique(
			commands.map(cmd => ({ name: cmd.category || "Other", icon: cmd.categoryIcon || null })),
			"name"
		);

		// Sort the categories alphabetically
		command_categories.sort((a, b) => a.name - b.name);

		// Parse prefix commands into a readable format
		let commands_f = [];

		// Iterate through each prefix command
		for (let cmd of commands) {
			// the main line
			let _f = "- $ICON**$PREFIX$COMMAND**"
				.replace("$ICON", cmd?.options?.icon ? `${cmd.options.icon} | ` : "")
				.replace("$PREFIX", prefix)
				.replace("$COMMAND", cmd.name);

			/* - - - - - { Extra Command Options } - - - - - */
			let _extra = [];

			// prettier-ignore
			if (cmd?.description)
				_extra.push(` - *${cmd.description}*`);

			// prettier-ignore
			if (cmd?.aliases?.length)
				_extra.push(` - aliases: ${cmd.aliases.map(a => `\`${a}\``).join(", ")}`);

			// prettier-ignore
			if (cmd?.usage)
				_extra.push(` - usage: \`${cmd.usage}\``);

			// Append the extra options to the main line
			if (_extra.length) _f += `\n${_extra.join("\n")}`;

			// Push the formatted command to the main array
			commands_f.push({ str: _f, name: cmd.name, category: cmd.category || "Other" });
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
			channel: message.channel,
			embeds: embeds_categories,
			pagination: { type: "short", dynamic: false },
			selectMenuEnabled: true
		});

		// Configure select menu options
		embedNav.addSelectMenuOptions(...command_categories.map(cat => ({ emoji: cat.icon, label: cat.name })));

		// Send the navigator
		return await embedNav.reply(message, { allowedMentions: { repliedUser: false } });
	}
};
