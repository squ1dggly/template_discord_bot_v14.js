const { Client, Message } = require("discord.js");
const { ping } = require("../utils/mongo");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "ping",
	description: "Check my ping",
	category: "Miscellaneous",

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
	execute: async (client, message) => {
		let responsePing = Date.now() - message.createdTimestamp;

		// Send the client's ping
		let msg = await message.reply({
			content: `Client: **${client.ws.ping}ms**, Response: **${responsePing}ms**`,
			allowedMentions: { repliedUser: false }
		});

		// prettier-ignore
		// Get the database connection ping and add it to the message
		// this is done separately so the response time isn't affected by this query
		ping().then(async databasePing => {
			if (!msg.editable) return;

			// Edit the message
			msg.edit({
				content: `${msg.content}, Database: **${databasePing}ms**`,
				allowedMentions: { repliedUser: false }
			});
		}).catch(() => null);

		// Return the message
		return msg;
	}
};
