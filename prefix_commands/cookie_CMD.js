const { Client, Message } = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools");
const _jsT = require("../modules/jsTools");

module.exports = {
	name: "cookie",
	description: "Get a cookie or a glass of milk",
	options: { icon: "🍪", botAdminOnly: false, guildAdminOnly: false },

	/** @param {Client} client @param {Message} message */
	execute: async (client, { message, cleanContent, commandName }) => {
		// prettier-ignore
		let choices = [
            "What's up, **$USERNAME**! Have a cookie! :cookie:",
            "Hey, **$USERNAME**! Have a glass of milk! :milk:",
        ];

		// prettier-ignore
		let embed_cookie = new BetterEmbed({
            channel: message.channel, author: { user: message.member },
            description: _jsT.choice(choices)
        });

		return await embed_cookie.reply(message, { allowedMentions: { repliedUser: false } });
	}
};
