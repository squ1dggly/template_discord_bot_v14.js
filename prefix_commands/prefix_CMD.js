const { Client, Message } = require("discord.js");
const { guildManager } = require("../utils/mongo");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
	name: "prefix",
	description: "View/set the prefix",
	category: "Admin",
	usage: "<prefix?>",

	options: { icon: "⚙️", guildAdminOnly: true },

	/** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
	execute: async (client, message, { cleanContent }) => {
		if (!cleanContent) {
			// Fetch the current prefix for the guild
			let prefix = await guildManager.fetchPrefix(message.guild.id);

			// Let the user know the result
			return await message.reply({
				content: `My prefix is \`${prefix}\``,
				allowedMentions: { repliedUsers: false }
			});
		}

		// Set the guild's prefix
		await guildManager.setPrefix(message.guild.id, cleanContent);

		// Let the user know the result
		return await message.reply({
			content: `Prefix changed to \`${cleanContent}\``,
			allowedMentions: { repliedUsers: false }
		});
	}
};
