// Executes commands requested by a command interaction.

const { Client, BaseInteraction, PermissionsBitField } = require('discord.js');

const { ownerID, adminIDs } = require('../../../configs/clientSettings.json');
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
            // Check if the command is only available to the owner and bot admins
            if (slashCommand.ownerOnly && ![ownerID, ...adminIDs].includes(args.interaction.user.id))
                return await args.interaction.reply({ content: "You are not allowed to use this command!", ephemeral: true });

            // Check if the command requires the user to have admin in the guild
            if (slashCommand.requireGuildAdmin) {
                let userHasAdmin = args.interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

                if (![ownerID, ...adminIDs].includes(args.interaction.user.id) && !userHasAdmin)
                    return await args.interaction.reply({ content: "You need admin to use this command!", ephemeral: true });
            }

            // Execute the command function
            return await slashCommand.execute(client, args.interaction);
        } catch (err) {
            // Log the error
            return logger.error("Failed to execute slash command", `\"${args.interaction.commandName}\"`, err);
        }
    }
};