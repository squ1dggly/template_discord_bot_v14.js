// An example of an event function.

const { BaseInteraction } = require('discord.js');
const client = require('../../../index');
const logger = require('../../../modules/logger');

module.exports = {
    name: "EXAMPLE",
    event: "interaction_create",

    /**
     * @param {client} client 
     * @param {{ interaction: BaseInteraction }} args
     */
    execute: async (client, args) => {
        return logger.log(`${args.interaction.user.username} triggered an interaction`);
    }
};