const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");
const { ping } = require("../modules/mongo");
const jt = require("../modules/jsTools");

/** @type {import("../configs/typedefs").SlashCommandExports} */
module.exports = {
	category: "Utility",
	options: { icon: "🏓" },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("ping")
        .setDescription("Check my ping"),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		// Send the client's ping
		let msg = await interaction.reply({
			content: `Client: **${jt.format(client.ws.ping)}ms**`,
			fetchReply: true
		});

		// prettier-ignore
		// Get the database connection ping and add it to the message
		// this is done separately so the response time isn't affected by this query
		ping().then(async databasePing => {
			if (!msg.editable) return;

			// Edit the message
            msg.edit({ content: `${msg.content}, Database: **${databasePing}ms**` });
		}).catch(() => null);

		// Return the message
		return msg;
	}
};
