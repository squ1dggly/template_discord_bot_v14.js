const { Message } = require("discord.js");
const _jsT = require("../jsTools/_jsT");

module.exports = {
	/** Delete a message after a given amount of time
	 * @param {Message} message message object that was sent
	 * @param {number|string} time amount of time to wait in milliseconds */
	deleteMesssageAfter: (message, time) => {
		if (typeof time === "string") time = _jsT.parseTime(time);
		if (isNaN(time)) throw new TypeError(`${time} is not a valid number`);

		return new Promise(resolve =>
			setTimeout(async () => {
				// prettier-ignore
				try { resolve(await message.delete()); } catch { }
			}, time)
		);
	}
};
