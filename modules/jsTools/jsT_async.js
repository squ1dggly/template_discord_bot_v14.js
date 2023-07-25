const _dT = require("./jsT_date");

/** A promise based implementation of setTimeout()
 * @param {number|string} ms wait time in milliseconds  */
function wait(ms) {
	if (typeof ms === "string") time = _dT.parseTime(time);
	if (isNaN(time)) throw new TypeError(`${time} is not a valid number`);

	return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { wait };
