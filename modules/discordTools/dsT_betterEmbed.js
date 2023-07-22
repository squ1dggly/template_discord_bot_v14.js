/** @typedef bE_options
 * Title/description formatting shorthand:
 *
 * • $USER :: author's mention
 *
 * • $USERNAME :: author's display/user name
 * @property {CommandInteraction} interaction
 * @property {{user:GuildMember|User, text:string, iconURL:string, linkURL: string}} author
 * @property {{text:string, linkURL:string}} title
 * @property {{text:string, linkURL:string}} footer
 * @property {string} thumbnailURL
 * @property {string} imageURL
 * @property {string} color
 * @property {boolean} showTimestamp */

/** @typedef bE_sendOptions
 * Title/description formatting shorthand:
 *
 * • $USER :: author's mention
 *
 * • $USERNAME :: author's display/user name
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

const config = require("./_dsT_config.json");

const { Message, Embed, CommandInteraction, User, GuildMember, ActionRowBuilder } = require("discord.js");
const _jsT = require("../jsTools/_jsT");

class BetterEmbed extends Embed {
	/** Send a confirmation message and await the user's response
	 * @param {bE_options} options */
	constructor(options) {
		super();

		// prettier-ignore
		options = {
			interaction: null,
			author: { user: null, text: "", iconURL: "", linkURL: "" },
            title: { text: "", linkURL: "" }, footer: { text: "", linkURL: "" },
            imageURL: "", thumbnailURL: "",
            color: config.EMBED_COLOR || null,
            showTimestamp: false, ...options
		};
	}
}

module.exports = BetterEmbed;
