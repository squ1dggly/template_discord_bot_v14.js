/** @file Import slash commands from `./slash_commands` */

const { Client } = require("discord.js");
const logger = require("../logger");
const jt = require("../jsTools");

function importCommands(path, recursive = false) {
	let dirEntries = jt.readDir(path, { recursive });
	let commands = [];

	for (let entry of dirEntries) {
		let _path = `../.${path}/${entry}`;

		// prettier-ignore
		if (entry.endsWith("SLSH.js")) try {
            commands.push(require(_path));
        } catch (err) {
            logger.error("Failed to import slash command", `at: \'${_path}\'`, err);
        }
	}

	return commands;
}

/** @param {Client} client */
module.exports = client => {
	const directoryPath = "./slash_commands";
	let commands = importCommands(directoryPath, true);

	// prettier-ignore
	for (let command of commands)
		client.slashCommands.set(command.builder.name, command);
};
