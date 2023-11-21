/** @typedef extra
 * @property {string} cleanContent message content without the command name
 * @property {string} cmdName command name
 * @property {string} prefix prefix used */

const { Client, Message } = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools");
const jt = require("../modules/jsTools");

module.exports = {
	name: "cookie",
	aliases: [],
	description: "Get a cookie or a glass of milk",
	options: { icon: "🍪", botAdminOnly: false, guildAdminOnly: false },

	/** @param {Client} client @param {Message} message @param {extra} extra */
	execute: async (client, message, { cleanContent, cmdName, prefix }) => {
		// prettier-ignore
		let choices = [
			"What's up, **$USERNAME**! Have a cookie! :cookie:",
			"Hey, **$USERNAME**! Have a glass of milk! :milk:",
		];

		// prettier-ignore
		let embed_cookie = new BetterEmbed({
			channel: message.channel, author: { user: message.author },
			description: jt.choice(choices)
		});

		return await embed_cookie.reply(message, { allowedMentions: { repliedUser: false } });
	}
};
