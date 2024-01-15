/** @typedef CommandOptions
 * @property {string} icon icon to show in the help command list
 * @property {boolean} botAdminOnly only allow bot staff to use this command
 * @property {boolean} guildAdminOnly only allow guild admins to use this command
 * @property {PermissionFlagsBits|PermissionFlagsBits[]} specialUserPerms require the user to have special permissions
 * @property {PermissionFlagsBits|PermissionFlagsBits[]} specialBotPerms require the bot to have special permissions
 * @property {boolean} hidden hide this command from the help command list */

/** @typedef SlashCommandExports
 * @property {string} category category of the command
 * @property {string} categoryIcon icon of the command category
 * @property {CommandOptions} options extra options for the command
 * @property {SlashCommandBuilder} builder slash command builder
 * @property {Function} execute executed when the command is used */

/** @typedef PrefixCommandExports
 * @property {string} name name of the command
 * @property {string[]} aliases different ways this command can be called
 * @property {string} description description of the command
 * @property {string} usage how the command can be used
 * @property {string} category category of the command
 * @property {string} categoryIcon icon of the command category
 * @property {CommandOptions} options extra options for the command
 * @property {Function} execute executed when the command is used */

/** @typedef PrefixCommandExtra
 * @property {string} cleanContent message content without the command name
 * @property {string} cmdName command name
 * @property {string} prefix prefix used */

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = null;
