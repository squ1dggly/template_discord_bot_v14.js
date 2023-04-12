// An example of an event function.

const { Message } = require('discord.js');
const client = require('../../../index');
const logger = require('../../../modules/logger');

module.exports = {
    name: "EXAMPLE",
    event: "message_create",

    /**
     * @param {client} client 
     * @param {{ message: Message }} args
     */
    execute: async (client, args) => {
        return logger.log(`${args.message.author.username} sent a message`);
    }
};