/** @file Import events and bind them to their appropriate client event trigger @author xsqu1znt */

const { Client, Events } = require("discord.js");
const logger = require("../logger");
const jt = require("../jsTools");

const config = { client: require("../../configs/config_client.json") };

function executeEvent(foo, ...args) {
	try {
		foo.execute.apply(null, args);
	} catch (err) {
		logger.error("Failed to execute function", `\'${foo.name}\' on event \'${foo.eventType}\'`, err);
	}
}

function importEvents(path) {
	let files = jt.readDir(path).filter(fn => fn.endsWith(".js"));
	let events = [];

	// Import files found in the given directory
	for (let fn of files) events.push(require(`../.${path}/${fn}`));

	// Filter out files that don't have an eventType property
	events.filter(f => f.eventType);

	return events;
}

/** @param {Client} client */
module.exports = client => {
	const directoryPath = "../../events";

	// Import event files
	let events = importEvents(directoryPath);
	if (!events.length) logger.debug(`No events found in '${directoryPath}'`);

	// Get an array of every EventType
	let eventTypes = jt.unique(events.map(e => e.eventType));

	// Group events by EventType
	let eventsGrouped = eventTypes.map(type => events.filter(e => e.eventType === type));

	// Iterate through events
	for (let group of eventsGrouped) {
        // Bind it to the appropriate listener
	}
};
