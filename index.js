/** @file Initialize the bot and get everything up and functional @author xsqu1znt */

require("dotenv").config();

const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const slashCommandManager = require("./modules/slashCommandManager");
const logger = require("./modules/logger");
const mongo = require("./modules/mongo");
const jt = require("./modules/jsTools");

const config = { client: require("./configs/config_client.json") };

const TOKEN = process.env.TOKEN || config.client.TOKEN;
const TOKEN_DEV = process.env.TOKEN_DEV || config.client.TOKEN_DEV;

const MONGO_URI = process.env.MONGO_URI || config.client.MONGO_URI;
const MONGO_URI_DEV = process.env.MONGO_URI_DEV || config.client.MONGO_URI_DEV;

const DEVMODE = process.env.MODE || config.client.MODE === "DEV";

logger.log("initializing...");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildPresences, // Requires Presence intent in the dev portal
		GatewayIntentBits.MessageContent, // Requires Message Content intent in the dev portal
		GatewayIntentBits.DirectMessageReactions, // Allows bot to see reactions in DMs
		GatewayIntentBits.DirectMessages // Allows bot to read DMs
	],

	partials: [Partials.Channel] // Allows bot to use non-guild channels
});

/// Collections that hold valuable information for the client
client.slashCommands = new Collection();
client.prefixCommands = new Collection();

// Run importers
let importers_dir = jt.readDir("./modules/importers").filter(fn => fn.startsWith("import_") && fn.endsWith(".js"));

// prettier-ignore
importers_dir.forEach(fn => {
	try { require(`./modules/importers/${fn}`).init(client); }
	catch (err) { logger.error("Importer failed to load", `\"${fn}\" could not initialize`, err); }
});

// Connect the client to discord
logger.log("connecting to Discord...");
// prettier-ignore
client.login(DEVMODE ? TOKEN_DEV : TOKEN).then(async () => {
	// Register slash commands to a specific server :: { LOCAL }
	// await slashCommandManager.push(client, { ids: "your_server_id" });

	// Register slash commands :: { GLOBAL }
	// await slashCommandManager.push(client, { global: true });

	// Remove commands (does nothing if commands were registered globally) :: { LOCAL }
	// await slashCommandManager.remove(client, { ids: "your_server_id" });

	// Remove commands (does nothing if commands were registered locally) :: { GLOBAL }
	// await slashCommandManager.remove(client, { global: true });

	// await mongo.connect(DEVMODE ? MONGO_URI_DEV : MONGO_URI);
});
