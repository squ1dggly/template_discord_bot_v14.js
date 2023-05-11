// Runs as soon as the bot's connected to discord.

const { Client, ActivityType } = require('discord.js');
const { DEVMODE, clientPresence } = require('../../configs/clientSettings.json');

module.exports = {
    name: "SET_PRESENCE",
    event: "ready",

    /**
     * @param {Client} client 
     */
    execute: async (client) => {
        let presence = (process.env.DEVMODE || DEVMODE) ? clientPresence.dev : clientPresence.default;

        // Replace presence.avtivity.TYPE with the proper ActivityType enum
        switch (presence.activity.TYPE.toLowerCase()) {
            case "playing": presence.activity.TYPE = ActivityType.Playing; break;
            case "streaming": presence.activity.TYPE = ActivityType.Streaming; break;
            case "listening": presence.activity.TYPE = ActivityType.Listening; break;
            case "watching": presence.activity.TYPE = ActivityType.Watching; break;
            case "custom": presence.activity.TYPE = ActivityType.Custom; break;
            case "competing": presence.activity.TYPE = ActivityType.Competing; break;
        }

        client.user.setActivity({
            name: presence.activity.NAME,
            type: presence.activity.TYPE,
            url: presence.activity.STREAM_URL ? presence.activity.STREAM_URL : null
        });
        client.user.setStatus(presence.STATUS);
    }
};