// An example of an event function.

const { Client, Message } = require('discord.js');
const logger = require('../../../modules/logger');

module.exports = {
    name: "EXAMPLE",
    event: "message_update",

    /**
     * @param {Client} client 
     * @param {{ message: { before: Message, after: Message } }} args
     */
    execute: async (client, args) => {
        return logger.log(`${args.message.after.author.username} updated a message`);
    }
};