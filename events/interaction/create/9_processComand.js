// Executes commands requested by a command interaction.

const { Client, BaseInteraction } = require('discord.js');
const logger = require('../../../modules/logger');

module.exports = {
    name: "process_slashCommand",
    event: "interaction_create",

    /**
     * @param {Client} client 
     * @param {{ interaction: BaseInteraction }} args
     */
    execute: async (client, args) => {
        // Filter out non-guild and non-command interactions
        if (!args.interaction.guild || !args.interaction.isCommand()) return;

        // Get the slash command function from the client if it exists
        let slashCommand = client.slashCommands.get(args.interaction.commandName) || null;

        // Try to execute the slash command function
        if (slashCommand) try {
            // Execute the command function
            return await slashCommand.execute(client, args.interaction);
        } catch (err) {
            // Log the error
            return logger.error("Failed to execute slash command", `\"${args.interaction.commandName}\"`, err);
        }
    }
};