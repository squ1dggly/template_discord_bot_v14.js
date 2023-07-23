const { Message } = require("discord.js");
const _jsT = require("../jsTools/_jsT");

/** Delete a message after a given amount of time
 * @param {Message} message message object that was sent
 * @param {number|string} time amount of time to wait in milliseconds */
async function deleteMesssageAfter(message, time) {
	// Wait until the given time has passed
	await _jsT.wait(time);

	// prettier-ignore
	try { return await message.delete(); } catch { return null; }
}

module.exports = deleteMesssageAfter;
