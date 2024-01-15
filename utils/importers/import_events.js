/** @file Import events and bind them to their appropriate client event trigger @author xsqu1znt */

const { Client } = require("discord.js");
const logger = require("../logger");
const jt = require("../jsTools");
// const mongo = require("../mongo");

const config = { client: require("../../configs/config_client.json") };
const hostMode = config.client.MODE === "HOST" ? true : false;
const pathPrefix = hostMode ? "../.." : ".";

function importEvents(path) {
	let files = jt.readDir(path).filter(fn => fn.endsWith(".js"));
	let events = [];

	for (let fn of files) events.push(require(hostMode ? `${path}/${fn}` : `../.${path}/${fn}`));

	return events;
}

function executeEvent(foo, ...args) {
	try {
		foo.execute.apply(null, args);
	} catch (err) {
		logger.error("Failed to execute event function", `\"${foo.name}\" on event \"${foo.event}\"`, err);
	}
}

module.exports = {
	/** @param {Client} client */
	init: client => {
		let events = {
			ready: importEvents(`${pathPrefix}/events/ready`),

			guild: {
				create: importEvents(`${pathPrefix}/events/guild/create`),
				delete: importEvents(`${pathPrefix}/events/guild/delete`)
			},

			message: {
				create: importEvents(`${pathPrefix}/events/message/create`),
				update: importEvents(`${pathPrefix}/events/message/update`),
				delete: importEvents(`${pathPrefix}/events/message/delete`)
			},

			interaction: {
				create: importEvents(`${pathPrefix}/events/interaction/create`)
			}
		};

		/* - - - - - { Ready } - - - - - */
		// prettier-ignore
		if (events.ready.length) client.on("ready", async () => {
			events.ready.forEach(foo => executeEvent(foo, client));
		});

		/* - - - - - { Guild } - - - - - */
		// prettier-ignore
		if (events.guild.create.length) client.on("guildCreate", async (guild) => {
            let args = { guild };
            events.guild.create.forEach(foo => executeEvent(foo, client, args));
		});

		// prettier-ignore
		if (events.guild.delete.length) client.on("guildDelete", async (guild) => {
            let args = { guild };
            events.guild.delete.forEach(foo => executeEvent(foo, client, args));
		});

		/* - - - - - { Message } - - - - - */
		// prettier-ignore
		if (events.message.create.length) client.on("messageCreate", async (message) => {
            let args = { message };
            events.message.create.forEach(foo => executeEvent(foo, client, args));
		});

		// prettier-ignore
		if (events.message.delete.length) client.on("messageDelete", async (message) => {
            let args = { message };
            events.message.delete.forEach(foo => executeEvent(foo, client, args));
        });

		// prettier-ignore
		if (events.message.update.length) client.on("messageUpdate", async (before, after) => {
			let args = { message: { before, after } };
            events.message.update.forEach(foo => executeEvent(foo, client, args ));
        });

		/* - - - - - { Interaction } - - - - - */
		// prettier-ignore
		if (events.interaction.create.length) client.on("interactionCreate", async interaction => {
			let args = { interaction };
			events.interaction.create.forEach(foo => executeEvent(foo, client, args));
		});
	}
};
