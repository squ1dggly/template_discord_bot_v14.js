// Push, remove, or refresh all slash commands in a Guild.

const { Client, REST, Routes } = require('discord.js');
const logger = require('./logger');

// Create an instance of the REST api
const rest = new REST().setToken(process.env.TOKEN);

module.exports = {
    /** Push slash commands to one or more guilds.
     * @param {Client} client The client.
     * @param {Array<string> | string} guildIDs The IDs of the Guilds you wish to push to.
     * @param {boolean} global Whether to push the slash commands globally. False is locally per server.
     */
    push: async (client, guildIDs, global = false) => {
        let slash_commands = [...client.slashCommands.values()].map(slsh => slsh.builder);

        // Push slash commands globally
        if (global) try {
            // Log what's currently happening
            logger.log(`pushing slash commands for (${guildIDs.length}) ${guildIDs.length > 1 ? "guilds" : "guild"}`);

            await rest.put(Routes.applicationCommands(client.user.id), { body: slash_commands });

            // Log success
            return logger.success("slash commands pushed successfully (global)");
        } catch (err) {
            return logger.error("Failed to push slash commands", "global", err);
        }

        // If a single string was given for the guildIDs parameter, convert it into an array
        if (!Array.isArray(guildIDs)) guildIDs = [guildIDs];

        // Push slash commands locally (per server)
        try {
            let promiseArray = [];

            //* Iterate through each guildID and push the slash commands
            if (guildIDs.length > 0) {
                // Log what's currently happening
                logger.log(`pushing slash commands for (${guildIDs.length}) ${guildIDs.length > 1 ? "guilds" : "guild"}`);

                // Iterate through each guildID
                guildIDs.forEach(guildID => {
                    let res = rest.put(Routes.applicationGuildCommands(client.user.id, guildID), { body: slash_commands });
                    promiseArray.push(res);
                });

                // Wait for REST to finish each request
                await Promise.all(promiseArray);

                // Log success
                return logger.success("slash commands registered successfully");
            } else { //* Iterate through every guild the bot is currently in and push the slash commands
                // Fetch each guild the bot's currently in
                let guilds = await client.guilds.fetch();

                // Log what's currently happening
                logger.log(`pushing slash commands for (${guilds.length}) ${guilds.length > 1 ? "guilds" : "guild"}`);

                // Iterate through each guild
                guilds.forEach(guild => {
                    let res = rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: slash_commands });
                    promiseArray.push(res);
                });

                // Wait for REST to finish each request
                await Promise.all(promiseArray);

                // Log success
                return logger.success("slash commands pushed successfully");
            }
        } catch (err) {
            return logger.error("Failed to push slash commands", "local (per server)", err);
        }
    },

    /** Remove slash commands from one or more guilds.
     * @param {Client} client The client.
     * @param {Array<string> | string} guildIDs The IDs of the Guilds you wish to delete from.
     * @param {boolean} global Whether to remove the slash commands globally. False is locally per server.
     */
    remove: async (client, guildIDs, global = false) => {
        // Remove slash commands globally
        if (global) try {
            // Log what's currently happening
            logger.log(`removing slash commands from (${guildIDs.length}) ${guildIDs.length > 1 ? "guilds" : "guild"}`);

            await rest.put(Routes.applicationCommands(client.user.id), { body: [] });

            // Log success
            return logger.success("slash commands removed successfully (global)");
        } catch (err) {
            return logger.error("Failed to remove slash commands", "global", err);
        }

        // Push slash commands locally (per server)
        try {
            let promiseArray = [];

            //* Iterate through each guildID and push the slash commands
            if (guildIDs.length > 0) {
                // Log what's currently happening
                logger.log(`removing slash commands from (${guildIDs.length}) ${guildIDs.length > 1 ? "guilds" : "guild"}`);

                // Iterate through each guildID
                guildIDs.forEach(guildID => {
                    let res = rest.put(Routes.applicationGuildCommands(client.user.id, guildID), { body: [] });
                    promiseArray.push(res);
                });

                // Wait for REST to finish each request
                await Promise.all(promiseArray);

                // Log success
                return logger.success("slash commands removed successfully");
            } else { //* Iterate through every guild the bot is currently in and push the slash commands
                // Fetch each guild the bot's currently in
                let guilds = await client.guilds.fetch();

                // Log what's currently happening
                logger.log(`removing slash commands for (${guilds.length}) ${guilds.length > 1 ? "guilds" : "guild"}`);

                // Iterate through each guild
                guilds.forEach(guild => {
                    let res = rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: [] });
                    promiseArray.push(res);
                });

                // Wait for REST to finish each request
                await Promise.all(promiseArray);

                // Log success
                return logger.success("slash commands removed successfully");
            }
        } catch (err) {
            return logger.error("Failed to remove slash commands", "local (per server)", err);
        }
    },

    /** Refresh slash commands for one or more guilds.
     * @param {Client} client The client.
     * @param {Array<string> | string} guildIDs The IDs of the Guilds you wish to refresh.
     * @param {boolean} global Whether to refresh the slash commands globally. False is locally per server.
     */
    refresh: async (client, guildIDs, global = false) => {
        await this.remove(client, guildIDs, global);
        await this.push(client, guildIDs, global);
    }
};