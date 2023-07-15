function format(num, options) { }

/** Append cardinal number's ordinal position to the end of it
 * @param {number} num number to format
 * 
 * @example // returns "1st"
 * toOrdinal(1);
 * 
 * @example // returns "3rd"
 * toOrdinal(3);
 */
function toOrdinal(num) {
    if (isNaN(num)) throw TypeError("You must provide a valid number");

    let positions = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"];
    let str = num.toString();
    return `${str}${positions[Number(str[--str.length])]}`;
}