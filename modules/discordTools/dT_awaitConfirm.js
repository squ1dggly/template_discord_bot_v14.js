/** @typedef aC_options
 * @property {CommandInteraction} interaction
 * @property {TextChannel } channel
 * @property {import("./dT_betterEmbed").bE_author} author
 * @property {import("./dT_betterEmbed").bE_title} title
 * @property {import("./dT_betterEmbed").bE_thumbnailURL} thumbnailURL
 * @property {import("./dT_betterEmbed").bE_description} description
 * @property {string} imageURL
 * @property {import("./dT_betterEmbed").bE_footer} footer
 * @property {import("./dT_betterEmbed").bE_color} color
 * @property {import("./dT_betterEmbed").bE_timestamp} timestamp
 * @property {boolean} disableFormatting
 *
 * @property {"reply"|"editReply"|"followUp"|"channel"|"replyTo"} sendMethod if `reply` fails, `editReply` will be used | `reply` is default
 * @property {ActionRowBuilder|ActionRowBuilder[]} components
 * @property {boolean} ephemeral
 * @property {import("discord.js/typings").MessageMentionOptions} allowedMentions

 * @property {boolean} deleteAfter delete the message after the `confirm` or `cancel` button is pressed */

const {
    
} = require("discord.js");

/** Send a confirmation message and await the user's response
 * - **`$USER`** :: *author's mention*
 *
 * - **`$USERNAME`** :: *author's display/user name*
 *
 * This function utilizes **BetterEmbed**
 * @param {aC_options} options */
async function awaitConfirm(options) {}
