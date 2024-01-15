const { Message } = require("discord.js");
const jt = require("../jsTools");

const config = require("./dT_config.json");

/** Delete a message after a given amount of time
 * @param {Message} message message object that was sent
 * @param {number|string} time amount of time to wait in milliseconds */
async function deleteMesssageAfter(message, time = config.timeouts.ERROR_MESSAGE) {
	time = jt.parseTime(time);

	// Wait until the given time has passed
	await jt.wait(time);

	if (!message.deletable) return null;
	return await message.delete().catch(() => null);
}

module.exports = deleteMesssageAfter;
