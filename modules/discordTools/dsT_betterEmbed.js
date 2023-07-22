/** @typedef bE_options
 * @property {CommandInteraction} interaction
 * @property {{user:GuildMember|User, text:string, iconURL:string, linkURL: string}} author
 * @property {{text:string, linkURL:string}} title
 * @property {{text:string, linkURL:string}} footer
 * @property {string} thumbnailURL
 * @property {string} imageURL
 * @property {string} color
 * @property {boolean} showTimestamp */

/** @typedef bE_sendOptions
 * @property {string} messageContent
 * @property {{user:GuildMember|User, text:string, iconURL:string, linkURL: string}} author
 * @property {{text:string, linkURL:string}} title
 * @property {{text:string, linkURL:string}} footer
 * @property {string} description
 * @property {string} thumbnailURL
 * @property {string} imageURL
 * @property {string} color
 * @property {"reply"|"editReply"|"followUp"|"channel"} sendMethod if "reply" fails it will use "editReply" | "reply" is default
 * @property {ActionRowBuilder|ActionRowBuilder[]} components
 * @property {boolean} ephemeral */

const { Message, Embed, CommandInteraction, User, GuildMember, ActionRowBuilder } = require("discord.js");
const _jsT = require("../jsTools/_jsT");

/** Send a confirmation message and await the user's response
 * @param {ac_options} options */
class BetterEmbed extends Embed {}

module.exports = BetterEmbed;
