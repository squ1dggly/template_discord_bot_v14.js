const arrayTools = require("./jsT_array");
const stringTools = require("./jsT_string");
const numberTools = require("./jsT_number");
const randomTools = require("./jsT_random");
const objectTools = require("./jsT_object");
const dateTools = require("./jsT_date");
const asyncTools = require("./jsT_async");
const fileTools = require("./jsT_file");

module.exports = {
	...arrayTools,
	...stringTools,
	...numberTools,
	...randomTools,
	...objectTools,
	...dateTools,
	...asyncTools,
	...fileTools
};
