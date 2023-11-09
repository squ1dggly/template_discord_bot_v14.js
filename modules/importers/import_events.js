/** @file Import events and bind them to their appropriate client event trigger @author xsqu1znt */

const fs = require("fs");

const { Client } = require("discord.js");
const logger = require("../logger");
const _jsT = require("../jsTools");
// const mongo = require("../mongo");

const config = { client: require("../../configs/config_client.json") };
const hostMode = config.client.MODE === "HOST" ? true : false;
const pathPrefix = hostMode ? "." : "../..";

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

		/* - - - - - { Bind the Functions } - - - - - */
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

// ! Helper Functions
function importEvents(dir) {
	let files = fs.readdirSync(`.${dir}`).filter(fn => fn.endsWith(".js"));
	// let files = fs.readdirSync(`${dir}`).filter(fn => fn.endsWith('.js')); // Use instead when uploaded to a host
	let funcs = [];

	files.forEach(fn => funcs.push(require(`${dir}/${fn}`)));
	// files.forEach(fn => funcs.push(require(`../.${dir}/${fn}`))); // Use instead when uploaded to a host
	return funcs;
}

function executeEvent(foo, ...args) {
	try {
		foo.execute.apply(null, args);
	} catch (err) {
		logger.error("Failed to execute event function", `\"${foo.name}\" on event \"${foo.event}\"`, err);
	}
}
