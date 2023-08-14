const _oT = require("./jsT_object");

// prettier-ignore
/** Get the sum of an array of numbers, negative values are subtracted from the sum
 * @param {number[] | string[] | object[]} arr array to sum
 * @param {string} path path to a nested array property to sum
 * @param {boolean} ignoreNaN ignore non-numerical values and use 0 instead */
function sum(arr, path = "", ignoreNaN = false) {
	path = path.trim();

	return arr.reduce((a, b) => {
		let _b = path ? +_oT.getProp(b, path) : +b;

		if (isNaN(b) && !ignoreNaN) throw new TypeError(`\'${b}\' is not a valid number`);

		return _b < 0 ? (a - -_b) : a + (_b || 0);
	});
}

// prettier-ignore
/** Convert seconds to milliseconds by multiplying it by 1,000
 * @param {number} sec seconds
 * @param {boolean} round round up the sum */
function secToMs(sec, round = true) {
	sec = +sec; if (isNaN(sec)) throw new TypeError(`\'${sec}\' is not a valid number`);
	return round ? Math.floor(sec * 1000) : sec * 1000;
}

// prettier-ignore
/** Convert milliseconds to seconds by dividing it by 1,000
 * @param {number} ms milliseconds
 * @param {boolean} round round up the sum */
function msToSec(ms, round = true) {
	ms = +ms; if (isNaN(ms)) throw new TypeError(`\'${ms}\' is not a valid number`);
	return round ? Math.floor(ms / 1000) : ms / 1000;
}

// prettier-ignore
/** Get the percentage value between 2 numbers
 * @param {number | string} a 1st number
 * @param {number | string} b 2nd number
 * @param {boolean} round round up the sum
 *
 * @example
 * percent(50, 100) --> 50 // i.e 50%
 * percent(30, 40) --> 75 // i.e 75% */
function percent(a, b, round = true) {
	a = +a; if (isNaN(a)) throw new TypeError(`\'${a}\' is not a valid number`);
	b = +b; if (isNaN(b)) throw new TypeError(`\'${b}\' is not a valid number`);

	return round ? Math.floor((a / b) * 100) : (a / b) * 100;
}

/** @typedef options_clamp
 * @property {number|null} min if set to null, negative numbers can pass
 * @property {number|null} max if set to null, positive numbers can pass */

/** Clamp a number inside a min max range
 *
 * clamps (0 - 100) by default
 * @param {number} num number to clamp
 * @param {options_clamp} options options */
function clamp(num, options = {}) {
	options = { min: 0, max: 100, ...options };

	if (options.min !== null) if (num < options.min) num = options.min;
	if (options.max !== null) if (num > options.max) num = options.max;
	return num;
}

// prettier-ignore
/** Add decimal points to a number
 * @param {number | string} num number to format
 * @param {boolean} comma use a comma "," instead of a period "."
 *
 * @example
 * format(1000) --> "1,000"
 * format(1000, false) --> "1.000" */
function format(num, comma = true) {
	num = +num; if (isNaN(num)) throw new TypeError("You must provide a valid number");
	return num.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, comma ? "," : ".");
}

// prettier-ignore
/** Append a cardinal number's ordinal position to the end of it
 * @param {number | string} num number to format
 *
 * @example
 * toOrdinal(1) --> "1st"
 * toOrdinal(2) --> "2nd" */
function toOrdinal(num) {
	num = +num; if (isNaN(num)) throw TypeError("You must provide a valid number");

	let positions = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"];
	let str = num.toString();
	return `${str}${positions[Number(str[--str.length])]}`;
}

module.exports = { sum, secToMs, msToSec, percent, clamp, format, toOrdinal };
