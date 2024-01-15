/** @file Execute commands requested by a command interaction @author xsqu1znt */

const { Client, PermissionsBitField, GuildMember, BaseInteraction } = require("discord.js");
const { BetterEmbed } = require("../../../modules/discordTools");
const logger = require("../../../modules/logger");

const config = { client: require("../../../configs/config_client.json") };

/** @param {BaseInteraction} interaction */
function userIsBotAdminOrBypass(interaction) {
	return [
		config.client.OWNER_ID,
		...config.client.ADMIN_IDS,
		...(config.client.admin_bypass_ids[interaction.commandName] || [])
	].includes(interaction.user.id);
}

/** @param {BaseInteraction} interaction */
function userIsGuildAdminOrBypass(interaction) {
	let isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
	let canBypass = userIsBotAdminOrBypass(interaction);

	return isAdmin || canBypass;
}

/** @param {GuildMember} guildMember @param {PermissionsBitField[]} permissions */
function hasSpecialPermissions(guildMember, permissions) {
	let has = [];
	let missing = [];

	for (let permission of permissions) {
		if (guildMember.permissions.has(permission)) has.push(permission);
		else missing.push(`\`${markdown.permissionFlagName(permission)}\``);
	}

	return { has, missing, passed: has.length === permissions.length };
}

module.exports = {
	name: "processSlashCommand",
	event: "interaction_create",

	/** @param {Client} client @param {{interaction:BaseInteraction}} args */
	execute: async (client, args) => {
		// prettier-ignore
		// Filter out DM interactions
		if (!args.interaction.guildId) return args.interaction.reply({
			content: "Commands cannot be used in DMs.", ephemeral: true
		});

		// Filter out non-guild and non-command interactions
		if (!args.interaction.guild || !args.interaction.isCommand()) return;

		// Get the slash command function from the client if it exists
		let slashCommand = client.slashCommands.get(args.interaction.commandName) || null;
		// prettier-ignore
		if (!slashCommand) return await args.interaction.reply({
			content: `\`/${args.interaction.commandName}\` is not a command.`
        });

		/* - - - - - { Parse Prefix Command } - - - - - */
		try {
			// Check for command options
			if (prefixCommand?.options) {
				let _botAdminOnly = prefixCommand.options?.botAdminOnly || null;
				let _guildAdminOnly = prefixCommand.options?.guildAdminOnly || null;
				let userPermissions = prefixCommand.options?.userPermissions || null;
				let botPermissions = prefixCommand.options?.botPermissions || null;
				userPermissions &&= jt.isArray(userPermissions);
				botPermissions &&= jt.isArray(botPermissions);

				// prettier-ignore
				// Check if the command requires the user to be an admin for the bot
				if (_botAdminOnly && !userIsBotAdminOrBypass(args.interaction)) return await new BetterEmbed({
					color: "Red",
					interaction: args.interaction,
					description: `Only the developers of ${client.user} can use that command.`
				}).send({ ephemeral: true });

				// prettier-ignore
				// Check if the command requires the user to have admin permission in the current guild
				if (_guildAdminOnly && !userIsGuildAdminOrBypass(args.interaction)) return await new BetterEmbed({
					color: "Red",
					interaction: args.interaction,
					description: "You need admin to use that command."
				}).send({ ephemeral: true });

				// Check if the user has the required permissions
				if (userPermissions) {
					let _userPermissions = hasSpecialPermissions(args.interaction.member, userPermissions);

					if (!_userPermissions.passed) {
						// prettier-ignore
						// Create the embed :: { MISSING PERMS USER }
						let embed_missingPerms = new BetterEmbed({
							color: "Red",
							interaction: args.interaction,
							title: `User Missing ${_userPermissions.missing.length === 1 ? "Permission" : "Permissions"}`,
							description:  _userPermissions.missing.join(", ")
						});

						// Reply to the user with the embed
						return await embed_missingPerms.send();
					}
				}

				// Check if the bot has the required permissions
				if (botPermissions) {
					let _botPermissions = hasSpecialPermissions(args.interaction.guild.members.me, botPermissions);

					if (!_botPermissions.passed) {
						// prettier-ignore
						// Create the embed :: { MISSING PERMS BOT }
						let embed_missingPerms = new BetterEmbed({
							color: "Red",
							interaction: args.interaction,
							title: `Missing ${_botPermissions.missing.length === 1 ? "Permission" : "Permissions"}`,
							description: _botPermissions.missing.join(", ")
						});

						// Reply to the user with the embed
						return await embed_missingPerms.send();
					}
				}

				// prettier-ignore
				if (slashCommand.options?.deferReply)
					await args.interaction.deferReply().catch(() => null);
			}

			/* - - - - - { Execute } - - - - - */
			// prettier-ignore
			return await slashCommand.execute(client, args.interaction).then(async message => {
				// TODO: run code here after the command is finished
			});
		} catch (err) {
			// Create the embed :: { FATAL ERROR }
			let embed_fatalError = new BetterEmbed({
				interaction: args.interaction,
				title: "⛔ Oh no!",
				description: `An error occurred while using the **/\`${args.interaction.commandName}\`** command.`
			});

			// Let the user know an error occurred
			embed_fatalError.send({ ephemeral: true }).catch(() => null);

			// Log the error
			return logger.error(
				"Could not execute command",
				`SLSH_CMD: /${args.interaction.commandName} | guildID: ${args.interaction.guild.id} | userID: ${args.interaction.user.id}`,
				err
			);
		}
	}
};
