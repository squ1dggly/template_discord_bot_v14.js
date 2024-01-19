/** @file Import prefix commands from `./prefix_commands` */

const { Client } = require("discord.js");
const logger = require("../logger");
const jt = require("../jsTools");

function importCommands(path, recursive = false) {
	let dirEntries = jt.readDir(path, { recursive });
	let commands = [];

	for (let entry of dirEntries) {
		let _path = `../.${path}/${entry}`;

		// prettier-ignore
		if (entry.endsWith("CMD.js")) try {
            commands.push(require(_path));
        } catch (err) {
            logger.error("Failed to import prefix command", `at: \'${_path}\'`, err);
        }
	}

	return commands;
}

/** @param {Client} client */
module.exports = client => {
	const directoryPath = "./prefix_commands";
	let commands = importCommands(directoryPath, true);

	for (let command of commands) {
		client.prefixCommands.set(command.name, command);

		// prettier-ignore
		if (command?.aliases?.length)
			for (let alias of command.aliases)
				client.prefixCommands.set(alias, command);
	}
};
