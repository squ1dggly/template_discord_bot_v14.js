/** Make the first letter of every alphanumeric word uppercase
 * @param {string} str string to convert */
function toTitleCase(str) {
	return str.replace(
		/\w\S*/g,
		txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
	);
}

module.exports = { toTitleCase };
