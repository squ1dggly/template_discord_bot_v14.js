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
const { CommandInteraction, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const BetterEmbed = require("./dsT_betterEmbed");
const _jsT = require("../jsTools/_jsT");

class EmbedNavigator {
	#_createButton(label, customID) {
		let _button = new ButtonBuilder({ style: ButtonStyle.Secondary, custom_id: customID });

		if (label.TEXT) _button.setLabel(label.TEXT);
		else if (label.emoji.ID) _button.setEmoji(label.emoji.ID);
		else throw new Error("You must provide text or an emoji ID for this navigator button in '_dsT_config.json'");

		return _button;
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

		if (!Array.isArray(this.data.embeds)) this.options.embeds = [this.data.embeds];
		options.timeout = _jsT.parseTime(options.timeout);

		/// Configure data & variables
		// prettier-ignore
		this.data = {
			pages: {
				/** @type {EmbedBuilder|BetterEmbed} */
				current: null,
				nested_length: 0, idx: { current: 0, nested: 0 }
			},

			selectMenu: { optionValues: [] },

			pagination: {
				/** @type {{name:string, emoji:string}[]} */
				reactions: [],
				required: false, requiresLong: false, canJump: false 
			},

			collectors: { message: null, reaction: null },

			actionRows: {
				selectMenu: new ActionRowBuilder(),
				pagination: new ActionRowBuilder()
			},

			components: {
				selectMenu: new StringSelectMenuBuilder()
					.setCustomId("ssm_pageSelect")
					.setPlaceholder("choose a page to view..."),
				
				pagination: {
					toFirst: this.#_createButton(config.navigator.buttons.to_first, "btn_toFirst"),
					back: this.#_createButton(config.navigator.buttons.back, "btn_back"),
					jump: this.#_createButton(config.navigator.buttons.jump, "btn_jump"),
					next: this.#_createButton(config.navigator.buttons.next, "btn_next"),
					toLast: this.#_createButton(config.navigator.buttons.to_last, "btn_toLast")
				}
			},

			messageComponents: []
		};

		// Add the StringSelectMenuBuilder component to the select menu action row
		this.data.actionRows.selectMenu.setComponents(this.data.components.selectMenu);
	}
}

module.exports = EmbedNavigator;
