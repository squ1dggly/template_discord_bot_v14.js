/** @file Execute commands requested by a command interaction @author xsqu1znt */

const { Client, PermissionsBitField, BaseInteraction } = require("discord.js");
const logger = require("../../../modules/logger");

const config = { client: require("../../../configs/config_client.json") };

function userIsBotAdminOrBypass(interaction) {
	// prettier-ignore
	return [config.client.OWNER_ID, ...config.client.ADMIN_IDS, ...(config.client.admin_bypass_ids[interaction.commandName] || [])]
		.includes(interaction.user.id);
}

function userIsGuildAdminOrBypass(interaction) {
	let isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
	let canBypass = userIsBotAdminOrBypass(interaction);

	return isAdmin || canBypass;
}

module.exports = {
	name: "process_slashCommand",
	event: "interaction_create",

	/** @param {Client} client @param {{interaction:BaseInteraction}} args */
	execute: async (client, args) => {
		// Filter out non-guild and non-command interactions
		if (!args.interaction.guild || !args.interaction.isCommand()) return;

		// Get the slash command function from the client if it exists
		let slashCommand = client.slashCommands.get(args.interaction.commandName) || null;
		// prettier-ignore
		if (!slashCommand) return await embed_error.send({
			description: `\`/${args.interaction.commandName}\` is not a command`
        });

		// Execute the command
		try {
			// Parse slash command options
			if (slashCommand?.options) {
				let _botAdminOnly = slashCommand.options?.botAdminOnly;
				let _guildAdminOnly = slashCommand.options?.guildAdminOnly;

				// Check if the command requires the user to be an admin for the bot
				// prettier-ignore
				if (_botAdminOnly && !userIsBotAdminOrBypass(args.interaction)) return await embed_error.send({
					description: "Only bot staff can use this command", ephemeral: true
				});

				// Check if the command requires the user to have admin in the current guild
				// prettier-ignore
				if (_guildAdminOnly && !userIsGuildAdminOrBypass(args.interaction)) return await embed_error.send({
					description: "You need admin to use this command", ephemeral: true
				});
			}
		} catch (err) {
			logger.error(
				"An error occurred: SLSH_CMD",
				`cmd: /${args.interaction.commandName} | guildID: ${args.interaction.guild.id} | userID: ${args.interaction.user.id}`,
				err
			);
		}

		// prettier-ignore
		if (slashCommand?.options?.deferReply)
            try { await args.interaction.deferReply(); } catch {}

		// Execute the slash command's function
		return await slashCommand.execute(client, args.interaction).then(async message => {
			// TODO: run code here after the command is finished
		});
	}
};
