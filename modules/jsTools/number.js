const _oT = require("./object");

/** Get the sum of an array of numbers
 * @param {number[] | string[]} arr array to sum
 * @param {string} path path to a nested array property to sum
 * @param {boolean} ignoreNaN ignore non-numerical values and use 0 instead */
function sum(arr, path = "", ignoreNaN = false) {
	path = path.trim();

	// Use object property path
	if (path)
		return arr.reduce((a, b) => {
			b = +_oT.getProp(b, path);
			if (isNaN(b)) throw new TypeError(`${b} is not a valid number`);

			return a + b;
		});
	// Assume the array is an array of numbers
	else
		return arr.reduce((a, b) => {
			b = +b;
			if (isNaN(b)) throw new TypeError(`${b} is not a valid number`);

			return a + b;
		});
}

/** Add decimal points to a number
 * @param {number | string} num number to format
 * @param {boolean} comma use a comma "," instead of a period "."
 *
 * @example // returns "1,000"
 * format(1000);
 *
 * @example // returns "1.000"
 * format(1000, false); */
function format(num, comma = true) {
	num = +num;
	if (isNaN(num)) throw new TypeError("You must provide a valid number");
	return num.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, comma ? "," : ".");
}

/** Append a cardinal number's ordinal position to the end of it
 * @param {number | string} num number to format
 *
 * @example // returns "1st"
 * toOrdinal(1);
 *
 * @example // returns "3rd"
 * toOrdinal(3); */
function toOrdinal(num) {
	num = +num;
	if (isNaN(num)) throw TypeError("You must provide a valid number");

	let positions = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"];
	let str = num.toString();
	return `${str}${positions[Number(str[--str.length])]}`;
}
