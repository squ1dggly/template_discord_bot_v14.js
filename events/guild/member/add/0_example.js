// An example of an event function.

const { GuildMember } = require('discord.js');
const client = require('../../../index');
const logger = require('../../../modules/logger');

module.exports = {
    name: "EXAMPLE",
    event: "guild_member_add",

    /**
     * @param {client} client 
     * @param {{ guildMember: GuildMember }} args
     */
    execute: async (client, args) => {
        return logger.log(`${args.guildMember.user.username} left guild \"${args.guildMember.guild.name}\"`);
    }
};