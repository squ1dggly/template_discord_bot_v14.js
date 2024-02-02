const _dT = require("./jT_date");

/** A promise based implementation of setTimeout()
 * @param {number|string} ms time to wait */
function sleep(ms) {
	if (typeof ms === "string") ms = _dT.parseTime(ms);
	if (isNaN(ms)) throw new TypeError(`${ms} is not a valid number`);

	return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { sleep };
