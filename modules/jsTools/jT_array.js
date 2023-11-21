/** Called once for every element in the array
 * @callback bM_callback
 * @param {never} value element being processed
 * @param {number} idx index of the element being processed
 * @param {never} lastElement the last element in the array
 * @param {Array} arrayNew new array being constructed
 * @param {Array} arrayOriginal original array being processed */

/** Called once for every element in the array
 * @callback tM_callback
 * @param {never} value element being processed
 * @param {number} idx index of the element being processed
 * @param {never} lastElement the last element in the map
 * @param {Map} mapNew new map being constructed
 * @param {Array} arrayOriginal original array being processed */

const _o = require("./jT_object");

/** Split an array into smaller arrays that don't exceed a given size
 * @param {array} arr array to split
 * @param {number} size max size before splitting
 * @param {boolean} copy return a deep copy of the array using structuredClone() */
function chunk(arr, size, copy = false) {
	if (!Array.isArray(arr)) throw new TypeError("A valid array must be provided");
	if (size <= 0) throw new Error("Size cannot be 0 or negative");
	if (!arr.length || arr.length < size) return [arr];

	let chunk = [];

	// Iterate through the array
	for (let i = 0; i < arr.length; i += size) {
		// Slice the array from the current index
		chunk.push(arr.slice(i, i + size));
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

/** Check if the given item is an array, return the item in an array if it isn't
 * @param {Array} item array to filter
 * @param {boolean} copy return a deep copy of the array using structuredClone() */
function isArray(item, copy = false) {
	if (!Array.isArray(item)) item = [item];
	return copy ? structuredClone(item) : item;
}

/** Create an array that contains the results of the given callback function
 *
 * - Gives callback access to the new array being constructed
 * @param {bM_callback} callback
 * @param {boolean} copy return a deep copy of the array using structuredClone() */
function betterMap(arr, callback, copy = false) {
	let arr_original = arr;
	let arr_new = [];

	for (let idx = 0; idx < arr_original.length; idx++) {
		let _lastElement = arr_new[idx - 1] || undefined;
		arr_new.push(callback(arr_original[idx], idx, _lastElement, arr_new, arr_original));
	}

	return copy ? structuredClone(arr_new) : arr_new;
}

/** Create a map that contains the results of the given callback function
 *
 * - Gives callback access to the new map being constructed
 * @param {tM_callback} callback
 * @param {boolean} copy deep copy each item added to the map using structuredClone() */
function toMap(arr, callback, copy = false) {
	let arr_original = arr;
	let map_new = new Map();

	for (let idx = 0; idx < arr.length; idx++) {
		let _lastElement = Array.from(map_new.values()).pop();
		let item = callback(arr[idx], idx, _lastElement, map_new, arr_original);

		if (!"key" in item) throw new Error("Callback did not return a { key }");
		if (!"value" in item) throw new Error("Callback did not return a { value }");

		map_new.set(item.key, copy ? structuredClone(item.value) : item.value);
	}

	return map_new;
}

module.exports = { chunk, unique, isArray, betterMap, toMap };
