/** @typedef {"short"|"shortJump"|"long"|"longJump"} PaginationType */

/** @typedef eN_paginationOptions
 * @property {PaginationType} type The type of navigation.
 * @property {boolean} useReactions Whether to use reactions instead of buttons.
 * @property {boolean} dynamic Whether to dynamically add the `Page Jump` button only when needed. */

/** @typedef eN_selectMenuOptionData
 * @property {string} emoji The emoji to be displayed to the left of the option.
 * @property {string} label The main text to be displayed.
 * @property {string} description The description to be displayed.
 * @property {string} value The index of the option.
 * @property {string} isDefault Whether this is the default option. */

/** @typedef eN_options
 * @property {GuildMember|User|Array<GuildMember|User>} userAccess Other users that are allowed to use the navigator. ***(optional)***
 * @property {EmbedBuilder|BetterEmbed} embeds The embeds to paginate through.
 * @property {boolean} selectMenuEnabled Enables the select menu.
 *
 * *Only visible if options are added.*
 * @property {eN_paginationOptions} pagination Pagination configuration options.
 * @property {number|string|null} timeout How long to wait before timing out. Use `null` to never timeout.
 *
 * This utilizes `jsTools.parseTime()`, letting you also use "10s", "1m", or "1m 30s" for example. */

/** @typedef eN_sendOptions
 * @property {ActionRowBuilder|ActionRowBuilder[]} components The components to send with the embed
 * @property {import("discord.js").MessageMentionOptions} allowedMentions The allowed mentions of the message.
 * @property {import("./dT_dynaSend").SendMethod} sendMethod The method to send the embed.
 *
 * **1.** By default, "reply" is used if a `CommandInteraction` is provided as the handler. If "reply" fails, "editReply" is used.
 *
 * **2.** By default, "sendToChannel" is used if a `Channel` is provided as the handler.
 *
 * **3.** By default, "messageReply" is used if a `Message` is provided as the handler.
 * @property {boolean} ephemeral If the message should be ephemeral. This only works for the "reply" `SendMethod`.
 * @property {number|string} deleteAfter The amount of time to wait in **MILLISECONDS** before deleting the message. */

// prettier-ignore
const { CommandInteraction, GuildMember, User, Message, InteractionCollector, ReactionCollector, ComponentType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const deleteMesssageAfter = require("./dT_deleteMessageAfter");
const BetterEmbed = require("./dT_betterEmbed");
const dynaSend = require("./dT_dynaSend");

const logger = require("../logger");
const jt = require("../jsTools");

const config = require("./dT_config.json");

// Get the name of each pagination reaction
// this will be used as a filter when getting the current reactions from the message
const paginationReactionNames = Object.values(config.navigator.buttons).map(data => data.emoji.NAME);

function createButton(data, id) {
	let button = new ButtonBuilder({ style: ButtonStyle.Secondary, custom_id: id });

	if (data.TEXT) button.setLabel(data.TEXT);
	else if (data.emoji.ID) button.setEmoji(data.emoji.ID);
	else
		throw new Error(
			"[EmbedNavigator>createButton] You must provide text or an emoji ID for this navigator button in '_dT_config.json'."
		);

	return button;
}

class EmbedNavigator {
	/* - - - - - { Configuration } - - - - - */
	#_configurePage() {
		/// Clamp page index :: { CURRENT }
		if (this.data.pages.idx.current < 0)
			this.data.pages.idx.current = jt.clamp(this.options.embeds.length - 1, { min: 0 });
		if (this.data.pages.idx.current > this.options.embeds.length - 1) this.data.pages.idx.current = 0;

		/// Clamp page index :: { NESTED }
		if (this.data.pages.idx.nested < 0)
			this.data.pages.idx.nested = jt.clamp(this.data.pages.nestedLength - 1, { min: 0 });
		if (this.data.pages.idx.nested > this.data.pages.nestedLength - 1) this.data.pages.idx.nested = 0;

		let _page = this.options.embeds[this.data.pages.idx.current];

		// prettier-ignore
		// Check if the current page is an array of embeds
		if (Array.isArray(_page) && _page.length)
			this.data.pages.current = _page[this.data.pages.idx.nested];
		else
			this.data.pages.current = _page;

		// Count how many nested pages there are currently
		this.data.pages.nestedLength = Array.isArray(_page) ? _page.length : 0;

		// Check if pagination is required
		this.data.pagination.required = Array.isArray(_page) ? _page.length >= 2 : false;

		// Check if long pagination could be used
		this.data.pagination.requiresLong = Array.isArray(_page) ? _page.length >= 4 : false;

		// Check if jumping could be used
		this.data.pagination.canJump = Array.isArray(_page) ? _page.length >= 4 : false;
	}

	#_configureComponents() {
		this.data.messageComponents = [];

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

			case "shortJump": _buttonStringArray = this.options.pagination.dynamic
				? this.data.pagination.canJump
					? ["back", "jump", "next"]													// Default state :: { DYNAMIC }
					: ["back", "next"]															// Short state :: { DYNAMIC }
				: ["back", "jump", "next"];														// Default state
				break;

			case "long": _buttonStringArray = this.options.pagination.dynamic
				? this.data.pagination.requiresLong
					? ["to_first", "back", "next", "to_last"]									// Default state :: { DYNAMIC }
					: ["back", "next"]															// Short state :: { DYNAMIC }
				: ["to_first", "back", "next", "to_last"];										// Default state
				break;

			case "longJump": _buttonStringArray = this.options.pagination.dynamic
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
				jt.getProp(config.navigator.buttons, `${type}.emoji`)
			);
		else
			// Not using reactions
			this.data.actionRows.pagination.setComponents(
				..._buttonStringArray.map(type => jt.getProp(this.data.components.pagination, type))
			);
	}

	/* - - - - - { Component Management } - - - - - */
	async #_messageComponents_remove() {
		if (this.data.message?.editable) return await this.data.message.edit({ components: [] }).catch(() => null);
		return null;
	}

	async #_paginationReactions_add() {
		if (!this.options.pagination.useReactions) return;
		if (!this.data.message) return;

		// Get each reaction currently on the message
		let _messageReactions = this.data.message.reactions.cache.filter(reaction =>
			paginationReactionNames.includes(reaction.emoji.name)
		);

		// Update pagination reactions if necessary
		if (_messageReactions.size !== this.data.pagination.reactions.length) {
			// Remove pagination reactions
			await this.#_paginationReactions_remove();

			// Add pagination reactions
			for (let _reaction of this.data.pagination.reactions)
				await this.data.message.react(_reaction.ID).catch(() => null);
		}
	}

	async #_paginationReactions_remove() {
		if (this.data.message) return await this.data.message.reaction.removeAll().catch(() => null);
		return null;
	}

	/* - - - - - { Utility } - - - - - */
	async #_askPageNumber(user) {
		/// Error handling
		if (!this.data.message) return null;
		if (!user) {
			logger.error("[EmbedNavigator>askPageNumber]:", "User not defined.");
			return null;
		}

		// Variables
		let _message = null;

		// Send a message to the channel asking the user to respond with a number
		_message = await this.data.message
			.reply({ content: config.navigator.ASK_PAGE_NUMBER_MESSAGE.replace("$USER_MENTION", user) })
			.catch(() => null);

		// + Error handling
		if (!_message) return null;

		/// Create a message collector to await the user's next message
		let _timeouts = {
			confirm: jt.parseTime(config.timeouts.CONFIRMATION),
			error: jt.parseTime(config.timeouts.ERROR_MESSAGE)
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
				if (_message.deletable) _message.delete().catch(() => null);

				// Delete the user's response if it was a number
				if (!isNaN(_number) && _message_user.deletable) await _message_user.delete().catch(() => null);

				// Check if the response was within our page length
				if (!_number || _number > this.data.pages.nestedLength) {
					// prettier-ignore
					/// Send a self destructing error message
					let _message_error = await this.data.message.reply({
						content: config.navigator.ASK_PAGE_NUMBER_ERROR
							.replace("$USER_MENTION", user)
							.replace("$MESSAGE_CONTENT", _message_user.content)
					});

					deleteMesssageAfter(_message_error, _timeouts.error);

					return null;
				}

				// Return the page number the user requested
				return _number - 1;
			})
			.catch(async () => {
				// Delete the message we sent to ask the user
				if (_message.deletable) _message.delete().catch(() => null);
				return null;
			});
	}

	/* - - - - - { Collector } - - - - - */
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
				if (!paginationReactionNames.includes(_reaction.emoji.name)) return;

				try {
					// prettier-ignore
					switch (_reaction.emoji.name) {	
						case config.navigator.buttons.to_first.emoji.NAME:
							this.data.pages.idx.nested = 0;
							this.#_configurePage(); return await this.refresh();
	
						case config.navigator.buttons.back.emoji.NAME:
							this.data.pages.idx.nested--;
							this.#_configurePage(); return await this.refresh();
	
						case config.navigator.buttons.jump.emoji.NAME:
							return await this.#_askPageNumber(_user).then(async idx => {
								if (isNaN(idx)) return;

								this.data.pages.idx.nested = idx;
								this.#_configurePage(); return await this.refresh();
							});
	
						case config.navigator.buttons.next.emoji.NAME:
							this.data.pages.idx.nested++;
							this.#_configurePage(); return await this.refresh();
	
						case config.navigator.buttons.to_last.emoji.NAME:
							this.data.pages.idx.nested = (this.data.pages.nestedLength - 1);
							this.#_configurePage(); return await this.refresh();
	
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
							this.#_configurePage(); return await this.refresh();
	
						case "btn_to_first":
							this.data.pages.idx.nested = 0;
							this.#_configurePage(); return await this.refresh();
	
						case "btn_back":
							this.data.pages.idx.nested--;
							this.#_configurePage(); return await this.refresh();
	
						case "btn_jump":
							return await this.#_askPageNumber(_interaction.user).then(async idx => {
								if (isNaN(idx)) return;

								this.data.pages.idx.nested = idx;
								this.#_configurePage(); return await this.refresh();
							});
	
						case "btn_next":
							this.data.pages.idx.nested++;
							this.#_configurePage(); return await this.refresh();
	
						case "btn_to_last":
							this.data.pages.idx.nested = (this.data.pages.nestedLength - 1);
							this.#_configurePage(); return await this.refresh();
	
						default: return;
					}
				} catch {}
			});

			// Collector :: { END }
			collector.on("end", async () => {
				this.data.collectors.component = null;
				try {
					await this.#_messageComponents_remove();
				} catch {}

				return resolve(true);
			});
		});
	}

	/** A utility to create pagination between multiple embeds using `Reactions`, `Buttons`, and or `SelectMenus`.
	 * @param {eN_options} options */
	constructor(options) {
		this.options = {
			userAccess: [],
			embeds: [],
			selectMenuEnabled: false,
			pagination: { type: "", useReactions: false, dynamic: false },
			...options
		};

		/* - - - - - { Error Checking } - - - - - */
		if (this.options?.pagination?.useReactions)
			// prettier-ignore
			for (let [key, val] of Object.entries(config.navigator.buttons)) {
				if (!val.emoji.ID) throw new Error(`[EmbedNavigator]: \`${key}.ID\` is an empty value; This is required to be able to add it as a reaction. Fix this in \'_dT_config.json\'.`);
				if (!val.emoji.NAME) throw new Error(`[EmbedNavigator]: \`${key}.NAME\` is an empty value; This is required to determine which reaction a user reacted to. Fix this in \'_dT_config.json\'.`);
            }

		if (!this.options.embeds || (Array.isArray(this.options.embeds) && !this.options.embeds.length))
			throw new Error("[EmbedNavigator]: You must provide at least 1 embed");

		/* - - - - - { Parse Options } - - - - - */
		this.options.userAccess = jt.forceArray(this.options.userAccess);
		this.options.embeds = jt.forceArray(this.options.embeds);

		this.data = {
			pages: {
				/** @type {EmbedBuilder|BetterEmbed} */
				current: null,
				nestedLength: 0,
				idx: { current: 0, nested: 0 }
			},

			selectMenu: { optionValues: [] },

			pagination: {
				/** @type {{NAME:string, ID:string}[]} */
				reactions: [],
				required: false,
				canUseLong: false,
				canJump: false
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
					.setPlaceholder(config.navigator.DEFAULT_SELECT_MENU_PLACEHOLDER),

				pagination: {
					to_first: createButton(config.navigator.buttons.to_first, "btn_to_first"),
					back: createButton(config.navigator.buttons.back, "btn_back"),
					jump: createButton(config.navigator.buttons.jump, "btn_jump"),
					next: createButton(config.navigator.buttons.next, "btn_next"),
					to_last: createButton(config.navigator.buttons.to_last, "btn_to_last")
				}
			},

			/** @type {Message} */
			message: null,
			messageComponents: []
		};

		// Add the StringSelectMenuBuilder component to the select menu action row
		this.data.actionRows.selectMenu.setComponents(this.data.components.selectMenu);
	}

	/** Add new options to the select menu.
	 * @param {...eN_selectMenuOptionData} options The options you want to add. */
	addSelectMenuOptions(...options) {
		for (let data of options) {
			/* - - - - - { Error Checking } - - - - - */
			if (Array.isArray(data))
				throw new TypeError("[EmbedNavigator>addSelectMenuOptions]: You can't pass an array as an argument.");

			if (!data.emoji && !data.label)
				throw new Error("[EmbedNavigator>addSelectMenuOptions]: You must provide either an emoji or label.");

			/* - - - - - { Configure and Add Option } - - - - - */
			let idx_current = this.data.selectMenu.optionValues.length;
			let idx_new = this.data.selectMenu.optionValues.length + 1;

			data = {
				emoji: "",
				label: `page ${idx_new}`,
				description: "",
				value: `ssm_o_${idx_new}`,
				isDefault: idx_current === 0 ? true : false,
				...data
			};

			// Add the new option ID (value) to our selectMenuOptionValues array
			this.data.selectMenu.optionValues.push(data.value);

			// Create a new StringSelectMenuOption
			let ssm_option = new StringSelectMenuOptionBuilder();

			// Configure options
			if (data.emoji) ssm_option.setEmoji(data.emoji);
			if (data.label) ssm_option.setLabel(data.label);
			if (data.description) ssm_option.setDescription(data.description);
			if (data.value) ssm_option.setValue(data.value);
			if (data.isDefault) ssm_option.setDefault(data.isDefault);

			// Add the new StringSelectMenuOption to the SelectMenu
			this.data.components.selectMenu.addOptions(ssm_option);
		}

		return this;
	}

	/** Remove options from the select menu.
	 * @param {Number} index The index of the options you want to remove. */
	removeSelectMenuOptions(...index) {
		for (let i of index) this.data.components.selectMenu.spliceOptions(i, 1);
		return this;
	}

	/** Enable/disable the select menu.
	 * @param {boolean} enabled `true` to enable, `false` to disable. */
	async setSelectMenuEnabled(enabled) {
		this.options.selectMenuEnabled = enabled;
		await this.refresh();
		return this;
	}

	/** Set the type of pagination.
	 * @param {PaginationType} type The new value you want to set. */
	async setPaginationType(type) {
		this.options.pagination.type = type;
		await this.refresh();
		return this;
	}

	/** Send the embeds with navigation.
	 * @param {CommandInteraction|import("discord.js").Channel|Message} handler ***REQUIRED*** to send the message.
	 *
	 * The type of handler depends on the `SendMethod` you choose to use.
	 *
	 * **1.** `CommandInteraction` is required for `Interaction` based `SendMethods`.
	 *
	 * **2.** `Channel` is required for the "sendToChannel" `SendMethod`.
	 *
	 * **3.** `Message` is required for `Message` based `SendMethods`.
	 * @param {eN_sendOptions} options Extra send options. */
	async send(handler, options) {
		/* - - - - - { Configure } - - - - - */
		this.#_configurePage();
		this.#_configureComponents();
		this.#_configurePagination();

		/* - - - - - { Send the Navigator } - - - - - */
		this.data.message = await dynaSend({
			interaction: handler instanceof CommandInteraction ? handler : null,
			channel: handler instanceof BaseChannel ? handler : null,
			message: handler instanceof Message ? handler : null,
			...options,
			embeds: this.options.embeds,
			components: this.data.messageComponents
		});

		// Return null if failed
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

	/** Refresh the navigater's message and components. */
	async refresh() {
		/// Error handling
		if (!this.data.message) {
			logger.error("[EmbedNavigator]:", "Could not refresh navigator; message not sent.");
			return null;
		}

		if (!this.data.message.editable) {
			logger.error("[EmbedNavigator]:", "Could not refresh navigator; message not editable.");
			return null;
		}

		/// Update the configuration
		this.#_configurePage();
		this.#_configureComponents();
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

		// Edit & return the message
		this.data.message = await this.data.message.edit({
			embeds: [this.data.pages.current],
			components: this.data.messageComponents
		});

		return this.data.message;
	}
}

module.exports = EmbedNavigator;
