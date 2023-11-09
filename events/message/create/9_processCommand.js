/* Executes commands requested by a command interaction. */

const { Client, Message, PermissionsBitField, userMention } = require("discord.js");

const { OWNER_ID, ADMIN_IDS, admin_bypass_ids } = require("../../../configs/config_client.json");
const logger = require("../../../modules/logger");

const config = { client: require("../../../configs/config_client.json") };

function userIsBotAdminOrBypass(interaction) {
	return [OWNER_ID, ...ADMIN_IDS, ...(admin_bypass_ids[interaction.commandName] || [])].includes(interaction.user.id);
}

function userIsGuildAdminOrBypass(interaction) {
	let isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
	let canBypass = userIsBotAdminOrBypass(interaction);

	return isAdmin || canBypass;
}

module.exports = {
	name: "process_prefixCommand",
	event: "message_create",

	/** @param {Client} client @param {{message:Message}} args */
    execute: async (client, args) => {
        // prettier-ignore
        let commandPrefix = config.client.PREFIX
            .replace("$MENTION", userMention(args.message.guild.members.me.id));

		// Filter out non-guild and non-command message
		if (!args.message.guild || !args.message.content.startsWith(commandPrefix)) return;

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
