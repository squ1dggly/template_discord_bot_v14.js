// An example of an event function.

const { Client, Guild } = require('discord.js');
const logger = require('../../../modules/logger');

module.exports = {
    name: "EXAMPLE",
    event: "guild_create",

    /**
     * @param {Client} client 
     * @param {{ guild: Guild }} args
     */
    execute: async (client, args) => {
        return logger.log(`joined a guild named \"${args.guild.name}\"`);
    }
};