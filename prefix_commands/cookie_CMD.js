const { Client, Message } = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools");
const _jsT = require("../modules/jsTools");

module.exports = {
    name: "cookie",
    options: { icon: "🍪", deferReply: false, botAdminOnly: false, guildAdminOnly: false },

    /** @param {Client} client @param {Message} message */
    execute: async (client, message) => {
        // prettier-ignore
        let choices = [
            "What's up, **$USERNAME**! Have a cookie! :cookie:",
            "Hey, **$USERNAME**! Have a glass of milk! :milk:",
        ];

        // prettier-ignore
        let embed_cookie = new BetterEmbed({
            channel: message.channel, author: { user: message.author, iconURL: true },
            description: _jsT.choice(choices), timestamp: true
        });

        return await embed_cookie.send();
    }
};
