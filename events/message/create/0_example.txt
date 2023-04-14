// An example of an event function.

const { Client, Message } = require('discord.js');
const logger = require('../../../modules/logger');

module.exports = {
    name: "EXAMPLE",
    event: "message_create",

    /**
     * @param {Client} client 
     * @param {{ message: Message }} args
     */
    execute: async (client, args) => {
        return logger.log(`${args.message.author.username} sent a message`);
    }
};