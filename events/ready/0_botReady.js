// Runs as soon as the bot's connected to discord.

const client = require('../../index');
const logger = require('../../modules/logger');
const { name } = require('../../package.json');

module.exports = {
    name: "BOT_READY",
    event: "ready",

    /**
     * @param {client} client 
     */
    execute: async (client) => {
        logger.success(`${name} successfully connected to Discord`);
    }
};