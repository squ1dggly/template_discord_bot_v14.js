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

/** @typedef eN_selectMenuOptionData
 * @property {string} emoji
 * @property {string} label
 * @property {string} description
 * @property {string} value
 * @property {string} isDefault */

/** @typedef eN_sendOptions
 * @property {"reply"|"editReply"|"followUp"|"channel"} sendMethod if "reply" fails it will use "editReply" | "reply" is default
 * @property {boolean} ephemeral
 * @property {import("discord.js").MessageMentionOptions} allowedMentions
 * @property {boolean} deleteAfter */

const config = require("./_dsT_config.json");

// prettier-ignore
const { CommandInteraction, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
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

	/** @param {eN_selectMenuOptionData} options */
	addSelectMenuOptions(...options) {
		for (let _data of options) {
			// Error handling
			if (!data.emoji && !data.label) throw new Error("You must provide either an emoji or label");

			let idx_current = this.data.selectMenu.optionValues.length;
			let idx_new = this.data.selectMenu.optionValues.length + 1;

			// prettier-ignore
			data = {
				emoji: "", label: `page ${idx_new}`, description: "",
				value: `ssm_o_${idx_new}`, isDefault: idx_current === 0 ? true : false, ...data
			};

			// Add the new option ID (value) to our selectMenuOptionValues array
			this.data.selectMenu.optionValues.push(data.value);

			// Create a new StringSelectMenuOption
			let option = new StringSelectMenuOptionBuilder();

			// Configure options
			if (data.emoji) option.setEmoji(data.emoji);
			if (data.label) option.setLabel(data.label);
			if (data.description) option.setDescription(data.description);
			if (data.value) option.setValue(data.value);
			if (data.isDefault) option.setDefault(data.isDefault);

			// Add the new StringSelectMenuOption to the SelectMenu
			this.data.components.selectMenu.addOptions(option);
		}
	}

	/** @param {Number} idx */
	removeSelectMenuOptions(...idx) {
		for (let i of idx) this.data.components.selectMenu.spliceOptions(i, 1);
	}

	// prettier-ignore
	async setSelectMenuEnabled(enabled) {
		this.options.selectMenu = enabled;
		await this.refresh(); return;
	}

	/** @param {eN_paginationType} type */
	// prettier-ignore
	async setPaginationType(type) {
		this.options.paginationType = type;
		await this.refresh(); return;
	}

	/** @param {eN_sendOptions} options  */
	async send(options) {
		//
	}

	async refresh() {}
}

module.exports = EmbedNavigator;
