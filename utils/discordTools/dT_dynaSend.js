/** @typedef {"reply"|"editReply"|"followUp"|"sendToChannel"|"messageReply"|"messageEdit"} SendMethod */

/** @typedef dS_options
 * @property {CommandInteraction} interaction Used for the "reply", "editReply", and "followUp" `SendMethod`.
 * @property {TextChannel} channel Used for the "sendToChannel" `SendMethod`.
 * @property {Message} message Used for the "messageReply", and "messageEdit" `SendMethod`.
 * @property {string} content The text content to send in the message.
 * @property {EmbedBuilder|BetterEmbed|Array<EmbedBuilder|BetterEmbed>} embeds One or more `Embeds` to send.
 * @property {ActionRowBuilder|ActionRowBuilder[]} components The components to add in the message.
 * @property {import("discord.js").MessageMentionOptions} allowedMentions The allowed mentions of the message.
 * @property {SendMethod} sendMethod The method to send the message.
 *
 * Default is "reply". If "reply" fails, "editReply" is used.
 * @property {boolean} ephemeral If the message should be ephemeral. This only works for the "reply" `SendMethod`.
 * @property {number|string} deleteAfter The amount of time to wait in **MILLISECONDS** before deleting the message.
 *
 * This utilizes `jsTools.parseTime()`, letting you also use "10s", "1m", or "1m 30s" for example.
 * @property {boolean} fetchReply Whether to return the `Message` object after sending. `true` by default. */

const { CommandInteraction, TextChannel, Message, EmbedBuilder, ActionRowBuilder } = require("discord.js");
const deleteMessageAfter = require("./dT_deleteMessageAfter");
const BetterEmbed = require("./dT_betterEmbed");
const logger = require("../logger");
const jt = require("../jsTools");

/** @param {dS_options} options */
async function dynaSend(options) {
	options = {
		interaction: null,
		channel: null,
		message: null,
		content: undefined,
		embeds: [],
		components: [],
		allowedMentions: {},
		sendMethod: "reply",
		ephemeral: false,
		deleteAfter: null,
		fetchReply: true,
		...options
	};

	/* - - - - - { Parse Options } - - - - - */
	// prettier-ignore
	options.embeds = options.embeds?.length || options.embeds ? jt.forceArray(options.embeds).filter(c => c) : [];

	// prettier-ignore
	options.components = options.components?.length || options.components ? jt.forceArray(options.components).filter(c => c) : [];

	options.deleteAfter = jt?.parseTime ? jt.parseTime(options.deleteAfter) : options.deleteAfter;

	/* - - - - - { Error Checking } - - - - - */
	if (!options.interaction && !options.channel && !options.message)
		throw new Error("[DynaSend]: You must provide either a CommandInteraction, Channel, or Message");

	if (options.deleteAfter && isNaN(options.deleteAfter))
		throw new Error("[DynaSend]: You must provide a valid time string, or milliseconds for 'deleteAfter'");

	if (["messageEdit", "messageReply"].includes(options.sendMethod) && !options.message)
		throw new Error("[DynaSend]: You must provide a Message to use the 'messageEdit' or 'messageReply' SendMethod");

	if (["reply", "followUp"].includes(options.sendMethod) && options.ephemeral)
		logger.debug("[DynaSend]: Ephemeral can only be used with interaction based SendMethods (excluding 'editReply')");

	if (options.deleteAfter && options.deleteAfter < 1000)
		logger.debug("[DynaSend]: deleteAfter is less than 1 second; Is this intentional?");

	// prettier-ignore
	// Interaction based SendMethod fallback
	if (options.sendMethod === "reply" && options.interaction && (options.interaction.replied || options.interaction.deferred))
        options.sendMethod = "editReply";

	/* - - - - - { Send the Message } - - - - - */
	/** @type {Message|null} */
	let message = null;

	// Create the send data
	let sendData = {
		content: options.content,
		components: options.components,
		embeds: options.embeds,
		// Add allowedMentions, if applicable
		...(Object.keys(options.allowedMentions).length ? { allowedMentions: options.allowedMentions } : {}),
		// Add ephemeral, if applicable
		...(["reply", "followUp"].includes(options.sendMethod) ? { ephemeral: options.ephemeral } : {}),
		fetchReply: options.fetchReply
	};

	switch (options.sendMethod) {
		case "reply":
			message = await options.interaction.reply(sendData).catch(err => {
				logger.error(
					"[DynaSend]: Failed to send message",
					`REPLY_TO_INTERACTION | SendMethod: '${options.sendMethod}'`,
					err
				);
				return null;
			});

			break;

		case "editReply":
			message = await options.interaction.editReply(sendData).catch(err => {
				logger.error(
					"[DynaSend]: Failed to edit message",
					`EDIT_INTERACTION | SendMethod: '${options.sendMethod}'`,
					err
				);
				return null;
			});

			break;

		case "followUp":
			message = await options.interaction.followUp(sendData).catch(err => {
				logger.error(
					"[DynaSend]: Failed to send message",
					`FOLLOW_UP_INTERACTION | SendMethod: '${options.sendMethod}'`,
					err
				);
				return null;
			});

			break;

		case "sendToChannel":
			message = await options.channel.send(sendData).catch(err => {
				logger.error(
					"[DynaSend]: Failed to send message",
					`SEND_TO_CHANNEL | SendMethod: '${options.sendMethod}'`,
					err
				);
				return null;
			});

			break;

		case "messageEdit":
			// Check if the message can be edited
			if (!options?.message?.editable) {
				logger.debug("The provided message could not be edited");
				break;
			}

			message = await options.message.edit(sendData).catch(err => {
				logger.error(
					"[DynaSend]: Failed to edit message",
					`EDIT_MESSAGE | SendMethod: '${options.sendMethod}'`,
					err
				);
				return null;
			});

			break;

		case "messageReply":
			message = await options.message.reply(sendData).catch(err => {
				logger.error(
					"[DynaSend]: Failed to send message",
					`REPLY_TO_MESSAGE | SendMethod: '${options.sendMethod}'`,
					err
				);
				return null;
			});

			break;
	}

	// prettier-ignore
	// Delete the message after the given delay
	if (message && message.deletable && options.deleteAfter)
        deleteMessageAfter(message, options.deleteAfter);

	return message;
}

module.exports = dynaSend;
