const { Client, Events, PermissionFlagsBits, GuildMember, Message, userMention } = require("discord.js");
const { BetterEmbed, markdown } = require("../../utils/discordTools/index.js");
const { guildManager } = require("../../utils/mongo");
const logger = require("../../utils/logger");
const jt = require("../../utils/jsTools");

const config = { client: require("../../configs/config_client.json") };

/** @param {Message} message @param {string} commandName */
function userIsBotAdminOrBypass(message, commandName) {
	return [
		config.client.OWNER_ID,
		...config.client.ADMIN_IDS,
		...(config.client.admin_bypass_ids[commandName] || [])
	].includes(message.author.id);
}

/** @param {Message} message @param {string} commandName */
function userIsGuildAdminOrBypass(message, commandName) {
	let isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);
	let canBypass = userIsBotAdminOrBypass(message, commandName);

	return isAdmin || canBypass;
}

/** @param {GuildMember} guildMember @param {PermissionFlagsBits[]} permissions */
function hasSpecialPermissions(guildMember, permissions) {
	let has = [];
	let missing = [];

	for (let permission of permissions) {
		if (guildMember.permissions.has(permission)) has.push(permission);
		else missing.push(`\`${markdown.permissionFlagName(permission)}\``);
	}

	return { has, missing, passed: has.length === permissions.length };
}

/** @type {import("../../configs/typedefs.js").EventExports} */
module.exports = {
	name: "processPrefixCommand",
	eventType: Events.MessageCreate,

	/** @param {Client} client @param {Message} message */
	execute: async (client, message) => {
		// Filter out non-guild, non-user, and non-command messages
		if (!message?.guild || !message?.author || message?.author?.bot || !message?.content) return;

		// prettier-ignore
		// Check if we have permission to send messages in this channel
		if (!message.guild.members.me.permissionsIn(message.channel).has(PermissionFlagsBits.SendMessages)) return;

		/* - - - - - { Check for Prefix } - - - - - */
		let prefix = (await guildManager.fetchPrefix(message.guild.id)) || null;

		// Check if the message started with the prefix
		let prefixWasUsed = message.content.toLowerCase().startsWith(prefix);

		// If that failed, check if the message started with a mention to the client
		if (!prefixWasUsed) {
			prefixWasUsed = message.content.startsWith(`${userMention(client.user.id)} `);
			// Change the prefix to the client mention
			prefix = `${userMention(client.user.id)} `;

			// Return if no valid prefixes were used
			if (!prefixWasUsed) return;
		}

		/* - - - - - { Parse the Message } - - - - - */
		let cleanContent = message.content.replace(prefix, "");
		let commandName = cleanContent.split(" ")[0];
		if (!commandName) return;

		cleanContent = cleanContent.replace(commandName, "").trim();

		// Get the prefix command function from the client, if it exists
		let prefixCommand = client.prefixCommands.get(commandName) || null;
		if (!prefixCommand) return;

		/* - - - - - { Parse Prefix Command } - - - - - */
		try {
			// Check for command options
			if (prefixCommand?.options) {
				let botAdminOnly = prefixCommand.options?.botAdminOnly || null;
				let guildAdminOnly = prefixCommand.options?.guildAdminOnly || null;
				let specialUserPerms = prefixCommand.options?.specialUserPerms || null;
				let specialBotPerms = prefixCommand.options?.specialBotPerms || null;
				specialUserPerms &&= jt.forceArray(specialUserPerms);
				specialBotPerms &&= jt.forceArray(specialBotPerms);

				// prettier-ignore
				// Check if the command requires the user to be an admin for the bot
				if (botAdminOnly && !userIsBotAdminOrBypass(message, commandName)) return await new BetterEmbed({
					color: "Red",
					description: `Only the developers of ${client.user} can use that command.`
				}).reply(message, { allowedMentions: { repliedUser: false } });

				// prettier-ignore
				// Check if the command requires the user to have admin permission in the current guild
				if (guildAdminOnly && !userIsGuildAdminOrBypass(message, commandName)) return await new BetterEmbed({
					color: "Red",
					description: "You need admin to use that command."
				}).reply(message, { allowedMentions: { repliedUser: false } });

				// Check if the user has the required permissions
				if (specialUserPerms) {
					let _specialUserPerms = hasSpecialPermissions(message.member, specialUserPerms);

					// prettier-ignore
					if (!_specialUserPerms.passed) return await new BetterEmbed({
						color: "Red",
						title: `User Missing ${_specialUserPerms.missing.length === 1 ? "Permission" : "Permissions"}`,
						description:  _specialUserPerms.missing.join(", ")
					}).reply(message, { allowedMentions: { repliedUser: false } });
				}

				// Check if the bot has the required permissions
				if (specialBotPerms) {
					let _specialBotPerms = hasSpecialPermissions(message.guild.members.me, specialBotPerms);

					// prettier-ignore
					if (!_specialBotPerms.passed) return await new BetterEmbed({
						color: "Red",
						title: `Missing ${_specialBotPerms.missing.length === 1 ? "Permission" : "Permissions"}`,
						description: _specialBotPerms.missing.join(", ")
					}).reply(message, { allowedMentions: { repliedUser: false } });
				}
			}

			/* - - - - - { Execute } - - - - - */
			let _args = { cleanContent, cmdName: commandName, prefix };

			// prettier-ignore
			return await prefixCommand.execute(client, message, _args).then(async message => {
				// TODO: run code here after the command is finished
			});
		} catch (err) {
			// Create the embed :: { FATAL ERROR }
			let embed_fatalError = new BetterEmbed({
				title: "⛔ Oh no!",
				description: `An error occurred while running the **\`${commandName}\`** command.`
			});

			// Let the user know an error occurred
			embed_fatalError.reply(message, { allowedMentions: { repliedUser: false } }).catch(() => null);

			// Log the error
			return logger.error(
				"Could not execute command",
				`PRFX_CMD: ${prefix}${commandName} | guildID: ${message.guild.id} | userID: ${message.author.id}`,
				err
			);
		}
	}
};
