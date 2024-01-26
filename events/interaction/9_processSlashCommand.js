const { Client, Events, PermissionFlagsBits, GuildMember, BaseInteraction } = require("discord.js");
const { BetterEmbed, markdown } = require("../../utils/discordTools/index.js");
const logger = require("../../utils/logger.js");
const jt = require("../../utils/jsTools");

const config = { client: require("../../configs/config_client.json") };

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
	let isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Flags.Administrator);
	let canBypass = userIsBotAdminOrBypass(interaction);

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
	name: "processSlashCommand",
	eventType: Events.InteractionCreate,

	/** @param {Client} client @param {BaseInteraction} interaction */
	execute: async (client, interaction) => {
		// prettier-ignore
		// Filter out DM interactions
		if (!interaction.guildId) return interaction.reply({
			content: "Commands cannot be used in DMs.", ephemeral: true
		});

		// Filter out non-guild and non-command interactions
		if (!interaction.guild || !interaction.isCommand()) return;

		// Get the slash command function from the client if it exists
		let slashCommand = client.slashCommands.get(interaction.commandName) || null;
		// prettier-ignore
		if (!slashCommand) return await interaction.reply({
			content: `\`/${interaction.commandName}\` is not a command.`
        });

		/* - - - - - { Parse Prefix Command } - - - - - */
		try {
			// Check for command options
			if (slashCommand?.options) {
				let botAdminOnly = slashCommand.options?.botAdminOnly || null;
				let guildAdminOnly = slashCommand.options?.guildAdminOnly || null;
				let specialUserPerms = slashCommand.options?.specialUserPerms || null;
				let specialBotPerms = slashCommand.options?.specialBotPerms || null;
				specialUserPerms &&= jt.forceArray(specialUserPerms);
				specialBotPerms &&= jt.forceArray(specialBotPerms);

				// prettier-ignore
				// Check if the command requires the user to be an admin for the bot
				if (botAdminOnly && !userIsBotAdminOrBypass(interaction)) return await new BetterEmbed({
					color: "Red",
					interaction: interaction,
					description: `Only the developers of ${client.user} can use that command.`
				}).send({ ephemeral: true });

				// prettier-ignore
				// Check if the command requires the user to have admin permission in the current guild
				if (guildAdminOnly && !userIsGuildAdminOrBypass(interaction)) return await new BetterEmbed({
					color: "Red",
					interaction: interaction,
					description: "You need admin to use that command."
				}).send({ ephemeral: true });

				// Check if the user has the required permissions
				if (specialUserPerms) {
					let _specialUserPerms = hasSpecialPermissions(interaction.member, specialUserPerms);

					// prettier-ignore
					if (!_specialUserPerms.passed) return await new BetterEmbed({
						color: "Red",
						interaction: interaction,
						title: `User Missing ${_specialUserPerms.missing.length === 1 ? "Permission" : "Permissions"}`,
						description:  _specialUserPerms.missing.join(", ")
					}).send();
				}

				// Check if the bot has the required permissions
				if (specialBotPerms) {
					let _specialBotPerms = hasSpecialPermissions(interaction.guild.members.me, specialBotPerms);

					// prettier-ignore
					if (!_specialBotPerms.passed) return await new BetterEmbed({
						color: "Red",
						interaction: interaction,
						title: `Missing ${_specialBotPerms.missing.length === 1 ? "Permission" : "Permissions"}`,
						description: _specialBotPerms.missing.join(", ")
					}).send();
				}

				// prettier-ignore
				if (slashCommand.options?.deferReply)
					await interaction.deferReply().catch(() => null);
			}

			/* - - - - - { Execute } - - - - - */
			// prettier-ignore
			return await slashCommand.execute(client, interaction).then(async message => {
				// TODO: run code here after the command is finished
			});
		} catch (err) {
			// Create the embed :: { FATAL ERROR }
			let embed_fatalError = new BetterEmbed({
				interaction: interaction,
				title: "⛔ Oh no!",
				description: `An error occurred while using the **/\`${interaction.commandName}\`** command.`
			});

			// Let the user know an error occurred
			embed_fatalError.send({ ephemeral: true }).catch(() => null);

			// Log the error
			return logger.error(
				"Could not execute command",
				`SLSH_CMD: /${interaction.commandName} | guildID: ${interaction.guild.id} | userID: ${interaction.user.id}`,
				err
			);
		}
	}
};
