const { Client, Message } = require("discord.js");
const { BetterEmbed } = require("../utils/discordTools");
const jt = require("../utils/jsTools");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "cookie",
	description: "Get a cookie or a glass of milk",
	category: "Fun",

	options: { icon: "🍪" },

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
	execute: async (client, message) => {
		// Create an array of responses
		let choices = [
			"What's up, **$USERNAME**! Have a cookie! :cookie:",
			"Hey, **$USERNAME**! Have a glass of milk! :milk:"
		];

		// Create the embed :: { COOKIE }
		let embed_cookie = new BetterEmbed({
			context: { channel: message.channel },
			author: { user: message.author },
			description: jt.choice(choices)
		});

		// Reply to the interaction with the embed
		return await embed_cookie.reply(message, { allowedMentions: { repliedUser: false } });
	}
};
