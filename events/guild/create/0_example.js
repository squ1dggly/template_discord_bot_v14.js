// An example of an event function.

const { Guild } = require('discord.js');
const client = require('../../../index');
const logger = require('../../../modules/logger');

module.exports = {
    name: "EXAMPLE",
    event: "guild_create",

    /**
     * @param {client} client 
     * @param {{ guild: Guild }} args
     */
    execute: async (client, args) => {
        return logger.log(`joined a guild named \"${args.guild.name}\"`);
    }
};