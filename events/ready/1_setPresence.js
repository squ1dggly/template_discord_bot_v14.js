// Runs as soon as the bot's connected to discord.

const client = require('../../index');
const { clientPresence } = require('../../configs/clientSettings.json');

module.exports = {
    name: "SET_PRESENCE",
    event: "ready",

    /**
     * @param {client} client 
     */
    execute: async (client) => {
        let presence = process.env.DEVMODE ? clientPresence.dev : clientPresence.default;

        client.user.setPresence({
            status: presence.STATUS, activities: [{
                name: presence.activity.NAME,
                type: presence.activity.TYPE,
                url: presence.activity.URL
            }]
        });
    }
};