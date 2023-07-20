const _o = require("./object");

/** Split an array into smaller arrays that don't exceed a given size
 * @param {array} arr array to split
 * @param {number} size max size before splitting
 * @param {boolean} copy return a deep copy of the array using structuredClone() */
function chunk(arr, size, copy = false) {
	if (!Array.isArray(arr)) throw new TypeError("A valid array must be provided");
	if (size <= 0) throw new Error("Size cannot be 0 or negative");
	if (!arr.length || arr.length < size) return arr;

	let chunk = [];

	// Iterate through the array
	for (let i = 0; i < arr.length; i += size) {
		// Slice the array from the current index
		chunk = arr.slice(i, i + size);
	}

	return copy ? structuredClone(chunk) : chunk;
}

/** Filter out non-unique items from an array
 * @param {Array} arr array to filter
 * @param {string} prop a nested property within each item to filter by
 * @param {boolean} copy return a deep copy of the array using structuredClone() */
function unique(arr, prop = "", copy = false) {
	let arr_new = [...new Map(arr.map(item => [_o.getProp(item, prop)], item)).values()];
	return copy ? structuredClone(arr_new) : arr_new;
}

module.exports = { chunk, unique };
