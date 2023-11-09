/** @file Import prefix commands from `./prefix_commands` @author xsqu1znt */

const { Client } = require("discord.js");
const logger = require("../logger");
const jsT = require("../jsTools");

const config = { client: require("../../configs/config_client.json") };
const hostMode = config.client.MODE === "HOST" ? true : false;

function importCommands(path, recursive = false) {
	let dirEntries = jsT.readDir(path, { recursive });
	let commands = [];

	for (let entry of dirEntries) {
		let _path = hostMode ? `../.${path}/${entry}` : `${path}/${entry}`;

		// prettier-ignore
		if (entry.endsWith("CMD.js")) try {
            commands.push(require(_path));
        } catch (err) {
            logger.error("Failed to import prefix command", `at: \'${_path}\'`, err);
        }
	}

	return commands;
}

module.exports = {
	/** @param {Client} client */
	init: client => {
		let _path = hostMode ? "./prefix_commands" : "../../prefix_commands";
		let commands = importCommands(_path, false);

		// prettier-ignore
		for (let command of commands)
			client.prefixCommands.set(command.name, command);
	}
};
