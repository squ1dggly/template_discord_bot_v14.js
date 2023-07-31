/** Push, remove, or refresh slash commands to/from/in a guild. */

/** @typedef push_options
 * @property {SlashCommandBuilder|SlashCommandBuilder[]} slashCommands specific slash commands to push
 * @property {string|string[]} ids id of every guild you want to edit
 * @property {boolean} global if the commands are global, otherwise locally per guild */

/** @typedef remove_options
 * @property {string|string[]} ids id of every guild you want to edit
 * @property {boolean} global if the commands are global, otherwise locally per guild */

/** @typedef refresh_options
 * @property {SlashCommandBuilder|SlashCommandBuilder[]} slashCommands specific slash commands to push
 * @property {string|string[]} ids id of every guild you want to edit
 * @property {boolean} global if the commands are global, otherwise locally per guild */

const { Client, SlashCommandBuilder, REST, Routes } = require("discord.js");
const logger = require("./logger");

const TOKEN = process.env.TOKEN || require("../configs/config_client").TOKEN;

// Create an instance of the REST api
const rest = new REST().setToken(TOKEN);

module.exports = {
	/** Push slash commands to one or more guilds
	 * @param {Client} client client
	 * @param {push_options} options push options */
	push: async (client, options = {}) => {
		options = { slashCommands: [], ids: [], global: false, ...options };

		// Get the slash commands from the client
		if (!options.slashCommands.length)
			options.slashCommands = [...client.slashCommands.values()].map(slsh => slsh.builder);
		// prettier-ignore
		if (!options.slashCommands.length) return logger.error(
			"Failed to register slash commands",
			`type: ${options.global ? "global" : "local"}`, "No slash commands found"
		);

		// Register slash commands (globally)
		if (options.global) {
			logger.log(`registering slash commands globally...`);

			return await rest
				.put(Routes.applicationCommands(client.user.id), { body: options.slashCommands })
				.then(() => logger.success("slash commands registered (global)"))
				.catch(err => logger.error("Failed to register slash commands", "type: global", err));
		}

		/// Register slash commands (locally)
		// If a single string was given for IDs, convert it into an array
		if (!Array.isArray(options.ids)) options.ids = [options.ids];

		options.ids ||= (await client.guilds.fetch()).map(({ id }) => id);
		// prettier-ignore
		if (!options.ids.length) return logger.error(
			"Failed to register slash commands",
			"type: local", "You must provide at least 1 guild ID"
        );

		// prettier-ignore
		logger.log(`registering slash commands for ${options.ids.length} ${options.ids.length === 1 ? "guilds" : "guild"}...`);

		// prettier-ignore
		// Iterate through each guild ID and register slash commands
		return await Promise.all(options.ids.map(id => rest
            .put(Routes.applicationGuildCommands(client.user.id, id), { body: options.slashCommands })
            .catch(err => logger.error(`Failed to register slash commands", "type: local | guildID: ${id}`, err)
        )))
            .then(sucessful => {
                // Get the number of guilds that were successfully registered
                let sucessful_count = sucessful.filter(s => s).length;
                logger.success(`slash commands registered for ${sucessful_count} ${sucessful_count === 1 ? "guilds" : "guild"} (local)`)
            }).catch(err => logger.error("Failed to register slash commands", "type: local", err));
	},

	/** Remove slash commands from one or more guilds
	 * @param {Client} client client
	 * @param {remove_options} options remove options */
	remove: async (client, options = {}) => {
		options = { ids: [], global: false, ...options };

		// Remove slash commands (globally)
		if (options.global) {
			logger.log(`removing slash commands globally...`);

			return await rest
				.put(Routes.applicationCommands(client.user.id), { body: [] })
				.then(() => logger.success("slash commands removed (global)"))
				.catch(err => logger.error("Failed to remove slash commands", "type: global", err));
		}

		/// Remove slash commands (locally)
		// If a single string was given for IDs, convert it into an array
		if (!Array.isArray(options.ids)) options.ids = [options.ids];

		options.ids ||= (await client.guilds.fetch()).map(({ id }) => id);
		// prettier-ignore
		if (!options.ids.length) return logger.error(
			"Failed to remove slash commands",
			"type: local", "You must provide at least 1 guild ID"
        );

		// prettier-ignore
		logger.log(`removing slash commands for ${options.ids.length} ${options.ids.length === 1 ? "guilds" : "guild"}...`);

		// prettier-ignore
		// Iterate through each guild ID and remove slash commands
		return await Promise.all(options.ids.map(id => rest
            .put(Routes.applicationGuildCommands(client.user.id, id), { body: [] })
            .catch(err => logger.error(`Failed to remove slash commands", "type: local | guildID: ${id}`, err)
        )))
            .then(sucessful => {
                // Get the number of guilds that were successfully registered
                let sucessful_count = sucessful.filter(s => s).length;
                logger.success(`slash commands registered for ${sucessful_count} ${sucessful_count === 1 ? "guilds" : "guild"} (local)`)
            }).catch(err => logger.error("Failed to remove slash commands", "type: local", err));
	},

	/** Refresh slash commands in one or more guilds
	 * @param {Client} client client
	 * @param {refresh_options} options refresh options */
	refresh: async (client, options = {}) => {
		options = { ids: [], global: false, ...options };
		await this.remove(client, options);
		await this.push(client, options);
	}
};
