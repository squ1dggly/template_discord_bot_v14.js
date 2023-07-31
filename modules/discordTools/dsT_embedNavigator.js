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
const {
    CommandInteraction, TextChannel, GuildMember, User,
    Message, InteractionCollector, ReactionCollector, ComponentType,
    EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle
} = require("discord.js");
const deleteMesssageAfter = require("./dsT_deleteMessageAfter");
const BetterEmbed = require("./dsT_betterEmbed");
const dynaSend = require("./dsT_dynaSend");

const _jsT = require("../jsTools/_jsT");
const logger = require("../logger");

/// Global Variables
// Get thhe name of each pagination reaction
// this will be used as a filter when getting the current reactions from the message
const allPaginationReactionNames = Object.values(config.navigator.buttons).map(btnData => btnData.emoji.NAME);

class EmbedNavigator {
	/// -- Configuration --
	#_updatePage() {
		/// Clamp page index :: { CURRENT }
		if (this.data.pages.idx.current < 0)
			this.data.pages.idx.current = _jsT.clamp(this.options.embeds.length - 1, { min: 0 });
		if (this.data.pages.idx.current > this.options.embeds.length - 1) this.data.pages.idx.current = 0;

		/// Clamp page index :: { NESTED }
		if (this.data.pages.idx.nested < 0)
			this.data.pages.idx.nested = _jsT.clamp(this.data.pages.nested_length - 1, { min: 0 });
		if (this.data.pages.idx.nested > this.data.pages.nested_length - 1) this.data.pages.idx.nested = 0;

		let _page = this.options.embeds[this.data.pages.idx.current];

		// prettier-ignore
		// Check if the current page is an array of embeds
		if (Array.isArray(_page) && _page.length)
			this.data.pages.current = _page[this.data.pages.idx.nested];
		else
			this.data.pages.current = _page;

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
		if (this.options.selectMenuEnabled && this.data.components.selectMenu.options.length)
			this.data.messageComponents.push(this.data.actionRows.selectMenu);

		// Add pagination if enabled (buttons)
		if (this.data.pagination.required && !this.options.pagination.useReactions)
			this.data.messageComponents.push(this.data.actionRows.pagination);
	}

	#_configurePagination() {
		this.data.pagination.reactions = [];
		let _buttonStringArray = [];

		if (!this.options.pagination.type) return;

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
	async #_messageComponents_remove() {
		if (!this.data.message) return;
		// prettier-ignore
		try { return this.data.message.edit({ components: [] }); } catch {}
	}

	async #_paginationReactions_add() {
		if (!this.options.pagination.useReactions) return;
		if (!this.data.message) return;

		// Get each reaction currently on the message
		let _messageReactions = this.data.message.reactions.cache.filter(reaction =>
			allPaginationReactionNames.includes(reaction.emoji.name)
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
	}

	async #_paginationReactions_remove() {
		// prettier-ignore
		try { await this.data.message.reactions.removeAll();} catch {}
	}

	/// -- Pagination --
	async #_askPageNumber(user) {
		/// Error handling
		if (!this.data.message) return null;
		if (!user) {
			logger.error("Failed to await user's choice", "EmbedNavigator_askPageNumber", "user not defined");
			return null;
		}

		// Variables
		let _message = null;

		try {
			// Send a message to the channel asking the user to respond with a number
			_message = await this.data.message.reply({
				content: `${user} say the number you want to jump to`
			});
		} catch { return null; } // prettier-ignore

		// + Error handling
		if (!_message) return null;

		/// Create a message collector to await the user's next message
		let _timeouts = {
			confirm: _jsT.parseTime(config.timeouts.CONFIRMATION),
			error: _jsT.parseTime(config.timeouts.ERROR_MESSAGE)
		};
		let filter = msg => msg.author.id === user.id;

		return await _message.channel
			.awaitMessages({ filter, time: _timeouts.confirm, max: 1 })
			.then(async collected => {
				/// Variables
				let _message_user = collected.first() || null;
				if (!_message_user) return null;

				let _number = +_message_user.content;

				// prettier-ignore
				// Delete the message we sent to ask the user
				try { _message.delete(); } catch {}

				// prettier-ignore
				// Delete the user's response if it was a number
				if (!isNaN(_number)) try { _message_user.delete(); } catch { }

				// Check if the response was within our page length
				if (!_number || _number > this.data.pages.nested_length) {
					/// Send a self destructing error message
					let _message_error = await this.data.message.reply({
						content: `${user} \`${_number}\` is not a valid page number`
					});

					deleteMesssageAfter(_message_error, _timeouts.error);

					return null;
				}

				// Return the page number the user requested
				return _number - 1;
			})
			.catch(async () => {
				// prettier-ignore
				try { await _message.delete(); } catch {}
				return null;
			});
	}

	/// -- Collectors --
	async #_collect_reactions() {
		// Error handling
		if (this.data.collectors.reaction) {
			this.data.collectors.reaction.resetTimer();
			return;
		}

		/// Variables
		let filter_userIDs = this.options.users ? this.options.users.map(user => user.id) : [];
		if (this.options.interaction) filter_userIDs.push(this.options.interaction.user.id);

		/// Create the reaction collector
		const collector = this.data.message.createReactionCollector(
			this.options.timeout ? { time: this.options.timeout } : {}
		);

		this.data.collectors.reaction = collector;

		return new Promise(resolve => {
			// Collector :: { COLLECT }
			collector.on("collect", async (_reaction, _user) => {
				collector.resetTimer();

				// Remove the reaction unless it's from the bot itself
				if (_user.id !== _reaction.message.guild.members.me.id) await _reaction.users.remove(_user.id);

				// Filter out users that aren't allowed access
				if (filter_userIDs.length && !filter_userIDs.includes(_user.id)) return;

				// Filter out non-relevant reactions
				if (!allPaginationReactionNames.includes(_reaction.emoji.name)) return;

				try {
					// prettier-ignore
					switch (_reaction.emoji.name) {	
						case config.navigator.buttons.to_first.emoji.NAME:
							this.data.pages.idx.nested = 0;
							this.#_updatePage(); return await this.refresh();
	
						case config.navigator.buttons.back.emoji.NAME:
							this.data.pages.idx.nested--;
							this.#_updatePage(); return await this.refresh();
	
						case config.navigator.buttons.jump.emoji.NAME:
							return await this.#_askPageNumber(_reaction.user).then(async idx => {
								if (isNaN(idx)) return;

								this.data.pages.idx.nested = _jumpIdx;
								this.#_updatePage(); return await this.refresh();
							});
	
						case config.navigator.buttons.next.emoji.NAME:
							this.data.pages.idx.nested++;
							this.#_updatePage(); return await this.refresh();
	
						case config.navigator.buttons.to_last.emoji.NAME:
							this.data.pages.idx.nested = (this.data.pages.nested_length - 1);
							this.#_updatePage(); return await this.refresh();
	
						default: return;
					}
				} catch {}
			});

			// Collector :: { END }
			collector.on("end", async () => {
				this.data.collectors.reaction = null;
				await this.#_paginationReactions_remove();

				return resolve(true);
			});
		});
	}

	async #_collect_components() {
		// Error handling
		if (this.data.collectors.component) {
			this.data.collectors.component.resetTimer();
			return;
		}

		/// Variables
		let filter_userIDs = this.options.users?.length ? this.options.users.map(user => user.id) : [];
		if (this.options.interaction) filter_userIDs.push(this.options.interaction.user.id);

		/// Create the component collector
		const collector = this.data.message.createMessageComponentCollector(
			this.options.timeout ? { time: this.options.timeout } : {}
		);

		this.data.collectors.component = collector;

		return new Promise(resolve => {
			// Collector :: { COLLECT }
			collector.on("collect", async _interaction => {
				// Ignore non-button/StringSelectMenu interactions
				if (![ComponentType.Button, ComponentType.StringSelect].includes(_interaction.componentType)) return;

				// Filter out users that aren't allowed access
				if (filter_userIDs.length && !filter_userIDs.includes(_interaction.user.id)) return;

				// prettier-ignore
				// Defer the interaction & reset the collector's timer
				{ await _interaction.deferUpdate(); collector.resetTimer }

				try {
					// prettier-ignore
					switch (_interaction.customId) {
						case "ssm_pageSelect":
							// Find the page index for the option the user selected
							this.data.pages.idx.current = this.data.selectMenu.optionValues.findIndex(
								val => val === _interaction.values[0]
							);
	
							// Reset nested index
							this.data.pages.idx.nested = 0;
	
							/// Change the default StringSelectMenu option to the option the user selected
							this.data.components.selectMenu.options.forEach(option => option.setDefault(false));
							this.data.components.selectMenu.options[this.data.pages.idx.current].setDefault(true);
						
							// Update the page
							this.#_updatePage(); return await this.refresh();
	
						case "btn_to_first":
							this.data.pages.idx.nested = 0;
							this.#_updatePage(); return await this.refresh();
	
						case "btn_back":
							this.data.pages.idx.nested--;
							this.#_updatePage(); return await this.refresh();
	
						case "btn_jump":
							return await this.#_askPageNumber(_interaction.user).then(async idx => {
								if (isNaN(idx)) return;

								this.data.pages.idx.nested = _jumpIdx;
								this.#_updatePage(); return await this.refresh();
							});
	
						case "btn_next":
							this.data.pages.idx.nested++;
							this.#_updatePage(); return await this.refresh();
	
						case "btn_to_last":
							this.data.pages.idx.nested = (this.data.pages.nested_length - 1);
							this.#_updatePage(); return await this.refresh();
	
						default: return;
					}
				} catch {}
			});

			// Collector :: { END }
			collector.on("end", async () => {
				this.data.collectors.component = null;
				await this.#_messageComponents_remove();

				return resolve(true);
			});
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
		if (!options?.interaction && !options?.channel)
			throw new Error("You must provide either an Interaction or a TextChannel");
		if (options?.pagination?.useReactions)
			// prettier-ignore
			for (let [key, val] of Object.entries(config.navigator.buttons)) {
				if (!val.emoji.ID) throw new Error(
					`\`${key}.ID\` is an empty value; This is required to be able to add it as a reaction. Fix this in \'_dsT_config.json\'`
				);
			
				if (!val.emoji.NAME) throw new Error(
					`\`${key}.NAME\` is an empty value; This is required to determine which reaction a user reacted to. Fix this in \'_dsT_config.json\'`
				);
			}

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

		if (!Array.isArray(this.options.users) && this.options.users) this.options.users = [this.options.users];
		if (!Array.isArray(this.options.embeds) && this.options.embeds) this.options.embeds = [this.options.embeds];
		this.options.timeout = _jsT.parseTime(this.options.timeout);

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
				component: null,
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
					to_first: this.#_createButton(config.navigator.buttons.to_first, "btn_to_first"),
					back: this.#_createButton(config.navigator.buttons.back, "btn_back"),
					jump: this.#_createButton(config.navigator.buttons.jump, "btn_jump"),
					next: this.#_createButton(config.navigator.buttons.next, "btn_next"),
					to_last: this.#_createButton(config.navigator.buttons.to_last, "btn_to_last")
				}
			},

			/** @type {Message} */
			message: null,
			messageComponents: []
		};

		// Add the StringSelectMenuBuilder component to the select menu action row
		this.data.actionRows.selectMenu.setComponents(this.data.components.selectMenu);
	}

	/** @param {...eN_selectMenuOptionData} options */
	addSelectMenuOptions(...options) {
		for (let _data of options) {
			/// Error handling
			if (Array.isArray(_data)) throw new TypeError("You can't pass an array as an argument for `eN_selectMenuOptionData`");
			if (!_data.emoji && !_data.label) throw new Error("You must provide either an emoji or label");

			let idx_current = this.data.selectMenu.optionValues.length;
			let idx_new = this.data.selectMenu.optionValues.length + 1;

			// prettier-ignore
			_data = {
				emoji: "", label: `page ${idx_new}`, description: "",
				value: `ssm_o_${idx_new}`, isDefault: idx_current === 0 ? true : false, ..._data
			};

			// Add the new option ID (value) to our selectMenuOptionValues array
			this.data.selectMenu.optionValues.push(_data.value);

			// Create a new StringSelectMenuOption
			let option = new StringSelectMenuOptionBuilder();

			// Configure options
			if (_data.emoji) option.setEmoji(_data.emoji);
			if (_data.label) option.setLabel(_data.label);
			if (_data.description) option.setDescription(_data.description);
			if (_data.value) option.setValue(_data.value);
			if (_data.isDefault) option.setDefault(_data.isDefault);

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
			components: this.data.messageComponents, embeds: [this.data.pages.current],
			...options
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
		if (this.data.collectors.component) this.data.collectors.component.resetTimer();
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
