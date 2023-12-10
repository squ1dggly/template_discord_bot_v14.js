/** @file Import slash commands from `./slash_commands` @author xsqu1znt */

const { Client } = require("discord.js");
const logger = require("../logger");
const jt = require("../jsTools");

const config = { client: require("../../configs/config_client.json") };
const hostMode = config.client.MODE === "HOST" ? true : false;

function importCommands(path, recursive = false) {
	let dirEntries = jt.readDir(path, { recursive });
	let commands = [];

	for (let entry of dirEntries) {
		let _path = hostMode ? `${path}/${entry}` : `../.${path}/${entry}`;

		// prettier-ignore
		if (entry.endsWith("SLSH.js")) try {
            commands.push(require(_path));
        } catch (err) {
            logger.error("Failed to import slash command", `at: \'${_path}\'`, err);
        }
	}

	return commands;
}

module.exports = {
	/** @param {Client} client */
	init: client => {
		let _path = hostMode ? "../../slash_commands" : "./slash_commands";
		let commands = importCommands(_path, false);

		// prettier-ignore
		for (let command of commands)
			client.slashCommands.set(command.builder.name, command);
	}
};
