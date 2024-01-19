const { Client, Events, ActivityType } = require("discord.js");
const jt = require("../../utils/jsTools");

const config = { client: require("../../configs/config_client.json") };
const DEV_MODE = process.env.DEV_MODE || config.client.DEV_MODE || false;

/** @type {import("../../configs/typedefs.js").EventExports} */
module.exports = {
	name: "setClientActivity",
	eventType: Events.ClientReady,

	/** @param {Client} client  */
	execute: async client => {
		let lastActivity = null;

		const setStatus = data => {
			let _data = structuredClone(data);

			// prettier-ignore
			// Replace data.activity.TYPE with the proper ActivityType enum
			switch (_data.TYPE.toLowerCase()) {
				case "playing": _data.TYPE = ActivityType.Playing; break;
				case "streaming": _data.TYPE = ActivityType.Streaming; break;
				case "listening": _data.TYPE = ActivityType.Listening; break;
				case "watching": _data.TYPE = ActivityType.Watching; break;
				case "custom": _data.TYPE = ActivityType.Custom; break;
				case "competing": _data.TYPE = ActivityType.Competing; break;
			}

			// Formatting
			_data.NAME = _data.NAME.replace("$GUILD_COUNT", jt.format(client.guilds.cache.size));

			// Set the status
			// checking if the new status is different to avoid rate limiting
			if (_data.STATUS !== lastActivity?.STATUS) client.user.setStatus(_data.STATUS);
			// Set the activity
			client.user.setActivity({ type: _data.TYPE, name: _data.NAME, url: _data?.STREAM_URL || undefined });

			// Cache the activity
			lastActivity = _data;
		};

		let clientStatus = DEV_MODE ? config.client.client_status.dev : config.client.client_status.default;

		// Randomize status
		if (clientStatus?.INTERVAL) {
			// Apply the status ASAP
			setStatus(jt.choice(clientStatus.ACTIVITY));

			// Create an interval to change the client's status every interval
			setInterval(() => {
				// Pick a random activity
				let _activity = jt.choice(clientStatus.ACTIVITY);

				// prettier-ignore
				// Avoid duplicates
				if (lastActivity) while (_activity.NAME === lastActivity?.NAME)
					_activity = jt.choice(clientStatus.ACTIVITY);

				// Apply the status
				setStatus(_activity);
			}, jt.parseTime(clientStatus.INTERVAL));
		} else {
			// Apply the status
			setStatus(clientStatus.ACTIVITY);
		}
	}
};
