// Initializes the bot and gets everything up and running.

require('dotenv').config();
const fs = require('fs');

const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const slashCommandManager = require('./modules/slashCommandManager');
const logger = require('./modules/logger');

logger.log("initializing...");

const client = new Client({
    intents: [
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ],

    partials: [Partials.Channel] // Allows the bot to read its own DMs
});

// Collections that hold valuable information for the client
client.slashCommands = new Collection();

// Run importers
let importers_dir = fs.readdirSync('./modules/importers').filter(fn => fn.startsWith('import_') && fn.endsWith('.js'));
importers_dir.forEach(fn => {
    try { require(`./modules/importers/${fn}`).init(client); }
    catch (err) { logger.error("Importer failed to load", `${fn} is not a valid importer`, err); }
});

// Connect the client to discord
logger.log("connecting to Discord...");
client.login(process.env.TOKEN).then(async () => {
    // await slashCommandManager.push(client);
    // await slashCommandManager.remove(client);
    // await slashCommandManager.refresh(client);
});

// Export the client
module.exports = client;