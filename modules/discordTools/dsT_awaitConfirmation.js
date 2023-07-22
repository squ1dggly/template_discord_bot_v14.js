/** @typedef ac_options
 * Title/description formatting shorthand:
 *
 * • $USER :: interaction user's mention
 *
 * • $USERNAME :: interaction user's display/user name
 *
 * @property {CommandInteraction} interaction
 * @property {{text:string, useAuthor:boolean}} title
 * @property {string} description
 * @property {string} footer
 * @property {boolean} showAuthorIcon
 * @property {"reply"|"editReply"|"followUp"|"channel"} sendMethod if "reply" fails it will use "editReply"
 * @property {boolean} deleteOnConfirmation
 * @property {number} timeout */

const { CommandInteraction } = require("discord.js");
const _jsT = require("../jsTools/_jsT");

module.exports = {
	/** Delete a message after a given amount of time
	 * @param {ac_options} options */
	awaitConfirmation: options => {
		options = {
			interaction: null,
            title: { text: "Please confirm this action", useAuthor: false },
            description: ""
		};
	}
};
