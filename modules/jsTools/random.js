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