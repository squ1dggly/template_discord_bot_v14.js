const _dT = require("./jT_date");

/** A promise based implementation of setTimeout()
 * @param {number|string} ms wait time in milliseconds  */
function wait(ms) {
	if (typeof ms === "string") time = _dT.parseTime(ms);
	if (isNaN(ms)) throw new TypeError(`${ms} is not a valid number`);

	return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { wait };
