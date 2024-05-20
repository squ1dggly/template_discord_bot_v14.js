/** @file Import slash commands from `./slash_commands` */

const { Client } = require("discord.js");
const logger = require("../logger");
const jt = require("../jsTools");

const directoryPath = "./slash_commands";
const recursive = true;

function importCommands() {
	let dirEntries = jt.readDir(directoryPath, { recursive });

	let commands_public = [];
	let commands_userInstall = [];
	let commands_staff = [];
	let commands_custom = [];

	for (let entry of dirEntries) {
		let _path = `../.${directoryPath}/${entry}`;

		// prettier-ignore
		// Slash Commands (Public)
		if (entry.endsWith("SLSH.js")) try {
            commands_public.push(require(_path));
        } catch (err) {
            logger.error("Failed to import slash command (PUBLIC)", `at: \'${_path}\'`, err);
		}

		// prettier-ignore
		// Slash Commands (User Install)
		if (entry.endsWith("SLSH_UI.js")) try {
            commands_userInstall.push(require(_path));
        } catch (err) {
            logger.error("Failed to import slash command (USER_INSTALL)", `at: \'${_path}\'`, err);
		}

		// prettier-ignore
		// Slash Commands (Staff) (staff server only commands)
		if (entry.endsWith("SLSH_STAFF.js")) try {
            commands_staff.push(require(_path));
        } catch (err) {
            logger.error("Failed to import slash command (STAFF)", `at: \'${_path}\'`, err);
		}

		// prettier-ignore
		// Slash Commands (Special) (custom server only commands)
		if (entry.endsWith("SLSH_CUS.js")) try {
            commands_custom.push(require(_path));
        } catch (err) {
            logger.error("Failed to import slash command (CUSTOM)", `at: \'${_path}\'`, err);
		}
	}

	return {
		public: commands_public,
		userInstall: commands_userInstall,
		staff: commands_staff,
		custom: commands_custom
	};
}

/** @param {Client} client */
module.exports = client => {
	let slashCommands = importCommands();

	// prettier-ignore
	// Slash Commands (Public)
	for (let command of slashCommands.public) {
		client.slashCommands.public.set(command.builder.name, command);
		client.slashCommands.all.set(command.builder.name, command)
	}

	// prettier-ignore
	// Slash Commands (User Install)
	for (let command of slashCommands.userInstall) {
		client.slashCommands.userInstall.set(command.commandData.name, command);
		client.slashCommands.all.set(command.commandData.name, command)
	}

	// prettier-ignore
	// Slash Commands (Staff) (staff server only commands)
	for (let command of slashCommands.staff) {
		client.slashCommands.staff.set(command.builder.name, command);
		client.slashCommands.all.set(command.builder.name, command)
	}

	// prettier-ignore
	// Slash Commands (Special) (custom server only commands)
	for (let command of slashCommands.custom) {
		client.slashCommands.custom.set(command.builder.name, command);
		client.slashCommands.all.set(command.builder.name, command)
	}
};
