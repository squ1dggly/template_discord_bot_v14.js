const { Client, Events, ActivityType } = require("discord.js");
const jt = require("../../utils/jsTools");

const config = { client: require("../../configs/config_client.json") };
const DEV_MODE = process.env.DEV_MODE === "true" ? true : false || config.client.DEV_MODE || false;

/** @type {import("../../configs/typedefs.js").EventExports} */
module.exports = {
	name: "setClientActivity",
	eventType: Events.ClientReady,

	/** @param {Client} client  */
	execute: async client => {
		let clientStatus = DEV_MODE ? config.client.client_status.dev : config.client.client_status.default;

		let activityIndex = 0;
		let lastActivity = null;

		const parseStatusData = async () => {
			let _data = clientStatus.ACTIVITY?.length
				? clientStatus?.RANDOM_ACTIVITY
					? jt.choice(clientStatus.ACTIVITY)
					: structuredClone(clientStatus.ACTIVITY[activityIndex])
				: clientStatus.ACTIVITY;

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

			/* - - - - - { Formatting } - - - - - */
			// prettier-ignore
			_data.NAME = _data.NAME
				.replace("$USER_COUNT", jt.format(client.users.cache.size))
				.replace("$GUILD_COUNT", jt.format(client.guilds.cache.size))
				.replace("$INVITE", config.client.support_server.INVITE_URL);

			// prettier-ignore
			if (_data.NAME.includes("$SUPPORT_SERVER_MEMBER_COUNT")) {
				await client.guilds.fetch(config.client.support_server.GUILD_ID).then(guild => {
					if (!guild) return _data.NAME = _data.NAME.replace("$SUPPORT_SERVER_MEMBER_COUNT", 0);

					// Guild member count
					_data.NAME = _data.NAME.replace("$SUPPORT_SERVER_MEMBER_COUNT", jt.format(guild.members.cache.size));
				}).catch(err => console.log("Failed to fetch the support server for client status", err));
			}

			// Avoid duplicates if RANDOM is enabled
			if (clientStatus?.RANDOM && !lastActivity?.NAME === _data.NAME) return await parseStatusData();

			// Increment activity index
			if (!clientStatus?.RANDOM)
				if (activityIndex < clientStatus.ACTIVITY.length - 1) activityIndex++;
				else activityIndex = 0;

			// Cache the last activity
			lastActivity = _data;

			return _data;
		};

		const setStatus = async () => {
			let _data = await parseStatusData();

			// Set the status
			client.user.setStatus(_data.STATUS);
			// Set the activity
			client.user.setActivity({ type: _data.TYPE, name: _data.NAME, url: _data?.STREAM_URL || undefined });

			if (clientStatus?.INTERVAL) {
				// Sleep
				await jt.sleep(jt.parseTime(clientStatus.INTERVAL));

				// Run it back
				return await setStatus();
			}
		};

		// Set the client's status
		return await setStatus();
	}
};
