/** @file Push, remove, or refresh slash commands to/from/in a guild, and users */

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
const jt = require("./jsTools");

const config = { client: require("../configs/config_client.json") };

const TOKEN = process.env.TOKEN || config.client.TOKEN;
const TOKEN_DEV = process.env.TOKEN_DEV || config.client.TOKEN_DEV;

const DEV_MODE = process.env.DEV_MODE === "true" ? true : false || config.client.DEV_MODE || false;

// Create an instance of the REST api
const rest = new REST().setToken(DEV_MODE ? TOKEN_DEV : TOKEN);

module.exports = {
	/** Push slash commands to one or more guilds
	 * @param {Client} client client
	 * @param {push_options} options push options */
	push: async (client, options = {}) => {
		options = { slashCommands: [], ids: [], global: false, ...options };

		// Import slash commands from the client
		if (!options.slashCommands.length)
			options.slashCommands = [...client.slashCommands.public.values(), ...client.slashCommands.userInstall.values()];
		// Filter out invalid slash commands
		else options.slashCommands = jt.forceArray(options.slashCommands).filter(slsh => slsh);

		// prettier-ignore
		if (!options.slashCommands.length) return logger.error(
			"Failed to register application commands (/)",
			`type: ${options.global ? "global" : "local"}`, "No application commands (/) found"
		);

		/* - - - - - { Register Slash Commands (GLOBAL) } - - - - - */
		if (options.global) {
			logger.log(`registering application commands (/) globally...`);

			// prettier-ignore
			return await rest
				.put(Routes.applicationCommands(client.user.id), { body: options.slashCommands.map(slsh => slsh?.builder || slsh.commandData) })
				.then(() => logger.success("application commands (/) registered (global)"))
				.catch(err => logger.error("Failed to register application commands (/)", "type: global", err));
		}

		/* - - - - - { Register Slash Commands (LOCAL) } - - - - - */
		options.ids = jt.forceArray(options.ids).filter(id => id);

		options.ids ||= (await client.guilds.fetch()).map(({ id }) => id);
		// prettier-ignore
		if (!options.ids.length) return logger.error(
			"Failed to register application commands (/)",
			"type: local", "You must provide at least 1 guild ID"
        );

		// prettier-ignore
		logger.log(`registering application commands (/) for ${options.ids.length} ${options.ids.length === 1 ? "guild" : "guilds"}...`);

		// prettier-ignore
		// Iterate through each guild ID and register slash commands
		return await Promise.all(options.ids.map(id => rest
            .put(Routes.applicationGuildCommands(client.user.id, id), { body: options.slashCommands.map(slsh => slsh?.builder || slsh.commandData) })
            .catch(err => logger.error(`Failed to register application commands (/)", "type: local | guildID: ${id}`, err)
        )))
            .then(sucessful => {
                // Get the number of guilds that were successfully registered
                let sucessful_count = sucessful.filter(s => s).length;
                logger.success(`application commands (/) registered for ${sucessful_count} ${sucessful_count === 1 ? "guild" : "guilds"} (local)`)
            }).catch(err => logger.error("Failed to register application commands (/)", "type: local", err));
	},

	/** Remove slash commands from one or more guilds
	 * @param {Client} client client
	 * @param {remove_options} options remove options */
	remove: async (client, options = {}) => {
		options = { ids: [], global: false, ...options };

		// Remove slash commands (globally)
		if (options.global) {
			logger.log(`removing application commands (/) globally...`);

			return await rest
				.put(Routes.applicationCommands(client.user.id), { body: [] })
				.then(() => logger.success("application commands (/) removed (global)"))
				.catch(err => logger.error("Failed to remove application commands (/)", "type: global", err));
		}

		/// Remove slash commands (locally)
		// If a single string was given for IDs, convert it into an array
		if (!Array.isArray(options.ids)) options.ids = [options.ids];

		options.ids ||= (await client.guilds.fetch()).map(({ id }) => id);
		// prettier-ignore
		if (!options.ids.length) return logger.error(
			"Failed to remove application commands (/)",
			"type: local", "You must provide at least 1 guild ID"
        );

		// prettier-ignore
		logger.log(`removing application commands (/) for ${options.ids.length} ${options.ids.length === 1 ? "guild" : "guilds"}...`);

		// prettier-ignore
		// Iterate through each guild ID and remove slash commands
		return await Promise.all(options.ids.map(id => rest
            .put(Routes.applicationGuildCommands(client.user.id, id), { body: [] })
            .catch(err => logger.error("Failed to remove application commands (/)", `type: local | guildID: ${id}`, err)
        )))
            .then(sucessful => {
                // Get the number of guilds that were successfully registered
                let sucessful_count = sucessful.filter(s => s).length;
                logger.success(`application commands (/) removed for ${sucessful_count} ${sucessful_count === 1 ? "guild" : "guilds"} (local)`)
            }).catch(err => logger.error("Failed to remove application commands (/)", "type: local", err));
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
