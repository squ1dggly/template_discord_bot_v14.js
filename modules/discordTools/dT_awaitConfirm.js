/** @typedef aC_options
 * @property {CommandInteraction} interaction
 * @property {TextChannel } channel
 * @property {Message} message
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
 * @property {ActionRowBuilder|ActionRowBuilder[]} components
 * @property {import("discord.js/typings").MessageMentionOptions} allowedMentions
 * @property {"reply"|"editReply"|"followUp"|"channel"|"replyTo"} sendMethod if `reply` fails, `editReply` will be used | `reply` is default
 * @property {boolean} ephemeral

 * @property {boolean} deleteAfter delete the message after the `confirm` or `cancel` button is pressed
 * @property {string|number} timeout */

// prettier-ignore
const {
    CommandInteraction, TextChannel, Message,
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType
} = require("discord.js");

const BetterEmbed = require("./dT_betterEmbed");
const logger = require("../logger");
const jt = require("../jsTools");

const config = require("./dT_config.json");

/** Send a confirmation message and await the user's response
 * - **`$USER`** :: *author's mention*
 *
 * - **`$USERNAME`** :: *author's display/user name*
 *
 * This function utilizes **BetterEmbed**
 * @param {aC_options} options */
async function awaitConfirm(options) {
	options = {
		interaction: null,
		channel: null,
		author: { user: null, text: null, iconURL: null, linkURL: null },
		title: { text: null, linkURL: null },
		thumbnailURL: null,
		description: null,
		imageURL: null,
		footer: { text: null, iconURL: null },
		color: config.EMBED_COLOR || null,
		timestamp: null,
		disableFormatting: false,

		components: [],
		allowedMentions: {},
		sendMethod: "reply",
		ephemeral: false,

		deleteAfter: false,
		timeout: jt.parseTime(config.timeouts.CONFIRMATION),
		...options
	};

	/* - - - - - { Parse Options } - - - - - */
	options.timeout = jt.parseTime(options.timeout);

	/* - - - - - { Error Checking } - - - - - */
	if (!options.interaction && !options.channel) throw new Error("You must provide either a CommandInteraction or Channel");

	if (options.sendMethod === ("reply" || "editReply" || "followUp") && options.channel)
		throw new Error("The chosen sendMethod cannot be used when a Channel is provided");

	if (options.sendMethod === "replyTo" && options.interaction)
		throw new Error('You must provide a Message to use the "replyTo" send method');

	if (options.sendMethod === ("replyTo" || "channel") && options.ephemeral)
		logger.debug("Ephemeral cannot be used with the chosen sendMethod");

	if (options.timeout > 1000) logger.debug("dT_awaitConfirm timeout is less than 1 second; Is this intentional?");
}
