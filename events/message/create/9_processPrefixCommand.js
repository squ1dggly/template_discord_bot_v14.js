/** @file Execute commands requested by a user message @author xsqu1znt */

const { Client, PermissionsBitField, Message, userMention } = require("discord.js");
const logger = require("../../../modules/logger");

const config = { client: require("../../../configs/config_client.json") };

function userIsBotAdminOrBypass(message, commandName) {
	// prettier-ignore
	return [config.client.OWNER_ID, ...config.client.ADMIN_IDS, ...(config.client.admin_bypass_ids[commandName] || [])]
		.includes(message.author.id);
}

function userIsGuildAdminOrBypass(message, commandName) {
	let isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
	let canBypass = userIsBotAdminOrBypass(message, commandName);

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

		// prettier-ignore
		// Filter out non-guild and non-command message
		if (!args.message.guild || !args.message.author.bot || !(args.message.content || "").startsWith(commandPrefix)) return;

		/// Parse the message
		let cleanContent = args.message.content.replace(commandPrefix, "");
		let commandName = cleanContent.split(" ")[0];
		if (!commandName) return;

		// Get the prefix command function from the client, if it exists
		let prefixCommand = client.prefixCommands.get(commandName) || null;
		if (!prefixCommand) return;

		// Execute the command
		try {
			// Parse slash command options
			if (prefixCommand?.options) {
				let _botAdminOnly = prefixCommand.options?.botAdminOnly;
				let _guildAdminOnly = prefixCommand.options?.guildAdminOnly;

				// prettier-ignore
				// Check if the command requires the user to be an admin for the bot
				if (_botAdminOnly && !userIsBotAdminOrBypass(args.message, commandName)) return await embed_error.send({
					channel: args.message.channel, description: "Only bot staff can use this command",
					ephemeral: true
				});

				// prettier-ignore
				// Check if the command requires the user to have admin permission in the current guild
				if (_guildAdminOnly && !userIsGuildAdminOrBypass(args.message, commandName)) return await embed_error.send({
					channel: args.message.channel, description: "You need admin to use this command",
					ephemeral: true
				});
			}
		} catch (err) {
			logger.error(
				"An error occurred: PRFX_CMD",
				`cmd: /${commandName} | guildID: ${args.message.guildId} | userID: ${args.message.author.id}`,
				err
			);
		}

		// Execute the prefix command's function
		return await prefixCommand.execute(client, args.message, { cleanContent, commandName }).then(async message => {
			// TODO: run code here after the command is finished
		});
	}
};
