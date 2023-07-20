const _aT = require("./array");

// prettier-ignore
/** Choose a psuedo-random number within a min-max range
 * @param {number|string} min minimum value
 * @param {number|string} max maximum value
 * @param {boolean} round round up the sum */
function number(min, max, round = true) {
    min = +min; if (isNaN(min)) throw new TypeError(`\`${min}\` must be a valid number`);
    max = +max; if (isNaN(max)) throw new TypeError(`\`${max}\` must be a valid number`);

    return round
        ? Math.floor(Math.random() * (max - min))
        : Math.random() * (max - min);
}

// prettier-ignore
/** Return true by a psuedo-random chance between 1-100%
 *
 * chance is 50% by default
 * @param {number|string} percent a number between 1 and 100 */
function chance(percent = 50) {
    percent = +percent; if (isNaN(percent)) throw new TypeError(`\`${percent}\` must be a number `);
    if (percent < 1 || percent > 100) throw new Error(`\`${percent}\` must be within a range of 1 and 100`);
    return number(0, 100) < percent;
}

/** Choose a psuedo-random item from an array
 * @param {array} arr array of items to choose from
 * @param {boolean} copy return a deep copy of the array using structuredClone() */
function choice(arr, copy = false) {
	if (!Array.isArray(arr)) throw new TypeError(`You must provide a valid array`);
	let item = arr[number(0, arr.length - 1)];
	return copy ? structuredClone(item) : item;
}

/** Return a psuedo-random number index from an array's length
 * @param {array} arr array of items to choose from */
function choiceIndex(arr) {
	if (!Array.isArray(arr)) throw new TypeError(`You must provide a valid array`);
	return number(0, arr.length - 1);
}

// prettier-ignore
/** Choose a psuedo-random object from an array based on the object's "rarity" property
 * @param {array} arr array of objects to choose from
 * @param {boolean} copy return a deep copy of the array using structuredClone() */
function choiceWeighted(arr, clone = false) {
	/// Error handling
	if (!Array.isArray(arr)) throw new TypeError(`You must provide a valid array`);

	// Check if the object array has a "rarity" property
	arr.forEach((obj, idx) => {
		if (obj?.rarity === (null || undefined) || obj?.Rarity === (null || undefined))
			throw new Error(`An element at index ${idx} does not have a "rarity" property`);

		// Convert "rarity" into a valid number
		let rarity = +arr[idx].rarity || +arr[idx].Rarity;
		arr[idx].rarity = rarity; delete arr[idx].Rarity;

		if (isNaN(obj.rarity)) throw new TypeError(`Rarity at index ${idx} is not a valid number`);
	});

	/// Determine the element to return
	/* let weights = [];
	for (let i = 0; i < arr.length; i++)
		weights.push((arr[i]?.rarity || arr[i]?.Rarity) + (weights[weights.length - 1] || 0)); */

    /* let weights = arr.map((obj, idx, arr) => {
        obj.rarity + arr[i-1]
    }); */
    /* let weights = [];
    for (let i = 0; i < arr.length; i++)
        weights.push(arr[i].rarity + (weights[weights.length - 1] || 0)); */
    
    let weights = _aT.betterMap(arr, (obj, idx, a) => {
        return obj.rarity + (a[a.length - 1])
    });

	// Generates a random float and multiplies it by the largest sum in the array of (weights)
	let decider = Math.random() * weights[weights.length - 1];

	// Returns the first item in the original array that has a rarity higher than or equal to (decider)
	// how this picks a random item from that rarity I still have no idea but at least it's less work for me, lol
	let item = arr[weights.findIndex(w => w >= decider)];
	return clone ? structuredClone(item) : item;
}
