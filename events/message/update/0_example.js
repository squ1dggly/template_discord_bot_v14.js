// An example of an event function.

const { Message } = require('discord.js');
const client = require('../../../index');
const logger = require('../../../modules/logger');

module.exports = {
    name: "EXAMPLE",
    event: "message_update",

    /**
     * @param {client} client 
     * @param {{ message: { before: Message, after: Message } }} args
     */
    execute: async (client, args) => {
        return logger.log(`${args.message.after.author.username} updated a message`);
    }
};