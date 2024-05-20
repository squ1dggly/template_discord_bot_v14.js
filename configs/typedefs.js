/** @typedef RawCommandData
 * @property {string} name Name of the command.
 * @property {string} description Description of the command.
 * @property {number} type Type of command.
 *
 * - `1` `CHAT_INPUT`
 *
 * - `2` `USER` - ui-based
 *
 * - `3` `MESSAGE` - ui-based
 * @property {number[]} integration_types Type of integrations.
 *
 * - `0` `GUILD_INSTALL`
 *
 * - `1` `USER_INSTALL`
 * @property {number[]} context Context of the integration.
 *
 * - `0` `GUILD`
 *
 * - `1` `BOT_DM`
 *
 * - `2` `PRIVATE_CHANNEL` */

/** @typedef CommandOptions
 * @property {boolean} deferReply Defer the interaction.
 *
 * ***Required if the Slash Command can take longer than 3 seconds to execute.***
 * @property {string} icon Icon to show in the help command list.
 * @property {boolean} guildOnly Only allow this command to be used in guilds.
 * @property {boolean} botAdminOnly Only allow bot staff to use this command.
 * @property {boolean} guildAdminOnly Only allow guild admins to use this command.
 * @property {PermissionFlagsBits|PermissionFlagsBits[]} specialUserPerms Require the user to have certain permissions in the current guild.
 * @property {PermissionFlagsBits|PermissionFlagsBits[]} specialBotPerms Require the bot to have certain permissions in the current guild.
 * @property {boolean} hidden Hide this command from the help command list. */

/* - - - - - { Slash Command } - - - - - */

/** @typedef SlashCommandExports
 * @property {string} category Category of the command.
 * @property {string} categoryIcon Icon of the command category.
 * @property {CommandOptions} options Extra options for the command.
 * @property {SlashCommandBuilder} builder Slash command builder.
 * @property {Function} execute Executed when the command is used. */

/* - - - - - { Prefix Command } - - - - - */

/** @typedef PrefixCommandExports
 * @property {string} name Name of the command.
 * @property {string[]} aliases Different ways this command can be called.
 * @property {string} description Description of the command.
 * @property {string} usage How the command can be used.
 * @property {string} category Category of the command.
 * @property {string} categoryIcon Icon of the command category.
 * @property {CommandOptions} options Extra options for the command.
 * @property {Function} execute Executed when the command is used. */

/** @typedef PrefixCommandExtra
 * @property {string} cleanContent Message content without the command name.
 * @property {string} cmdName Command name.
 * @property {string} prefix Prefix used. */

/* - - - - - { Special Command } - - - - - */

/** @typedef RawCommandExports
 * @property {string} category Category of the command.
 * @property {string} categoryIcon Icon of the command category.
 * @property {CommandOptions} options Extra options for the command.
 * @property {RawCommandData} commandData Raw JSON data used to register the command.
 * @property {Function} execute Executed when the command is used. */

/* - - - - - { Event } - - - - - */

/** @typedef EventExports
 * @property {string} name Name of the event.
 * @property {Events} eventType Event listener to be bound to.
 * @property {boolean} enabled Whether to be executed or not. `true` by default. **(optional)** */

const { Events, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");

module.exports = null;
