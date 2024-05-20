const _nT = require("./jT_number");

/** @typedef parse_options
 * @property {"ms"|"s"} type return "s" (seconds) or "ms" (milliseconds)
 * @property {boolean} fromNow add Date.now() to the result */

/** Parse a string into either milliseconds or seconds
 * @param {string|number} str string to parse
 * @param {parse_options} options
 *
 * @example
 * parse("1m") --> 60000
 * parse("1h 30m") --> 5400000
 *
 * parse("1h", { fromNow: true }) --> Date.now() + 3600000
 * parse("-1m", { type: "s" }) --> -60 */
function parseTime(str, options) {
	options = { type: "ms", fromNow: false, ...options };

	// Check if the provided string is already a number
	let _str2num = Number(str);
	if (!isNaN(_str2num)) return _str2num;

	// Match time formats found in the given string query
	let timeQuery = str.matchAll(/([\d]+)([a-zA-Z]+)/g);
	let isNegative = str.startsWith("-");
	let sum = 0;

	// Iterate through each match and preform the conversion operation on them
	for (let query of timeQuery) {
		let time = Number(query[1]);
		let op = query[2] || null;

		// Error checking
		if (isNaN(time) || !op)
			throw new TypeError(`\'${str}\' must be in a parsable time format. Example: '24h' or '1h 30m'`);

		let _parsed = 0;

		// prettier-ignore
		switch (op) {
			case "y": _parsed = time * 12 * 4 * 7 * 24 * 60 * 60 * 1000; break;
			case "mth": _parsed = time * 4 * 7 * 24 * 60 * 60 * 1000; break;
			case "w": _parsed = time * 7 * 24 * 60 * 60 * 1000; break;
			case "d": _parsed = time * 24 * 60 * 60 * 1000; break;
			case "h": _parsed = time * 60 * 60 * 1000; break;
			case "m": _parsed = time * 60 * 1000; break;
			case "s": _parsed = time * 1000; break;
			case "ms": _parsed = time; break;
		}

		// Add to the sum
		sum += _parsed;
	}

	/* - - - - - { Return the Result } - - - - - */
	if (options.fromNow) isNegative ? (sum = Date.now() - sum) : (sum = Date.now() + sum);
	if (options.type === "s") sum = _nT.msToSec(sum);
	if (!options.fromNow && isNegative) sum = -sum;

	return sum;
}

/** @typedef eta_options
 * @property {number|string} since the anchor to go off of, a unix timestamp in milliseconds **|** `Date.now()` is default
 * @property {boolean} ignorePast leaves out "ago" if the result is in the past
 * @property {boolean} nullIfPast returns `null` if `end` is before `start`
 * @property {number} decimalLimit limits the number of digits after the decimal point for times longer than 1 week **|** `0` is default */

/** Parse the time difference between 2 unix timestamps into a human-readable string
 * @param {number|string} unix in milliseconds
 * @param {eta_options} options
 *
 * @example
 * eta(1703001733955) // returns "1 hour" (from now)
 * eta(1702994533936, { nullIfPast: true }) // returns null */
function eta(unix, options) {
	unix = Number(unix);
	if (isNaN(unix)) throw new Error("unix must be a number or string");

	options = { since: Date.now(), ignorePast: false, nullIfPast: false, decimalLimit: 0, ...options };

	/// Get the difference between the 2 times
	let isPast = unix - options.since < 0;
	if (options.nullIfPast && isPast) return null;

	let difference = Math.abs(unix - options.since);
	/// Return if there's no difference
	if (!difference && options.nullIfPast) return null;
	if (!difference) return "now";

	/* - - - - - { Preform Calculations } - - - - - */
	let divisions = [
		{ name: "milliseconds", amount: 1000 },
		{ name: "seconds", amount: 60 },
		{ name: "minutes", amount: 60 },
		{ name: "hours", amount: 24 },
		{ name: "days", amount: 7 },
		{ name: "weeks", amount: 4 },
		{ name: "months", amount: 12 },
		{ name: "years", amount: Number.POSITIVE_INFINITY }
	];

	// Divide the difference until we reach a result
	let result = divisions.find((div, idx) => {
		if (difference < div.amount) return div;
		difference = Math.abs(difference / div.amount).toFixed(
			["milliseconds", "seconds", "minutes", "hours", "days"].includes(div) ? 0 : options.decimalLimit
		);
	});

	// Grammar adjustment
	if (+difference === 1) result.name = result.name.slice(0, -1);

	return `${difference} ${result.name}${isPast && !options.ignorePast ? " ago" : ""}`;
}

/** @typedef etaHMS_options
 * @property {number|string} since the anchor to go off of, a unix timestamp in milliseconds **|** `Date.now()` is default
 * @property {boolean} ignorePast leaves out "ago" if the result is in the past
 * @property {boolean} nullIfPast returns `null` if `end` is before `start` */

/** Parse the time difference between 2 unix timestamps into a dynamic "H, M, and S" format
 * @param {number|string} unix in milliseconds
 * @param {etaHMS_options} options
 *
 * @example
 * etaHMS(1703001733955) // returns "1 hour, 0 minutes, and 0 seconds" (from now)
 * etaHMS(1702994533936, { nullIfPast: true }) // returns null */
function etaHMS(unix, options) {
	unix = Number(unix);
	if (isNaN(unix)) throw new Error("unix must be a number or string");

	options = { since: Date.now(), ignorePast: false, nullIfPast: false, ...options };

	/// Get the difference between the 2 times
	let isPast = unix - options.since < 0;
	if (options.nullIfPast && isPast) return null;

	let difference = Math.abs(unix - options.since);
	/// Return if there's no difference
	if (!difference && options.nullIfPast) return null;
	if (!difference) return "now";

	/* - - - - - { Preform Calculations } - - - - - */
	let seconds = _nT.msToSec(difference);

	let h = Math.floor(seconds / 3600);
	let m = Math.floor((seconds % 3600) / 60);
	let s = Math.floor((seconds % 3600) % 60);

	let h_f = h > 0 ? `${h} ${h === 1 ? "hour" : "hours"}` : "";
	let m_f = m > 0 ? `${m} ${m === 1 ? "minute" : "minutes"}` : "";
	let s_f = s > 0 ? `${s} ${s === 1 ? "second" : "seconds"}` : "";

	let result = [];

	if (h) result.push(h_f);
	if (m) result.push(m_f);
	if (s) result.push(s_f);

	// Grammar adjustment
	if (result.length > 1) result.splice(-1, 0, "&");

	return result.join(", ").replace("&,", "and");
}

module.exports = { parseTime, eta, etaHMS };
