// An example of an event function.

const { Client, GuildMember } = require('discord.js');
const logger = require('../../../modules/logger');

module.exports = {
    name: "EXAMPLE",
    event: "guild_member_add",

    /**
     * @param {Client} client 
     * @param {{ guildMember: GuildMember }} args
     */
    execute: async (client, args) => {
        return logger.log(`${args.guildMember.user.username} left guild \"${args.guildMember.guild.name}\"`);
    }
};