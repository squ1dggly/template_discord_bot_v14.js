// Initializes the bot and gets everything up and running.

require("dotenv").config();
const fs = require("fs");

const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const slashCommandManager = require("./modules/slashCommandManager");
const logger = require("./modules/logger");
const mongo = require("./modules/mongo");

const TOKEN = process.env.TOKEN || require("./configs/clientSettings.json").TOKEN;

logger.log("initializing...");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent
	],

	partials: [Partials.Channel] // Allows the bot to read its own DMs
});

// Collections that hold valuable information for the client
client.slashCommands = new Collection();

// Run importers
let importers_dir = fs
	.readdirSync("./modules/importers")
	.filter(fn => fn.startsWith("import_") && fn.endsWith(".js"));

importers_dir.forEach(fn => {
	try {
		require(`./modules/importers/${fn}`).init(client);
	} catch (err) {
		logger.error("Importer failed to load", `\"${fn}\" is not a valid importer`, err);
	}
});

// Connect the client to discord
logger.log("connecting to Discord...");
client.login(TOKEN).then(async () => {
	// await mongo.connect();

	// Push all commands to a specific server (this is local) - use this to refresh local commands
	await slashCommandManager.push(client, "your_server_id");

	// Push all commands excluding admin (this is global) - use this to refresh global commands
	// await slashCommandManager.push(client, null, true);

	// Remove all commands (this is local | does not work if using global commands) (this is local)
	// await slashCommandManager.remove(client, "your_server_id");

	// Remove all commands (this is global | does not work if using local commands) (this is global)
	// await slashCommandManager.remove(client, null, true);
});
