// prettier-ignore
const { Client, Events, PermissionFlagsBits, GuildMember, Message, userMention, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { BetterEmbed, markdown } = require("../../utils/discordTools");
const { guildManager } = require("../../utils/mongo");
const logger = require("../../utils/logger");
const jt = require("../../utils/jsTools");

const config = { client: require("../../configs/config_client.json") };

/** @param {Message} message @param {string} commandName */
function userIsBotAdminOrBypass(interaction) {
	let bypass = config.client.admin_bypass.find(b => b.COMMAND_NAME === interaction.commandName) || null;

	return [config.client.OWNER_ID, ...config.client.ADMIN_IDS, ...(bypass ? bypass.USER_IDS : [])].includes(
		interaction.user.id
	);
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
		let prefix = await guildManager.fetchPrefix(message.guild.id);

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

		// Check if the prefix command is guild Only
		if (prefixCommand?.options?.guildOnly && !message.guildId) return;

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
				}).send(message, { sendMethod: "messageReply", allowedMentions: { repliedUser: false } });

				// prettier-ignore
				// Check if the command requires the user to have admin permission in the current guild
				if (guildAdminOnly && !userIsGuildAdminOrBypass(message, commandName)) return await new BetterEmbed({
					color: "Red",
					description: "You need admin to use that command."
				}).send(message, { sendMethod: "messageReply", allowedMentions: { repliedUser: false } });

				// Check if the user has the required permissions
				if (specialUserPerms) {
					let _specialUserPerms = hasSpecialPermissions(message.member, specialUserPerms);

					// prettier-ignore
					if (!_specialUserPerms.passed) return await new BetterEmbed({
						color: "Red",
						title: `User Missing ${_specialUserPerms.missing.length === 1 ? "Permission" : "Permissions"}`,
						description:  _specialUserPerms.missing.join(", ")
					}).send(message, { sendMethod: "messageReply", allowedMentions: { repliedUser: false } });
				}

				// Check if the bot has the required permissions
				if (specialBotPerms) {
					let _specialBotPerms = hasSpecialPermissions(message.guild.members.me, specialBotPerms);

					// prettier-ignore
					if (!_specialBotPerms.passed) return await new BetterEmbed({
						color: "Red",
						title: `Bot Missing ${_specialBotPerms.missing.length === 1 ? "Permission" : "Permissions"}`,
						description: _specialBotPerms.missing.join(", ")
					}).send(message, { sendMethod: "messageReply", allowedMentions: { repliedUser: false } });
				}
			}

			/* - - - - - { Execute } - - - - - */
			let _args = { cleanContent, cmdName: commandName, prefix };

			// prettier-ignore
			return await prefixCommand.execute(client, message, _args).then(async message => {
				// TODO: run code here after the command is finished
			});
		} catch (err) {
			if (config.client.support_server.INVITE_URL) {
				// Create the embed :: { FATAL ERROR }
				let embed_fatalError = new BetterEmbed({
					title: "⛔ Oh no!",
					description: `An error occurred while using the **\`${commandName}\`** command.`
				});

				// Let the user know an error occurred
				embed_fatalError.send(message, { sendMethod: "messageReply", allowedMentions: { repliedUser: false } });
			} else {
				// Create a button :: { SUPPORT SERVER }
				let btn_supportServer = new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setURL(config.client.support_server.INVITE_URL)
					.setLabel("Support Server");

				// Create an action row :: { SUPPORT SERVER }
				let aR_supportServer = new ActionRowBuilder().setComponents(btn_supportServer);

				// Create the embed :: { FATAL ERROR }
				let embed_fatalError = new BetterEmbed({
					color: "Red",
					title: "⛔ Ruh-roh raggy!",
					description: `An error occurred while using the **\`${commandName}\`** command.\nYou should probably report this unfortunate occurrence somewhere.`,
					footer: "but frankly, I'd rather you didn't"
				});

				// Let the user know an error occurred
				embed_fatalError.send(message, {
					sendMethod: "messageReply",
					components: interaction.guild.id !== config.client.support_server.GUILD_ID ? aR_supportServer : [],
					allowedMentions: { repliedUser: false }
				});
			}

			// Log the error to the console
			return logger.error(
				"Could not execute command",
				`PRFX_CMD: ${prefix}${commandName} | guildID: '${message.guild.id}' | userID: '${message.author.id}'`,
				err
			);
		}
	}
};
