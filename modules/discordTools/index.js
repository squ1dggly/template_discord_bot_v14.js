const config = require("./dT_config.json");

const BetterEmbed = require("./dT_betterEmbed");
const EmbedNavigator = require("./dT_embedNavigator");

const deleteMessageAfter = require("./dT_deleteMessageAfter");
const awaitConfirm = require("./dT_awaitConfirm");
const dynaSend = require("./dT_dynaSend");
const ansi = require("./dT_ansi");

const jt = require("../jsTools");

/* Check config file for errors */
// prettier-ignore
if (isNaN(jt.parseTime(config.timeouts.PAGINATION)))
	throw new Error("You must provide a valid time string/number for \`timeouts.PAGINATION\`. Fix this in '_dT_config.json'");
// prettier-ignore
if (!config.timeouts.CONFIRMATION)
	throw new Error("You must provide a valid time string/number for \`timeouts.CONFIRMATION\`. Fix this in '_dT_config.json'");
// prettier-ignore
if (!config.timeouts.ERROR_MESSAGE)
	throw new Error("You must provide a valid time string/number for \`timeouts.ERROR_MESSAGE\`. Fix this in '_dT_config.json'");

// prettier-ignore
for (let [key, val] of Object.entries(config.navigator.buttons)) if (!val.TEXT) throw new Error(
	`\`${key}.TEXT\` is an empty value; This is required to be able to use EmbedNavigator. Fix this in \'_dT_config.json\'`
);

module.exports = {
	BetterEmbed,
	EmbedNavigator,

	deleteMessageAfter,
	awaitConfirm,
	dynaSend,

	markdown: {
		ansi,
		link: (label, url, tooltip = "") => `[${label}](${url}${tooltip ? ` "${tooltip}"` : ""})`
	}
};
