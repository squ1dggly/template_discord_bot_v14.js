/** Get a property value from an object using the provided path
 * @param {object} obj object
 * @param {string} path path to the nested property
 *
 * @example // returns 5
 * let obj = { a: 5 };
 * getProp(obj, "a")
 * 
 * @example // returns "hello, world!"
 * let obj = { a: [{ content: "hello, world!" }] };
 * getProp(obj, "a[0].content") */
function getProp(obj, path) {
	if (typeof obj !== "object") throw new TypeError("You must provide a valid object");
	if (typeof path !== "string") throw new TypeError("You must provide a valid path string");
	if (!path.trim()) return obj;

	path = path
		// Strip whitespace
		.trim()
		// Replace array indexes with property index values
		.replace(/\[(\w+)\]/g, ".$1")
		// Strip leading dots
		.replace(/^\./, "");

	// Split path into an array of property names
	let _path = path.split(".");

	// Used for debugging where we were at before throwing an error
	let debug_path = [];

	// Iterate through each property path strings
	for (let i = 0; i < _path.length; ++i) {
		// Get the current property path we're at
		let prop = _path[i];

		// DEBUGGING
		debug_path.push(prop);

		try {
			// Check if the property exists
			if (prop in obj && obj[prop] === undefined)
				throw new Error(`Object property \'${debug_path.join(".")}\' is undefined`);

			// Set obj to the new value
			obj = obj[prop];
		} catch {
			throw new Error(`Cannot get property \'${prop}\' from \'${obj}\'`);
		}
	}

	return obj;
}

module.exports = { getProp };
