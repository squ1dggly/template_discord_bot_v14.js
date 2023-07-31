/** @typedef {"reply"|"editReply"|"followUp"|"channel"} dS_sendMethod */

/** @typedef dS_sendOptions
 * @property {CommandInteraction} interaction
 * @property {TextChannel} channel
 * @property {string} messageContent
 * @property {EmbedBuilder|BetterEmbed|Array<EmbedBuilder|BetterEmbed>} embeds
 * @property {dS_sendMethod} sendMethod if "reply" fails it will use "editReply" | "reply" is default
 * @property {ActionRowBuilder|ActionRowBuilder[]} components
 * @property {boolean} ephemeral
 * @property {import("discord.js").MessageMentionOptions} allowedMentions
 * @property {number|string} deleteAfter amount of time to wait in milliseconds */

const { CommandInteraction, TextChannel, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const deleteMesssageAfter = require("./dsT_deleteMessageAfter");
const BetterEmbed = require("./dsT_betterEmbed");

const _jsT = require("../jsTools/_jsT");
const logger = require("../logger");

/** @param {dS_sendOptions} options  */
async function dynaSend(options) {
	// prettier-ignore
	options = {
			interaction: null, channel: null, embeds: [],
			messageContent: "", components: [], allowedMentions: {},
			sendMethod: "reply", ephemeral: false, deleteAfter: 0,
			...options
    };

    options.deleteAfter = _jsT.parseTime(options.deleteAfter);
    
	let message = null;

	try {
		switch (options.sendMethod) {
			// prettier-ignore
			case "reply":
                if (!options.interaction)
                    throw new Error("sendMethod \`reply\` not allowed; CommandInteraction not provided");

                try {
                    message = await options.interaction.reply({
                        content: options.messageContent, components: options.components,
                        embeds: options.embeds, ephemeral: options.ephemeral, fetchReply: true,
                        allowedMentions: options.allowedMentions
                    });
                } catch (err) {
                    // Fallback to "editReply"
                    message = await options.interaction.editReply({
                        content: options.messageContent, components: options.components,
                        embeds: options.embeds, fetchReply: true, allowedMentions: options.allowedMentions
                    });
                } break;

			// prettier-ignore
			case "editReply":
                if (!options.interaction)
                    throw new Error("sendMethod \`editReply\` not allowed; CommandInteraction not provided");
                
                message = await options.interaction.editReply({
                    content: options.messageContent, components: options.components,
                    embeds: options.embeds, fetchReply: true, allowedMentions: options.allowedMentions
                }); break;

			// prettier-ignore
			case "followUp":
                if (!options.interaction)
                    throw new Error("sendMethod \`followUp\` not allowed; CommandInteraction not provided");
                
                message = await options.interaction.followUp({
                    content: options.messageContent, components: options.components,
                    embeds: options.embeds, ephemeral: options.ephemeral, fetchReply: true,
                    allowedMentions: options.allowedMentions
                }); break;

			// prettier-ignore
			case "channel":
                if (!options.channel)
                    throw new Error("sendMethod \`channel\` not allowed; TextChannel not provided");
                
                message = await options.channel.send({
                    content: options.messageContent, components: options.components,
                    embeds: options.embeds, fetchReply: true, allowedMentions: options.allowedMentions
                }); break;

			default:
				logger.error(
					"Failed to send message",
					"dynaSend.invalid_sendMethod",
					`method given: \`${options.sendMethod}\``
				);
				break;
		}
	} catch (err) {
		logger.error("Failed to send message", "dynaSend()", err);
		return null;
	}

	// Delete the message after a certain amount of time
	if (message && options.deleteAfter) deleteMesssageAfter(message, options.deleteAfter);

	// Return the sent message
	return message;
}

module.exports = dynaSend;
