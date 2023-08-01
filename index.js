/* Initializes the bot and gets everything up and running. */

require("dotenv").config();
const fs = require("fs");

const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const slashCommandManager = require("./modules/slashCommandManager");
const mongo = require("./modules/mongo/index");
const logger = require("./modules/logger");

const TOKEN = process.env.TOKEN || require("./configs/config_client.json").TOKEN;

logger.log("initializing...");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.DirectMessageReactions, // Allows bot to see reactions in DMs
		GatewayIntentBits.DirectMessages // Allows bot to read DMs
	]

	// partials: [Partials.Channel] // Allows bot to use non-guild channels
});

// Collections that hold valuable information for the client
client.slashCommands = new Collection();

// Run importers
let importers_dir = fs.readdirSync("./modules/importers").filter(fn => fn.startsWith("import_") && fn.endsWith(".js"));

// prettier-ignore
importers_dir.forEach(fn => {
	try { require(`./modules/importers/${fn}`).init(client); }
	catch (err) { logger.error("Importer failed to load", `\"${fn}\" could not initialize`, err); }
});

// Connect the client to discord
logger.log("connecting to Discord...");
// prettier-ignore
client.login(TOKEN).then(async () => {
	// await mongo.connect();

	// Register slash commands to a specific server :: { LOCAL }
	// await slashCommandManager.push(client, { ids: "your_server_id" });

	// Register slash commands :: { GLOBAL }
	// await slashCommandManager.push(client, { global: true });

	// Remove commands (does nothing if commands were registered globally) :: { LOCAL }
	// await slashCommandManager.remove(client, { ids: "your_server_id" });

	// Remove commands (does nothing if commands were registered locally) :: { GLOBAL }
	// await slashCommandManager.remove(client, { global: true });
});
