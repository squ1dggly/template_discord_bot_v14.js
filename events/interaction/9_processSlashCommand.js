// prettier-ignore
const { Client, Events, PermissionFlagsBits, GuildMember, BaseInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { BetterEmbed, markdown } = require("../../utils/discordTools/index.js");
const logger = require("../../utils/logger.js");
const jt = require("../../utils/jsTools");

const config = { client: require("../../configs/config_client.json") };

/** @param {BaseInteraction} interaction */
function userIsBotAdminOrBypass(interaction) {
	let bypass = config.client.admin_bypass.find(b => b.COMMAND_NAME === interaction.commandName) || null;

	return [config.client.OWNER_ID, ...config.client.ADMIN_IDS, ...(bypass ? bypass.USER_IDS : [])].includes(
		interaction.user.id
	);
}

/** @param {BaseInteraction} interaction */
function userIsGuildAdminOrBypass(interaction) {
	let isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
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
		if (!interaction.commandName || !interaction.isCommand()) return;

		let slashCommand = client.slashCommands.all.get(interaction.commandName) || null;

		// prettier-ignore
		// Slash command not found
		if (!slashCommand) return await interaction.reply({
			content: `\`/${interaction.commandName}\` is not a command.`
		}).catch(() => null);

		// prettier-ignore
		// Check if the slash command is guild Only
		if (slashCommand?.options?.guildOnly && !interaction.guildId) return interaction.reply({
			content: "This command cannot be used outside of a guild.", ephemeral: true
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
					description: `Only the developers of ${client.user} can use this command.`
				}).send(interaction, { ephemeral: true });

				// prettier-ignore
				// Check if the command requires the user to have admin permission in the current guild
				if (guildAdminOnly && !userIsGuildAdminOrBypass(interaction)) return await new BetterEmbed({
					color: "Red",
					description: "You need admin to use this command."
				}).send(interaction, { ephemeral: true });

				// Check if the user has the required permissions
				if (specialUserPerms) {
					let _specialUserPerms = hasSpecialPermissions(interaction.member, specialUserPerms);

					// prettier-ignore
					if (!_specialUserPerms.passed) return await new BetterEmbed({
						color: "Red",
						title: `User Missing ${_specialUserPerms.missing.length === 1 ? "Permission" : "Permissions"}`,
						description:  _specialUserPerms.missing.join(", ")
					}).send(interaction);
				}

				// Check if the bot has the required permissions
				if (specialBotPerms) {
					let _specialBotPerms = hasSpecialPermissions(interaction.guild.members.me, specialBotPerms);

					// prettier-ignore
					if (!_specialBotPerms.passed) return await new BetterEmbed({
						color: "Red",
						title: `Bot Missing ${_specialBotPerms.missing.length === 1 ? "Permission" : "Permissions"}`,
						description: _specialBotPerms.missing.join(", ")
					}).send(interaction);
				}

				// prettier-ignore
				if (slashCommand.options?.deferReply)
					await interaction.deferReply().catch(() => null);
			}

			/* - - - - - { Execute } - - - - - */
			return await slashCommand.execute(client, interaction).then(async message => {
				// TODO: run code here after the command is finished
			});
		} catch (err) {
			if (config.client.support_server.INVITE_URL) {
				// Create the embed :: { FATAL ERROR }
				let embed_fatalError = new BetterEmbed({
					title: "⛔ Oh no!",
					description: `An error occurred while using the **/\`${interaction.commandName}\`** command.`
				});

				// Let the user know an error occurred
				embed_fatalError.send(interaction, { ephemeral: true });
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
					description: `An error occurred while using the **/\`${interaction.commandName}\`** command.\nYou should probably report this unfortunate occurrence somewhere.`,
					footer: "but frankly, I'd rather you didn't"
				});

				// Let the user know an error occurred
				embed_fatalError.send(interaction, {
					components: interaction.guild.id !== config.client.support_server.GUILD_ID ? aR_supportServer : [],
					ephemeral: true
				});
			}

			// Log the error to the console
			return logger.error(
				"Could not execute command",
				`SLSH_CMD: /${interaction.commandName} | guildID: '${interaction.guild.id}' | userID: '${interaction.user.id}'`,
				err
			);
		}
	}
};
