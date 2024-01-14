const { Client, Message } = require("discord.js");
const { BetterEmbed } = require("../modules/discordTools");
const jt = require("../modules/jsTools");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "cookie",
	description: "Get a cookie or a glass of milk",
	category: "Fun",

	options: { icon: "🍪" },

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
	execute: async (client, message) => {
		let choices = [
			"What's up, **$USERNAME**! Have a cookie! :cookie:",
			"Hey, **$USERNAME**! Have a glass of milk! :milk:"
		];

		// prettier-ignore
		let embed_cookie = new BetterEmbed({
			channel: message.channel, author: { user: message.author },
			description: jt.choice(choices)
		});

		return await embed_cookie.reply(message, { allowedMentions: { repliedUser: false } });
	}
};
