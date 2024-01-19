/** @file Import events and bind them to their appropriate client event listener */

const { Client } = require("discord.js");
const logger = require("../logger");
const jt = require("../jsTools");

function importEvents(path) {
	let files = jt.readDir(path, { recursive: true }).filter(fn => fn.endsWith(".js"));
	let events = [];

	// Import files found in the given directory
	for (let fn of files) events.push(require(`../.${path}/${fn}`));

	// Filter out files that don't have an eventType property
	events.filter(f => f.eventType !== undefined && f.enabled !== false);

	return events;
}

/** @param {Client} client */
module.exports = client => {
	const directoryPath = "./events";

	// Import event files
	let events = importEvents(directoryPath);
	if (!events.length) logger.debug(`No events found in '${directoryPath}'`);

	// Get an array of every EventType
	let eventTypes = jt.unique(events.map(e => e.eventType));

	// Group events by EventType
	let eventsGrouped = eventTypes.map(type => events.filter(e => e.eventType === type));

	// Iterate through grouped events
	for (let group of eventsGrouped) {
		// Iterate through events inside the group
		for (let event of group) {
			try {
				// Bind it to the appropriate listener
				client.on(event.eventType, async (...args) => {
					try {
						// Execute the event
						event.execute.apply(null, [client, ...args]);
					} catch (err) {
						// Catch execution errors
						logger.error("Failed to execute function", `\'${event.name}\' on event \'${event.eventType}\'`, err);
					}
				});
			} catch (err) {
				// prettier-ignore
				// Invalid event type recieved
				logger.error("Failed to bind event", `invalid event: \'${event.eventType}\' for function \'${event.name}\'`, err);
			}
		}
	}
};
