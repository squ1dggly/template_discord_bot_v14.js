// Imports all slash commands found in ('../../slash_commands').

const { readdirSync } = require('fs');

const { Client } = require('discord.js');
const logger = require('../logger');

function importSlashCommands(dir) {
    let slash_commands = [];
    let files = readdirSync(`.${dir}`);

    for (let entry of files) if (entry.endsWith('.js')) {
        try {
            slash_commands.push(require(`${dir}/${entry}`));
        } catch (err) {
            logger.error("Failed to import slash command", `at: \'${join(dir, entry)}\'`, err);
        }
    } else { // In the case of a folder within the root slash command directory
        let _nested = readdirSync(`.${dir}/${entry}`).filter(file_name => file_name.endsWith('.js'));

        for (let file_name of _nested) try {
            slash_commands.push(require(`${dir}/${entry}/${file_name}`));
        } catch (err) {
            logger.error("Failed to import slash command", `at: \'${`${dir}/${entry}/${file_name}`}\'`, err);
        }
    }

    return slash_commands;
}

module.exports = {
    /**
     * @param {Client} client 
     */
    init: (client) => {
        let slash_commands = importSlashCommands('../../slash_commands');

        for (let slash_command of slash_commands)
            client.slashCommands.set(slash_command.builder.name, slash_command);
    }
};