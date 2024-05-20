/** @file Initialize the bot and get everything up and functional @author xsqu1znt */

require("dotenv").config();

const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const slashCommandManager = require("./utils/slashCommandManager");
const logger = require("./utils/logger");
const mongo = require("./utils/mongo");
const jt = require("./utils/jsTools");

const config = { client: require("./configs/config_client.json") };

const TOKEN = process.env.TOKEN || config.client.TOKEN;
const TOKEN_DEV = process.env.TOKEN_DEV || config.client.TOKEN_DEV;
const DEV_MODE = process.env.DEV_MODE === "true" ? true : false || config.client.DEV_MODE || false;

/* - - - - - { Check for TOKEN } - - - - - */
if (DEV_MODE && !TOKEN_DEV) return logger.error("TOKEN Missing", "DEV_MODE is enabled, but TOKEN_DEV is not set");
if (!TOKEN && !TOKEN_DEV) return logger.error("TOKEN Missing", "TOKEN is not set");

// prettier-ignore
// Let the user know if the bot's in dev mode
if (DEV_MODE) logger.debug(
	"DEV_MODE is enabled. You can change this by setting DEV_MODE to false in either .env or config_client.json"
);

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
client.slashCommands = {
	all: new Collection(),
	public: new Collection(),
	userInstall: new Collection(),
	staff: new Collection(),
	custom: new Collection()
};

client.prefixCommands = new Collection();

// Run importers
let importers_dir = jt.readDir("./utils/importers").filter(fn => fn.startsWith("import_") && fn.endsWith(".js"));

// prettier-ignore
importers_dir.forEach(fn => {
	try { require(`./utils/importers/${fn}`)(client); }
	catch (err) { logger.error("Importer failed to load", `\'${fn}\' could not initialize`, err); }
});

// Connect the client to discord
logger.log("connecting to Discord...");
// prettier-ignore
client.login(DEV_MODE ? TOKEN_DEV : TOKEN).then(async () => {
	// Register slash commands to a specific server :: { LOCAL }
	// await slashCommandManager.push(client, { ids: "your_server_id" });

	// Register slash commands :: { GLOBAL }
	// await slashCommandManager.push(client, { global: true });

	// Remove commands (does nothing if commands were registered globally) :: { LOCAL }
	// await slashCommandManager.remove(client, { ids: "your_server_id" });

	// Remove commands (does nothing if commands were registered locally) :: { GLOBAL }
	// await slashCommandManager.remove(client, { global: true });

	// await mongo.connect();
});
