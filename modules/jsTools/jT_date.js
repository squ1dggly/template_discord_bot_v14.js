const _nT = require("./jT_number");

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
	if (!isNaN(str)) return str;
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
 * @property {number|string} since the anchor to go off of, a unix timestamp in milliseconds **|** `Date.now()` is default
 * @property {boolean} ignorePast returns `null` if `end` is before `start`
 * @property {number} decimalLimit limits the number of digits after the decimal point **|** `0` is default
 */

/** Parse the time difference between 2 unix timestamps into a human-readable string
 * @param {number|string} unix
 * @param {eta_options} options
 *
 * @example
 * eta(1703001733955) // returns "1 hour" (from now)
 * eta(1702994533936, { ignorePast: true }) // returns null */
function eta(unix, options) {
	unix = +unix;
	if (isNaN(unix)) throw new Error("unix must be a number or string");

	options = { since: Date.now(), ignorePast: false, decimalLimit: 0, ...options };

	/// Get the difference between the 2 times
	let isPast = unix - options.since < 0;
	if (options.ignorePast) return null;

	let difference = Math.abs(unix - options.since);
	// Return if there's no difference
	if (!difference) return "now";

	let divisions = [
		{ name: "milliseconds", amount: 1000 },
		{ name: "seconds", amount: 60 },
		{ name: "minutes", amount: 60 },
		{ name: "hours", amount: 24 },
		{ name: "days", amount: 168 },
		{ name: "weeks", amount: 4 },
		{ name: "months", amount: 12 },
		{ name: "years", amount: Number.POSITIVE_INFINITY }
	];

	// Divide the difference until we reach a result
	let result = divisions.find(div => {
		if (difference < div.amount) return div;
		difference = Math.abs(difference / div.amount).toFixed(options.decimalLimit);
	});

	// Grammar adjustment
	if (+difference === 1) result.name = result.name.slice(0, -1);

	return `${difference} ${result.name}${isPast ? " ago" : ""}`;
}

module.exports = { parseTime, eta };
