const { Message } = require("discord.js");
const jt = require("../jsTools");

const config = require("./dT_config.json");

/** Delete a message after a given amount of time
 * @param {Message|Promise<Message>} message message object that was sent
 * @param {number|string} time amount of time to wait in milliseconds */
async function deleteMesssageAfter(message, time = config.timeouts.ERROR_MESSAGE) {
	time = jt.parseTime(time);

	// Make sure the message object's resolved
	let _msg = await Promise.resolve(message);

	// Wait until the given time has passed
	await jt.sleep(time);

	if (!_msg?.deletable) return null;
	return await _msg.delete().catch(() => null);
}

module.exports = deleteMesssageAfter;
