const arrayTools = require("./jT_array");
const stringTools = require("./jT_string");
const numberTools = require("./jT_number");
const randomTools = require("./jT_random");
const objectTools = require("./jT_object");
const dateTools = require("./jT_date");
const asyncTools = require("./jT_async");
const fileTools = require("./jT_file");

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
