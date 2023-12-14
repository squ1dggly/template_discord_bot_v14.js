/** @typedef readDir_options
 * @property {boolean} recursive Return nested files inside of the directory */

const fs = require("fs");

/** Get an array of file paths inside of a folder
 * @param {string} path path to the folder
 * @param {readDir_options} options options */
function readDir(path, options) {
	options = { recursive: false, ...options };

	// Check if the file path exists first
	if (!fs.existsSync(path)) return [];

	if (!options.recursive) return fs.readdirSync(path);

	const walk = _dir => {
		/** @type {string[]} */
		let results = [];

		let directory = fs.readdirSync(_dir);

		let file_stats = directory.map(fn => fs.statSync(`${_dir}/${fn}`));
		let files = directory.filter((fn, idx) => file_stats[idx].isFile());
		let dirs = directory.filter((fn, idx) => file_stats[idx].isDirectory());

		for (let fn of files) results.push(`${_dir}/${fn}`);
		for (let dn of dirs) results.push(...walk(`${_dir}/${dn}`));

		return results;
	};

	return walk(path);
}

module.exports = { readDir };
