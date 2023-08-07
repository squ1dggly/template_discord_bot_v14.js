const _nT = require("./jsT_number");

// prettier-ignore
/** @typedef parse_options
 * @property {"ms"|"s"} type return "s" (seconds) or "ms" (milliseconds)
 * @property {boolean} fromNow add Date.now() to the result */

/** Parse a string into either milliseconds or seconds
 * @param {string} str string to parse
 * @param {parse_options} options
 *
 * @example
 * parse("1m", "s") --> 60
 * parse("-1m", "s") --> -60 */
function parseTime(str, options) {
	options = { type: "ms", fromNow: false, ...options };
	if (!isNaN(+str)) return +str; else str = `${str}`;
	
    let isNegative = str.at(0) === "-";
    let time = str.match(/[a-zA-Z]+|[0-9]+/g); if (isNaN(+time[0]))
		return new TypeError(`\'${str}\' must be a valid time string`);
    
	let parsed = 0;

    switch (time[1]) {
        case "y": parsed = (+time[0] * 12 * 4 * 7 * 24 * 60 * 60 * 1000); break;
        case "mth": parsed = (+time[0] * 4 * 7 * 24 * 60 * 60 * 1000); break;
        case "w": parsed = (+time[0] * 7 * 24 * 60 * 60 * 1000); break;
        case "d": parsed = (+time[0] * 24 * 60 * 60 * 1000); break;
        case "h": parsed = (+time[0] * 60 * 60 * 1000); break;
        case "m": parsed = (+time[0] * 60 * 1000); break;
        case "s": parsed = (+time[0] * 1000); break;
        case "ms": parsed = (+time[0]); break;
    }

    if (options.fromNow) parsed = isNegative
        ? Date.now() - parsed
        : Date.now() + parsed;

    switch (options.type) {
        case "s": return isNegative && !options.fromNow ? -_nT.msToSec(parsed) : _nT.msToSec(parsed);
        case "ms": return isNegative && !options.fromNow ? -parsed : parsed;
        default: return isNegative && !options.fromNow ? -parsed : parsed;
    }
}

/** @typedef eta_options
 * @property {number|string} now unix time in milliseconds, defaults to Date.now()
 * @property {number|string} then unix time in milliseconds or parsable string
 * @property {boolean} ignorePast return null if "then" is in the past
 */

/** Get the time between then and now and parse it into a human-readable string
 * @param {eta_options} options
 *
 * @example
 * eta({ then: "1h" }) // returns "in 1 hour"
 * eta({ now: 1689769804, then: 1689766204 }) // returns "1 hour ago"
 * eta({ now: 1689769804, then: 1689766204, ignorePast: true }) // returns null */
function eta(options) {
	options = { now: Date.now(), then: null, ignorePast: false, ...options };

	/// Error handling
	options.now = +options.now;
	if (isNaN(options.now)) throw new Error(`\'${options.now}\' is not a valid unix time`);

	if (isNaN(options.then)) options.then = Date.now() + parseTime(options.then.trim(), "ms");
	else options.then = +options.then;

	if (typeof options.then !== ("number" || "string")) throw new Error(`\'${options.then}\' is not a valid time/number`);

	// Get the resulting time between the 2 times
	let timeDifference = _nT.msToSec(options.then - options.now);

	// Return null if the difference is negative
	if (options.ignorePast && timeDifference < 0) return null;

	// Create a new Intl formatter
	let formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

	// Define a number for each time division
	let divisions = [
		{ amount: 60, name: "seconds" },
		{ amount: 60, name: "minutes" },
		{ amount: 24, name: "hours" },
		{ amount: 7, name: "days" },
		{ amount: 4.34524, name: "weeks" },
		{ amount: 12, name: "months" },
		{ amount: Number.POSITIVE_INFINITY, name: "years" }
	];

	// Find which time division our difference falls in
	let div = divisions.find(d => {
		if (Math.abs(timeDifference) < d.amount) return d;
		timeDifference /= d.amount;
	});

	// Return the difference as a formatted string
	return formatter.format(timeDifference.toFixed(), div.name);
}

module.exports = { parseTime, eta };
