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

/** @typedef bM_callback_params
 * @property {number} idx index of the element being processed
 * @property {Array} arrayOriginal original array being processed
 * @property {Array} arrayNew new array being constructed
 * @property {never} lastElement the last element in the new array */

/** Called once for every element in the array
 * @callback bM_callback
 * @param {never} value element being processed
 * @param {bM_callback_params} params callback parameters */

/** Return an array that contains the results of the given callback function
 *
 * - Gives callback access to the new array being constructed
 * @param {bM_callback} callback */
function betterMap(arr, callback) {
	let arr_new = [];

	for (let idx = 0; idx < arr.length; idx++) {
		let cb = callback(arr[idx], {
			idx,
			arrayOriginal: arr,
			arrayNew: arr_new,
			lastElement: arr_new[idx - 1] || undefined
		});

		if (cb) arr_new.push(cb);
	}

	return arr_new;
}

betterMap([1, 2, 3, 4, 5], (num, { idx, arrayOriginal, arrayNew, lastElement }) => {
	console.log(
		"num: " + num,
		"idx: " + idx,
		"arrayOriginal: " + arrayOriginal,
		"arrayNew: " + arrayNew,
		"lastElement: " + lastElement
	);
	return num;
});

module.exports = { chunk, unique, betterMap };
