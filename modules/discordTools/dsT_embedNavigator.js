/** @typedef {"short"|"shortJump"|"long"|"longJump"} eN_paginationType */

/** @typedef eN_paginationOptions
 * @property {eN_paginationType} type
 * @property {boolean} useReactions
 * @property {boolean} enableDynamic */

/** @typedef eN_options
 * @property {CommandInteraction} interaction
 * @property {TextChannel} channel
 * @property {GuildMember|User|Array<GuildMember|User>} users extra users that are allowed to use the navigator
 * @property {EmbedBuilder|BetterEmbed} embeds can be an array/contain nested arrays
 * @property {boolean} selectMenuEnabled
 * @property {eN_paginationOptions} pagination
 * @property {number|string|null} timeout set to `null` to never timeout */

/** @typedef eN_selectMenuOptionData
 * @property {string} emoji
 * @property {string} label
 * @property {string} description
 * @property {string} value
 * @property {string} isDefault */

/** @typedef eN_sendOptions
 * @property {"reply"|"editReply"|"followUp"|"channel"} sendMethod if `reply` fails, `editReply` will be used :: `reply` is default
 * @property {boolean} ephemeral
 * @property {import("discord.js").MessageMentionOptions} allowedMentions
 * @property {boolean} deleteAfter */

const config = require("./_dsT_config.json");

// prettier-ignore
const { CommandInteraction, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Message, InteractionCollector, ReactionCollector, GuildMember, User, ComponentType } = require("discord.js");
const BetterEmbed = require("./dsT_betterEmbed");
const dynaSend = require("./dsT_dynaSend");
const _jsT = require("../jsTools/_jsT");

class EmbedNavigator {
	/// -- Configuration --
	#_updatePage() {
		/// Clamp page index :: { CURRENT }
		if (this.data.pages.idx.current < 0) this.data.pages.idx.current = 0;
		if (this.data.pages.idx.current > this.options.embeds.length - 1)
			this.data.pages.idx.current = this.options.embeds.length - 1;

		/// Clamp page index :: { NESTED }
		if (this.data.pages.idx.nested < 0) this.data.pages.idx.nested = 0;
		if (this.data.pages.idx.nested > this.data.pages.nested_length - 1)
			this.data.pages.idx.nested = this.data.pages.nested_length - 1;

		let _page = this.options.embeds[this.data.pages.idx.current];

		// prettier-ignore
		// Check if the current page is an array of embeds
		if (Array.isArray(_page) && _page.length)
			this.data.pages.current = _page[this.data.pages.idx.nested];
		else
			this.data.pages = _page;

		// Count how many nested pages there are currently
		this.data.pages.nested_length = _page?.length || 0;

		// Check if pagination is required
		this.data.pagination.required = _page?.length >= 2;

		// Check if long pagination could be used
		this.data.pagination.requiresLong = _page?.length >= 4;

		// Check if jumping could be used
		this.data.pagination.canJump = _page?.length >= 4;
	}

	#_configureMessageComponents() {
		this.data.messageComponents = [];

		// prettier-ignore
		// Add the StringSelectMenu if enabled
		if (this.options.selectMenuEnabled)
			this.data.messageComponents.push(this.data.actionRows.selectMenu);

		// Add pagination if enabled (buttons)
		if (this.data.pagination.required && !this.options.pagination.useReactions)
			this.data.messageComponents.push(this.data.actionRows.pagination);
	}

	#_configurePagination() {
		this.data.pagination.reactions = [];
		let _buttonStringArray = [];

		// prettier-ignore
		if (this.data.pagination.required) switch (this.options.pagination.type) {
			case "short": _buttonStringArray = ["back", "next"]; break;

			case "shortJump": _buttonStringArray = this.options.pagination.enableDynamic
				? this.data.pagination.canJump
					? ["back", "jump", "next"]													// Default state :: { DYNAMIC }
					: ["back", "next"]															// Short state :: { DYNAMIC }
				: ["back", "jump", "next"];														// Default state
				break;

			case "long": _buttonStringArray = this.options.pagination.enableDynamic
				? this.data.pagination.requiresLong
					? ["to_first", "back", "next", "to_last"]									// Default state :: { DYNAMIC }
					: ["back", "next"]															// Short state :: { DYNAMIC }
				: ["to_first", "back", "next", "to_last"];										// Default state
				break;

			case "longJump": _buttonStringArray = this.options.pagination.enableDynamic
				? this.data.pagination.requiresLong
					? this.data.canJumpToPage
						? ["to_first", "back", "jump", "next", "to_last"]						// Default state :: { DYNAMIC }
						: ["to_first", "back", "next", "to_last"]								// Short state :: { DYNAMIC }
					: ["back", "next"]															// Short state :: { DYNAMIC }
				: ["to_first", "back", "jump", "next", "to_last"];								// Default state
				break;
		}

		// prettier-ignore
		// Convert the button string array into button/emoji data
		if (this.options.pagination.useReactions)
			// Using reactions
			this.data.pagination.reactions = _buttonStringArray.map(type =>
				_jsT.getProp(config.navigator.buttons, `${type}.emoji`)
			);
		else
			// Not using reactions
			this.data.actionRows.pagination.setComponents(
				..._buttonStringArray.map(type => _jsT.getProp(this.data.components.pagination, type))
			);
	}

	/// -- Components --
	async #_paginationReactions_add() {
		if (!this.options.pagination.useReactions) return;
		if (!this.data.message) return;

		// Get thhe name of each pagination reaction
		// this will be used as a filter when getting the current reactions from the message
		let _allPaginationReactionNames = Object.values(config.navigator.buttons).map(btnData => btnData.emoji.NAME);

		// Get each reaction currently on the message
		let _messageReactions = this.data.message.reactions.cache.filter(reaction =>
			_allPaginationReactionNames.includes(reaction.emoji.name)
		);

		// Update pagination reactions if necessary
		if (_messageReactions.size !== this.data.pagination.reactions.length) {
			// Remove pagination reactions
			await this.#_paginationReactions_remove();

			try {
				// prettier-ignore
				// Add pagination reactions
				for (let _reaction of this.data.pagination.reactions)
					await this.data.message.react(_reaction.ID);
			} catch {}
		}
		// Remove pagination reactions
		else await this.#_paginationReactions_remove();
	}

	async #_paginationReactions_remove() {
		// prettier-ignore
		try { await this.data.message.reactions.removeAll();} catch {}
	}

	/// -- Collectors --
	async #_collect_reactions() {
		// Error handling
		if (this.data.collectors.reaction) {
			this.data.collectors.reaction.resetTimer();
			return;
		}
	}

	#_collect_components() {
		// Error handling
		if (this.data.collectors.interaction) {
			this.data.collectors.interaction.resetTimer();
			return;
		}

		/// Variables
		let filter_userIDs = this.options.users ? this.options.users.map(user => user.id) : [];
		if (this.options.interaction) filter_userIDs.push(this.options.interaction.user.id);

		// Create the collector
		const collector = this.data.message.createMessageComponentCollector(
			this.options.timeout ? { time: this.options.timeout } : {}
		);

		// On collection
		collector.on("collect", async interaction => {
			// Ignore non-button/StringSelectMenu interactions

			// Filter out users that aren't allowed access
			if (filter_userIDs.length && !filter_userIDs.includes(interaction.user.id)) return;

			// prettier-ignore
			// Defer the interaction & reset the collector's timer
			{ await interaction.deferReply(); collector.resetTimer }
		});
	}

	/// -- Constructor --
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
		if (!options.interaction && !options.channel) throw new Error("You must provide either an interaction or channel");

		// Embeds
		if (!options.embeds) throw new Error("You must provide at least 1 embed");
		if (Array.isArray(options.embeds) && !options.embeds.length) throw new Error("Embeds cannot be an empty array");

		/// Parse options
		// prettier-ignore
		this.options = {
			interaction: null, channel: null, users: null, embeds: null,
			selectMenuEnabled: false,
			pagination: { type: null, useReactions: false, enableDynamic: false },
			timeout: config.timeouts.PAGINATION, ...options
		};

		if (!Array.isArray(this.options.users)) this.options.users = [this.options.users];
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
				/** @type {{NAME:string, ID:string}[]} */
				reactions: [],
				required: false, requiresLong: false, canJump: false 
			},

			collectors: {
				/** @type {InteractionCollector} */
				interaction: null,
				/** @type {ReactionCollector} */
				reaction: null
			},

			actionRows: {
				selectMenu: new ActionRowBuilder(),
				pagination: new ActionRowBuilder()
			},

			components: {
				selectMenu: new StringSelectMenuBuilder()
					.setCustomId("ssm_pageSelect")
					.setPlaceholder("choose a page to view..."),
				
				pagination: {
					to_first: this.#_createButton(config.navigator.buttons.to_first, "btn_toFirst"),
					back: this.#_createButton(config.navigator.buttons.back, "btn_back"),
					jump: this.#_createButton(config.navigator.buttons.jump, "btn_jump"),
					next: this.#_createButton(config.navigator.buttons.next, "btn_next"),
					to_last: this.#_createButton(config.navigator.buttons.to_last, "btn_toLast")
				}
			},

			/** @type {Message} */
			message: null,
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
		this.options.selectMenuEnabled = enabled;
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
		/// Update the configuration
		this.#_updatePage();
		this.#_configureMessageComponents();
		this.#_configurePagination();

		// prettier-ignore
		// Send the message
		this.data.message = await dynaSend({
			interaction: this.options.interaction, channel: this.options.channel,
			components: this.data.messageComponents, ...options
		});

		// Check if the send failed
		if (!this.data.message) return null;

		// Add reactions for pagination if enabled
		// NOTE: this is not awaited since we want to be able to use the reactions while they're being added
		if (this.data.pagination.required && this.options.pagination.useReactions) this.#_paginationReactions_add();

		/// Start collectors if needed
		// Collect message reactions
		if (this.data.pagination.reactions.length) this.#_collect_reactions();
		// Collect message component interactions
		if (this.data.messageComponents.length) this.#_collect_components();

		// Return the message
		return this.data.message;
	}

	/** Refresh the message and its components */
	async refresh() {
		/// Error handling
		if (!this.data.message) {
			logger.error(`Failed to refresh EmbedNavigator`, `message not sent`);
			return null;
		}

		if (!this.data.message.editable) {
			logger.error(`Failed to refresh EmbedNavigator`, `message not editable`);
			return null;
		}

		/// Update the configuration
		this.#_updatePage();
		this.#_configureMessageComponents();
		this.#_configurePagination();
		this.#_paginationReactions_add();

		/// Reset collection timers
		if (this.data.collectors.interaction) this.data.collectors.interaction.resetTimer();
		if (this.data.collectors.reaction) this.data.collectors.reaction.resetTimer();

		/// Start collectors if needed
		// Collect message reactions
		if (this.data.pagination.reactions.length) this.#_collect_reactions();
		// Collect message component interactions
		if (this.data.messageComponents.length) this.#_collect_components();

		// prettier-ignore
		// Edit & return the message
		this.data.message = await this.data.message.edit({
			embeds: [this.data.pages.current], components: this.data.messageComponents
		});

		return this.data.message;
	}
}

module.exports = EmbedNavigator;
