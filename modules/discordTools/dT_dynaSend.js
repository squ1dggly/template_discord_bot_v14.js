/** @typedef {"reply"|"editReply"|"followUp"|"channel"|"edit"|"replyTo"} SendMethod */

/** @typedef dS_options
 * @property {CommandInteraction} interaction
 * @property {TextChannel} channel
 * @property {Message} message
 * @property {string} messageContent
 * @property {EmbedBuilder|BetterEmbed|Array<EmbedBuilder|BetterEmbed>} embeds
 * @property {ActionRowBuilder|ActionRowBuilder[]} components
 * @property {import("discord.js").MessageMentionOptions} allowedMentions
 * @property {SendMethod} sendMethod if `reply` fails, `editReply` will be used **|** `reply` is default
 * @property {boolean} ephemeral
 * @property {number|string} deleteAfter amount of time to wait in milliseconds */

const { CommandInteraction, TextChannel, Message, ActionRowBuilder, EmbedBuilder } = require("discord.js");

const deleteMessageAfter = require("./dT_deleteMessageAfter");
const BetterEmbed = require("./dT_betterEmbed");
const logger = require("../logger");
const jt = require("../jsTools");

/** @param {dS_options} options  */
async function dynaSend(options) {
	options = {
		interaction: null,
		channel: null,
		message: null,
		messageContent: "",
		embeds: [],
		components: [],
		allowedMentions: {},
		sendMethod: "reply",
		ephemeral: false,
		deleteAfter: 0,
		...options
	};

	/* - - - - - { Parse Options } - - - - - */
	options.embeds = jt.isArray(options.embeds);
	options.components = jt.isArray(options.components);
	options.deleteAfter = jt.parseTime(options.deleteAfter);

	/* - - - - - { Error Checking } - - - - - */
	if (!options.interaction && !options.channel && !options.message)
		throw new Error("You must provide either a CommandInteraction, Channel, or Message");

	if (options.sendMethod === ("reply" || "editReply" || "followUp") && options.channel && !options.interaction)
		throw new Error(`The '${options.sendMethod}' SendMethod cannot be used when a Channel is provided`);

	if (options.sendMethod === "replyTo" && !options.message)
		throw new Error("You must provide a Message to use the 'replyTo' SendMethod");

	if (options.sendMethod === "edit" && !options.message)
		throw new Error("You must provide a Message to use the 'edit' SendMethod");

	if (options.sendMethod === ("replyTo" || "channel") && options.ephemeral)
		logger.debug("Ephemeral can only be used with interaction based SendMethods (except 'editReply')");

	if (options.deleteAfter && options.deleteAfter < 1000)
		logger.debug("dT_dynaSend deleteAfter is less than 1 second; Is this intentional?");

	if (options.components.length > 5) throw new Error("You cannot send more than 5 components per message");

	/* - - - - - { SendMethod Fallback } - - - - - */
	if (options.sendMethod === "reply" && (options.interaction.replied || options.interaction.deferred))
		options.sendMethod = "editReply";

	/* - - - - - { Send the Message } - - - - - */
	/** @type {Message|null} */
	let message = null;

	// Put together send data
	let sendData = {
		content: options.messageContent,
		components: options.components,
		embeds: options.embeds,
		fetchReply: true,
		allowedMentions: options.allowedMentions
	};

	switch (options.sendMethod) {
		case "reply":
			message = await options.interaction.reply({ ephemeral: options.ephemeral, ...sendData }).catch(err => {
				logger.error(
					"Failed to send message",
					`DynaSend | reply to interaction | sendMethod: ${options.sendMethod}`,
					err
				);
				return null;
			});

			break;

		case "editReply":
			message = await options.interaction.editReply(sendData).catch(err => {
				logger.error(
					"Failed to edit message",
					`DynaSend | edit interaction message | sendMethod: ${options.sendMethod}`,
					err
				);
				return null;
			});

			break;

		case "followUp":
			message = await options.interaction.followUp({ ephemeral: options.ephemeral, ...sendData }).catch(err => {
				logger.error(
					"Failed to send message",
					`DynaSend | follow-up interaction message | sendMethod: ${options.sendMethod}`,
					err
				);
				return null;
			});

			break;

		case "channel":
			message = await options.channel.send(sendData).catch(err => {
				logger.error(
					"Failed to send message",
					`DynaSend | send to channel | sendMethod: ${options.sendMethod}`,
					err
				);
				return null;
			});

			break;

		case "edit":
			// Check if the message can be edited
			if (!options.message.editable) {
				logger.debug("The provided message could not be edited");
				break;
			}

			message = await options.message.edit(sendData).catch(err => {
				logger.error("Failed to edit message", `DynaSend | edit message | sendMethod: ${options.sendMethod}`, err);
				return null;
			});

			break;

		case "replyTo":
			message = await options.message.reply(sendData).catch(err => {
				logger.error(
					"Failed to send message",
					`DynaSend | reply to message | sendMethod: ${options.sendMethod}`,
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
