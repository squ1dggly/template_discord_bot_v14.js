const _aT = require("./jT_array");

// prettier-ignore
const alphabet = [
    "a", "b", "c", "d",
    "e", "f", "g", "h",
    "i", "j", "k", "l",
    "m", "n", "o", "p",
    "q", "r", "s", "t",
    "u", "v", "w", "x",
    "y", "z"
];

// prettier-ignore
/** Choose a psuedo-random number within a min-max range
 * @param {number|string} min minimum value
 * @param {number|string} max maximum value
 * @param {boolean} round round up the sum */
function randomNumber(min, max, round = true) {
	min = +min; if (isNaN(min)) throw new TypeError(`\`${min}\` must be a valid number`);
	max = +max; if (isNaN(max)) throw new TypeError(`\`${max}\` must be a valid number`);

	let sum = min + (max - min) * Math.random();
	
	return round ? Math.round(sum) : sum;
}

/** Create a psuedo-random string of numbers (0-9)
 * @param {number} len length of the string */
function numericString(len) {
	let str = "";
	for (let i = 0; i < len; i++) str += randomNumber(0, 9);
	return str;
}

/** Create a psuedo-random string of letters (a-z)
 * @param {number} len length of the string
 * @param {boolean} includeCaps include uppercase letters */
function alphaString(len, includeCaps = false) {
	let str = "";
	// prettier-ignore
	for (let i = 0; i < len; i++) str += includeCaps && chance()
		? choice(alphabet).toUpperCase()
		: choice(alphabet);
	return str;
}

/** Create a psuedo-random string of letters and numbers (a-z|0-9)
 * @param {number} len length of the string
 * @param {boolean} includeCaps include uppercase letters */
function alphaNumericString(len, includeCaps = false) {
	let str = "";
	for (let i = 0; i < len; i++) {
		let char = String(chance() ? choice(alphabet) : randomNumber(0, 9));
		str += includeCaps && chance() ? char.toUpperCase() : char;
	}
	return str;
}

// prettier-ignore
/** Return true by a psuedo-random chance between 1-100%
 *
 * chance is 50% by default
 * @param {number|string} percent a number between 1 and 100 */
function chance(percent = 50) {
    percent = +percent; if (isNaN(percent)) throw new TypeError(`\`${percent}\` must be a number`);
    if (percent < 1 || percent > 100) throw new Error(`\`${percent}\` must be within a range of 1 and 100`);
    return randomNumber(0, 100) < percent;
}

/** Choose a psuedo-random item from an array
 * @param {array} arr array of items to choose from
 * @param {boolean} copy return a deep copy of the array using structuredClone() */
function choice(arr, copy = false) {
	if (!Array.isArray(arr)) throw new TypeError("You must provide a valid array");
	let item = arr[randomNumber(0, arr.length - 1)];
	return copy ? structuredClone(item) : item;
}

/** Return a psuedo-random number index from an array's length
 * @param {array} arr array of items to choose from */
function choiceIndex(arr) {
	if (!Array.isArray(arr)) throw new TypeError("You must provide a valid array");
	return randomNumber(0, arr.length - 1);
}

// prettier-ignore
/** Choose a psuedo-random object from an array based on the object's "rarity" property
 * @param {array} arr array of objects to choose from
 * @param {boolean} copy return a deep copy of the array using structuredClone() */
function choiceWeighted(arr, clone = false) {
	/// Error handling
	if (!Array.isArray(arr)) throw new TypeError("You must provide a valid array");

	// Check if the object array has a "rarity" property
	arr.forEach((obj, idx) => {
		if ((obj?.rarity || obj?.Rarity) === (null || undefined))
			throw new Error(`An element at index ${idx} does not have a \"rarity\" property`);

		// Convert "rarity" into a valid number
		let rarity = +arr[idx].rarity || +arr[idx].Rarity;
		arr[idx].rarity = rarity; delete arr[idx].Rarity;

		if (isNaN(obj.rarity)) throw new TypeError(`Rarity at index ${idx} is not a valid number`);
	});

	/// Determine the element to return    
    let weights = _aT.betterMap(arr, (obj, idx, last) => {
        return obj.rarity + (last || 0)
    });

	// Generates a random float and multiplies it by the largest sum in the array of weights
	let decider = Math.random() * weights[weights.length - 1];

	// Returns the first item in the original array that has a rarity higher than or equal to decider
	// how this picks a random item from that rarity I still have no idea but at least it's less work for me, lol
	let item = arr[weights.findIndex(w => w >= decider)];
	return clone ? structuredClone(item) : item;
}

module.exports = {
	randomNumber,
	numericString,
	alphaString,
	alphaNumericString,
	chance,
	choice,
	choiceIndex,
	choiceWeighted
};
