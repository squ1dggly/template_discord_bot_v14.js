// Imports our event scripts and binds them to their intended event triggers.

const fs = require('fs');
const { join } = require('path');

const client = require('../../index');
const logger = require('../logger');
// const mongo = require('../mongo');

module.exports = {
    /**
     * @param {client} client 
     */
    init: (client) => {
        let events = {
            ready: importEvents('../../events/ready'),

            guild: {
                // create: importEventFunctions('../../events/guild_create'),
                // delete: importEventFunctions('../../events/guild_delete'),

                /* member: {
                    add: importEventFunctions('../../events/guild_member_add')
                } */
            },

            message: {
                // create: importEventFunctions('../../events/message_create'),
                // update: importEventFunctions('../../events/message_update'),
                // delete: importEventFunctions('../../events/message_delete')
            },

            interaction: {
                create: importEvents('../../events/interaction_create')
            }
        }

        // Bind the functions
        // * Ready
        client.on("ready", async () => {
            events.ready.forEach(foo => executeEvent(foo, client));
        });

        // * Guild
        // Guild -> Create
        /* client.on("guildCreate", async (guild) => {
            let args = { guild };
            events.guild.create.forEach(foo => executeEvent(foo, client, args));
        }); */

        // Guild -> Delete
        /* client.on("guildCreate", async (guild) => {
            let args = { guild };
            events.guild.create.forEach(foo => executeEvent(foo, client, args));
        }); */

        // Guild -> Member -> Add
        /* client.on("guildMemberAdd", async (guildMember) => {
            let args = { guildMember };
            events.guild.member.add.forEach(foo => executeEvent(foo, client, args));
        }); */

        // * Message
        // Message -> Create
        /* client.on("messageCreate", async (message) => {
            let args = { message };
            events.message.create.forEach(foo => executeEvent(foo, client, args));
        }); */

        // Message -> Update
        /* client.on("messageUpdate", async (before, after) => {
            let args = { message: { before, after };
            events.message.update.forEach(foo => executeEvent(foo, client, args }));
        }); */

        // Message -> Delete
        /* client.on("messageDelete", async (message) => {
            let args = { message };
            events.message.delete.forEach(foo => executeEvent(foo, client, args));
        }); */

        // * Interaction
        // Interaction -> Create
        client.on("interactionCreate", async (interaction) => {
            let args = { interaction };
            events.interaction.create.forEach(foo => executeEvent(foo, client, args));
        });
    }
};

// ! Helper Functions
function importEvents(dir) {
    let files = fs.readdirSync(dir.substring(1)).filter(fn => fn.endsWith('.js'));
    let funcs = [];

    files.forEach(fn => funcs.push(require(join(dir, fn))));
    return funcs;
}

function executeEvent(foo, ...args ) {
    try {
        foo.execute.apply(null, args);
    } catch (err) {
        logger.error("Failed to execute event function", `\"${foo.name}\" on event \"${foo.event}\"`, err);
    }
}