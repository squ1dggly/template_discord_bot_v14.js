// ! Array
/** Split an array into groups of the specified size.
 * @param {array} arr The array you wish to split.
 * @param {number} size The size of the returned groups.
 * @returns {array} The split array.
 */
function array_chunk(arr, size) {
    if (!size) return;
    if (arr.length < size) return [arr];

    let arr_new = [];
    for (let i = 0; i < arr.length; i += size)
        arr_new.push(arr.slice(i, i + size));

    return arr_new;
}

// ! String
/** Capitalize the first letter of each word in a string.
 * @param {string} str The string you wish to convert. 
 * @returns {string} The string.
 */
function string_toTitleCase(str) {
    return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

/** Format a number with proper currency decimal placement.
 * @param {string|number} number The string or number you wish to format.
 * @param {{round:false,compact:false,currencyCode:string}} options Formatting options.
 * @returns {string} The formatted number as a string. 
 */
function string_formatNumber(number, options = { round: false, compact: false, currencyCode: "" }) {
    // Convert the number parameter into a, well, number, if it wasn't already
    let num = typeof number !== "number" ? Number(number) : number;
    if (isNaN(num)) return;

    // Round the number to the nearest greater whole number
    if (options.round)
        num = Math.round(num);

    // Check for options and add them to an option object if there are any
    let intlOptions = {};

    if (options.currencyCode) {
        intlOptions.currency = options.currencyCode
        intlOptions.style = "currency";
    }

    if (options.compact)
        intlOptions.notation = "compact";

    // Format the number using (Intl) if there were options available
    if (intlOptions) {
        let formatter = new Intl.NumberFormat(undefined, intlOptions);
        return formatter.format(num);
    }

    // Otherwise, return a string of the number formatted in hundreds
    return num.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

/** Format a number appending its place to the end.
 * 
 * ```js
 * formatNumberToPlace(6) -> "6th"
 * ```
 * @param {number} num The number you wish to format.
 */
function string_formatNumberToPlace(num) {
    if (!num) return null;
    let places = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"]
    let str = num.toString();
    return str + places[Number(str[--str.length])];
}

// ! Number
/** Convert the given milliseconds into seconds by dividing the number by 1,000 .
 * @param {number} num A value of milliseconds.
 */
function number_milliToSeconds(num, toString = false) {
    if (toString)
        return Math.floor(num / 1000).toString();
    else
        return Math.floor(num / 1000);
}

/** Convert the given seconds into milliseconds by multiplying the number by 1,000 .
 * @param {number} num A value of seconds.
 */
function number_secondsToMilli(num, toString = false) {
    if (toString)
        return Math.floor(num * 1000).toString();
    else
        return Math.floor(num * 1000);
}

/** Get the percentage of the given number.
 * @param {number} num The number.
 * @param {number} percent A value from 0 to 100.
 * @param {boolean} round Whether to round the returned percentage to the nearest integer.
 */
function number_percentage(num, percent, round) {
    return round ? Math.round(num * percent / 100) : num * percent / 100;
}

/** Clamp the given number between the specified range.
 * @param {number} num The number to clamp.
 * @param {number} min The minimum range
 * @param {number} max The maximum range
 */
function number_clamp(num, min, max) {
    return num < min ? min : num > max ? max : num;
}

// ! Date
/** Get the time between the given date and now in a human-readable format.
 * @param {number} unixInSeconds The UNIX date in seconds.
 * @param {boolean} ignorePast If true, returns null if the given date is before the current time.
 */
function date_eta(unixInSeconds, ignorePast = false) {
    if (!unixInSeconds) return null;

    let duration = unixInSeconds - number_milliToSeconds(Date.now());
    if (ignorePast && duration < 0) return null;

    let formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

    let divisions = [
        { amount: 60, name: "seconds" },
        { amount: 60, name: "minutes" },
        { amount: 24, name: "hours" },
        { amount: 7, name: "days" },
        { amount: 4.34524, name: "weeks" },
        { amount: 12, name: "months" },
        { amount: Number.POSITIVE_INFINITY, name: "years" }
    ]

    let div = divisions.find(d => {
        if (Math.abs(duration) < d.amount)
            return d;

        duration /= d.amount;
    });

    return formatter.format(duration.toFixed(), div.name);
}

// ! Random
/** Has a 50% chance to return true/false. */
function random_chance50() {
    return Math.round(Math.random()) === 1;
}

/** Specify a chance from 1-100% which will return true/false.
 * 
 * Defaults to 50%.
 * @param {number} percentage The chance from 1-100% to return true.
 */
function random_chance(percentage = 50) {
    let rnd = random_number(0, 100, false);
    return rnd < percentage;
}

/** Pick a random item from the given array.
 * @param {array} arr The array.
 * @returns {item} The chosen item from the array.
 */
function random_choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick a random item index from the given array.
 * @param {array} arr The array.
 * @returns {item} The chosen item from the array.
 */
function random_choiceIdx(arr) {
    return random_number(0, arr.length - 1);
}

/** Choose a random item from the given array based on the item's rarity.
 * 
 * Each item in the array must have a "rarity" property for it to be chosen.
 * @param {[{rarity: 50}]} arr The array of items.
 * @returns {item} The chosen item from the array.
 */
function random_weightedChoice(arr) {
    // Creates an array with only the rarity property which are then summed together with the previous entry
    /* example:
        arr = [{ item: "yes", rarity: 4 }, { item: "no", rarity: 20 }]
        weights = [4, 24];
    */
    let weights = [];
    for (let i = 0; i < arr.length; i++)
        weights.push((arr[i]?.rarity || arr[i]?.Rarity) + (weights[weights.length - 1] || 0));

    // Generates a random float and multiplies it by the largest sum in the array of (weights)
    let decider = Math.random() * weights[weights.length - 1];

    // Returns the first item in the original array that has a rarity higher than or equal to (decider)
    // how this picks a random item from that rarity I still have no idea but at least it's less work for me, lol
    return arr[weights.findIndex(w => w >= decider)];
}

/** Return a random number.
 * @param {number} min The minimum value to return.
 * @param {number} max The maximum value to return.
 * @param {boolean} round Whether to round the result to the nearest integer. Default: true
 */
function random_number(min, max, round = true) {
    if (round)
        return min + Math.round(Math.random() * (max - min));
    else
        return min + Math.random() * (max - min);
}

/** Return a random string of numbers (0-9) in the given length.
 * @param {number} length The length of the returned string.
 */
function random_numberString(length) {
    let string = "";

    for (let i = 0; i < length; i++)
        string += `${Math.floor(Math.random() * 9)}`;

    return string;
}

/** Return a random string of letters (a-z) in the given length.
 * @param {number} length The length of the returned string.
 * @param {boolean} includeCaps Whether to include both upper and lowercase characters in the final string.
 */
function random_letterString(length, includeCaps = false) {
    let string = "";
    let alphabet = [
        "a", "b", "c", "d",
        "e", "f", "g", "h",
        "i", "j", "k", "l",
        "m", "n", "o", "p",
        "q", "r", "s", "t",
        "u", "v", "w", "x",
        "y", "z"];

    for (let i = 0; i < length; i++) {
        let char = alphabet[Math.floor(Math.random() * alphabet.length)];
        if (includeCaps && random_chance()) char = char.toUpperCase();
        string += char;
    }

    return string;
}

/** Return a random alpha-numeric string (a-z|0-9) in the given length.
 * @param {number} length The length of the returned string.
 * @param {boolean} includeCaps Whether to include both upper and lowercase characters in the final string.
 */
function random_alphaNumericString(length, includeCaps = false) {
    let string = "";
    let alphabet = [
        "a", "b", "c", "d",
        "e", "f", "g", "h",
        "i", "j", "k", "l",
        "m", "n", "o", "p",
        "q", "r", "s", "t",
        "u", "v", "w", "x",
        "y", "z"];

    for (let i = 0; i < length; i++) {
        let char = random_chance()
            ? alphabet[random_number(0, (alphabet.length - 1))]
            : `${random_number(0, 9)}`;

        if (includeCaps && random_chance()) char = char.toUpperCase();
        string += char;
    }

    return string;
}

// ! Async
/** A promise based implementation of setTimeout.
 * @param {number} ms The amount of time to wait in milliseconds.
 */
async function async_wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    /** Functions useful for dealing with arrays. */
    arrayTools: {
        chunk: array_chunk
    },

    /** Functions useful for dealing with strings. */
    stringTools: {
        toTitleCase: string_toTitleCase,
        formatNumber: string_formatNumber,
        formatNumberToPlace: string_formatNumberToPlace
    },

    /** Functions useful for dealing with numbers. */
    numberTools: {
        milliToSeconds: number_milliToSeconds,
        secondsToMilli: number_secondsToMilli,
        percentage: number_percentage,
        clamp: number_clamp
    },

    /** Functions useful for dealing with dates. */
    dateTools: {
        eta: date_eta
    },

    /** Functions useful for dealing with random. */
    randomTools: {
        chance50: random_chance50,
        chance: random_chance,
        choice: random_choice,
        choiceIdx: random_choiceIdx,
        weightedChoice: random_weightedChoice,
        number: random_number,
        numberString: random_numberString,
        letterString: random_letterString,
        alphaNumericString: random_alphaNumericString
    },

    /** Asynchronous functions useful for dealing with syncronous operations. */
    asyncTools: {
        wait: async_wait
    }
};