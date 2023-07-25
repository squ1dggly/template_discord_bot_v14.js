/** @typedef {"short"|"shortJump"|"long"|"longJump"} eN_paginationType */

/** @typedef eN_options
 * @property {CommandInteraction} interaction
 * @property {TextChannel} channel
 * @property {EmbedBuilder|BetterEmbed} embeds can be an array/contain nested arrays
 * @property {boolean} selectMenu
 * @property {eN_paginationType} paginationType
 * @property {boolean} useReactionsForPagination
 * @property {boolean} dynamicPagination
 * @property {number|string} timeout */

const config = require("./_dsT_config.json");

// prettier-ignore
const { CommandInteraction, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const BetterEmbed = require("./dsT_betterEmbed");
const _jsT = require("../jsTools/_jsT");

class EmbedNavigator {
	#_createButton(options) {
		options = { emoji: "", label: "", style: ButtonStyle.Secondary, customID: "", ...options };

		// prettier-ignore
		return new ButtonBuilder({
			emoji: options.emoji, label: options.label,
			style: options.style, custom_id: options.customID
		});
	}

	/** @param {eN_options} options  */
	constructor(options) {
		/// Error handling
		// Send method
		if (!options.interaction && !options.channel) throw new Error("You must provide either an interaction or channel");

		// Embeds
		if (!options.embeds) throw new Error("You must provide at least 1 embed");
		if (Array.isArray(options.embeds) && !options.embeds.length) throw new Error("Embeds cannot be an empty array");

		/// Parse options
		// prettier-ignore
		this.options = {
			interaction: null, channel: null, embeds: null,
			selectMenu: false, paginationType: null,
			useReactionsForPagination: false, dynamicPagination: false,
			timeout: config.timeouts.PAGINATION, ...options
		};

		options.timeout = _jsT.parseTime(options.timeout);

		// Configure data & variables
		// prettier-ignore
		this.data = {
			pages: {
				/** @type {EmbedBuilder|BetterEmbed} */
				current: null,
				nested_length: 0, idx: { current: 0, nested: 0 }
			},

			selectMenu: {
				optionValues: []
			},

			messageComponents: []
		};
	}
}

module.exports = EmbedNavigator;
