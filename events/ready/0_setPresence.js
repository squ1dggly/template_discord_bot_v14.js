/** @file Executed as soon as the bot's connected to Discord @author xsqu1znt */

const { Client, ActivityType } = require("discord.js");

const config = { client: require("../../configs/config_client.json") };

module.exports = {
	name: "SET_PRESENCE",
	event: "ready",

	/** @param {Client} client  */
	execute: async client => {
		let presence = config.client.client_presence[config.client.MODE.toLowerCase()];

		// prettier-ignore
		// Replace presence.activity.TYPE with the proper ActivityType enum
		switch (presence.activity.TYPE.toLowerCase()) {
            case "playing": presence.activity.TYPE = ActivityType.Playing; break;
            case "streaming": presence.activity.TYPE = ActivityType.Streaming; break;
            case "listening": presence.activity.TYPE = ActivityType.Listening; break;
            case "watching": presence.activity.TYPE = ActivityType.Watching; break;
            case "custom": presence.activity.TYPE = ActivityType.Custom; break;
            case "competing": presence.activity.TYPE = ActivityType.Competing; break;
        }

		client.user.setStatus(presence.STATUS);
		client.user.setActivity({
			name: presence.activity.NAME,
			type: presence.activity.TYPE,
			url: presence.activity.STREAM_URL ? presence.activity.STREAM_URL : null
		});
	}
};
