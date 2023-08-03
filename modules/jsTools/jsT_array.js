const _o = require("./jsT_object");

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
	let arr_new = [];
	let map = new Map();

	for (let item of arr) {
		let _prop = typeof item === "object" ? _o.getProp(item, prop) : item;

		// prettier-ignore
		if (!map.has(_prop)) {
			map.set(_prop, true); arr_new.push(item);
		}
	}

	return copy ? structuredClone(arr_new) : arr_new;
}

/** Called once for every element in the array
 * @callback bM_callback
 * @param {never} value element being processed
 * @param {number} idx index of the element being processed
 * @param {never} lastElement the last element in the new array
 * @param {Array} arrayNew new array being constructed
 * @param {Array} arrayOriginal original array being processed */

/** Create an array that contains the results of the given callback function
 *
 * - Gives callback access to the new array being constructed
 * @param {bM_callback} callback */
function betterMap(arr, callback) {
	let arr_original = arr;
	let arr_new = [];

	for (let idx = 0; idx < arr_original.length; idx++) {
		let _lastElement = arr_new[idx - 1] || undefined;
		arr_new.push(callback(arr_original[idx], idx, _lastElement, arr_new, arr_original));
	}

	return arr_new;
}

module.exports = { chunk, unique, betterMap };
