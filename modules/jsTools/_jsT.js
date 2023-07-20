const arrayTools = require("./array");
const stringTools = require("./string");
const numberTools = require("./number");
const randomTools = require("./random");
const objectTools = require("./object");
const dateTools = require("./date");
const asyncTools = require("./async");

module.exports = {
	...arrayTools,
	...stringTools,
	...numberTools,
	...randomTools,
	...objectTools,
	...dateTools,
	...asyncTools
};
