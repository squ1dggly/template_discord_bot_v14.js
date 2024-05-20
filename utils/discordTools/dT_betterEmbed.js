/** @typedef bE_author
 * @property {GuildMember|User|null} context The `GuildMember` or `User` that will be used for automatic context formatting.
 *
 * *NOTE:* There is no reason to provide this unless:
 *
 * **1.** Context was not provided during initialization.
 *
 * **2.** The provided context was a `Channel`.
 *
 * **3.** The author of the provided context is different from the author of the `Embed`.
 * @property {string|null} text The text to be displayed.
 * @property {string|boolean|null} icon The icon to be displayed on the top left of the `Embed`.
 *
 * If set to `true`, will use the provided `context` user's avatar.
 * @property {string|null} hyperlink If provided, will turn the `Embed`'s AUTHOR text into a hyperlink. */
/** @typedef {bE_author|string|null} bE_author */

/** @typedef bE_title
 * @property {string|null} text The text to be displayed.
 * @property {string|null} hyperlink If provided, will turn the `Embed`'s TITLE text into a hyperlink. */
/** @typedef {bE_title|string|null} bE_title */

/** @typedef bE_footer
 * @property {string|null} text The text to be displayed.
 * @property {string|null} icon The icon to be displayed on the bottom left of the `Embed`. */
/** @typedef {bE_footer|string|null} bE_footer */

/** @typedef bE_options
 * @property {{interaction:CommandInteraction, channel:TextChannel, message:Message}} context Can be provided for automated context formatting.
 * @property {bE_author} author The AUTHOR of the `Embed`.
 * @property {bE_title} title The TITLE of the `Embed`.
 * @property {string|null} thumbnailURL The thumbnail to be displayed on the top right of the `Embed`.
 * @property {string|null} description The text to be displayed inside of the `Embed`.
 * @property {string|null} imageURL The image to be displayed inside of the `Embed`.
 * @property {bE_footer} footer The footer to be displayed at the bottom of the `Embed`.
 * @property {string|string[]|null} color The color of the `Embed`.
 * @property {string|Number|boolean|Date} timestamp The timestamp to be displayed to the right of the `Embed`'s footer.
 *
 * If set to `true`, will use the current time.
 * @property {import("discord.js").APIEmbedField|import("discord.js").APIEmbedField[]} fields The FIELDS of the `Embed`.
 * @property {boolean} disableAutomaticContext If `true`, will disable automatic context formatting for this `Embed`. */

/** @typedef bE_sendOptions
 * @property {CommandInteraction|import("discord.js").Channel|Message} handler ***REQUIRED*** to send the embed.
 *
 * The type of handler depends on the `SendMethod` you choose to use.
 *
 * **1.** `CommandInteraction` is required for `Interaction` based `SendMethods`.
 *
 * **2.** `Channel` is required for the "sendToChannel" `SendMethod`.
 *
 * **3.** `Message` is required for `Message` based `SendMethods`.
 * @property {string} content The text content to send with the embed.
 *
 * @property {bE_author} author Preforms a non-mutative change to the `Embed`'s AUTHOR.
 * @property {bE_title} title Preforms a non-mutative change to the `Embed`'s TITLE.
 * @property {string} thumbnailURL Preforms a non-mutative change to the `Embed`'s THUMBNAIL.
 * @property {string} description Preforms a non-mutative change to the `Embed`'s DESCRIPTION.
 * @property {string} imageURL Preforms a non-mutative change to the `Embed`'s IMAGE.
 * @property {bE_footer} footer Preforms a non-mutative change to the `Embed`'s FOOTER.
 * @property {string|string[]} color Preforms a non-mutative change to the `Embed`'s COLOR.
 * @property {string|Number|boolean|Date} timestamp The timestamp to be displayed to the right of the `Embed`'s footer.
 *
 * If set to `true`, will use the current time.
 *
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
 * @property {number|string} deleteAfter The amount of time to wait in **MILLISECONDS** before deleting the message.
 *
 * This utilizes `jsTools.parseTime()`, letting you also use "10s", "1m", or "1m 30s" for example.
 * @property {boolean} fetchReply Whether to return the `Message` object after sending. `true` by default. */

// prettier-ignore
const { CommandInteraction, GuildMember, User, Message, EmbedBuilder, ActionRowBuilder, BaseChannel } = require("discord.js");
const dynaSend = require("./dT_dynaSend");
const logger = require("../logger");
const jt = require("../jsTools");

const config = { client: require("../../configs/config_client.json"), dt: require("./dT_config.json") };

const DEV_MODE = process.env.DEV_MODE === "true" ? true : false || config.client.DEV_MODE || false;

class BetterEmbed {
	#embed = new EmbedBuilder();

	#init_data = {
		context: { interaction: null, channel: null, message: null },
		author: { user: null, text: null, icon: null, hyperlink: null },
		title: { text: null, hyperlink: null },
		thumbnailURL: null,
		imageURL: null,
		description: null,
		footer: { text: null, icon: null },
		color: jt.choice(DEV_MODE ? config.dt.EMBED_COLOR_DEV : config.dt.EMBED_COLOR) || null,
		timestamp: null,
		fields: [],
		disableAutomaticContext: false
	};

	/** @param {string} str */
	#_applyContextFormatting(str) {
		if (!str) return null;
		if (!str.includes("$")) return str;

		let _user = null;
		let _guildMember = null;

		if (this.data.author.context instanceof User) _user = this.data.author.context;
		if (this.data.author.context instanceof GuildMember) {
			_guildMember = this.data.author.context;
			_user = this.data.author.context.user;
		}

		/* - - - - - { Author Context } - - - - - */
		// prettier-ignore
		if (_user && this.data.author.context) str = str
			.replace(/(?<!\\)\$USER\b/g, _user)
			.replace(/(?<!\\)\$USER_NAME\b/g, _user.username)
			.replace(/(?<!\\)\$USER_AVATAR\b/g, _user.avatarURL());

		// prettier-ignore
		// GuildMember specific context
		if (_guildMember && this.data.author.context?.user) str = str
			.replace(/(?<!\\)\$DISPLAY_NAME\b/g, _guildMember.displayName);

		/* - - - - - { General Context } - - - - - */
		// prettier-ignore
		if (this.data.context.interaction || this.data.context.message) str = str
			.replace(/(?<!\\)\$BOT_AVATAR\b/g, (this.data.context.interaction || this.data.context.message).client.user.avatarURL());

		// prettier-ignore
		str = str
			.replace(/(?<!\\)\$INVIS\b/g, config.dt.INVIS_CHAR)

			// User mentions
			.replace(/(?<!\\|<)@[0-9]+(?!>)/g, s => `<@${s.substring(1)}>`)
			// Role mentions
			.replace(/(?<!\\|<)@&[0-9]+(?!>)/g, s => `<@&${s.substring(2)}>`)
			// Channel mentions
			.replace(/(?<!\\|<)#[0-9]+(?!>)/g, s => `<#${s.substring(1)}>`)

			/// Dates
			.replace(/(?<!\\)\$YEAR/g, new Date().getFullYear())
			.replace(/(?<!\\)\$MONTH/g, `0${new Date().getMonth() + 1}`.slice(-2))
			.replace(/(?<!\\)\$DAY/g, `0${new Date().getDate()}`.slice(-2))
			.replace(/(?<!\\)\$year/g, `${new Date().getFullYear()}`.substring(2))
			.replace(/(?<!\\)\$month/g, `0${new Date().getMonth() + 1}`.slice(-2))
			.replace(/(?<!\\)\$day/g, `0${new Date().getDate()}`.slice(-2))

		// Return the formatted string
		return str;
	}

	#_parseData() {
		/* - - - - - { Cleanup Shorthand Configurations } - - - - - */
		if (this.data.fields) this.data.fields = jt.forceArray(this.data.fields);

		// prettier-ignore
		if (typeof this.data.author === "string")
			this.data.author = { user: null, text: this.data.author, icon: null, hyperlink: null };
		else if (!this.data.author)
			this.data.author = { user: null, text: null, icon: null, hyperlink: null };

		// prettier-ignore
		if (typeof this.data.title === "string")
			this.data.title = { text: this.data.title, hyperlink: null };
		else if (!this.data.title)
			this.data.title = { text: null, hyperlink: null };

		// prettier-ignore
		if (typeof this.data.footer === "string")
			this.data.footer = { text: this.data.footer, icon: null };
		else if (!this.data.footer)
			this.data.footer = { text: null, icon: null };

		// Timestamp
		if (this.data.timestamp === true) this.data.timestamp = Date.now();

		/* - - - - - { Context } - - - - - */
		// If no author context was provided, use the interaction's author
		if (!this.data.author.context && this.data.context.interaction)
			this.data.author.context = this.data.context.interaction?.member || this.data.context.interaction?.user;

		// If no author context was provided, use the message's author
		if (!this.data.author.context && this.data.context.message)
			this.data.author.context = this.data.context.message?.member || this.data.context.message?.author;

		/* - - - - - { Formatting } - - - - - */
		if (!this.data.disableAutomaticContext) {
			this.data.author.text = this.#_applyContextFormatting(this.data.author.text);
			this.data.title.text = this.#_applyContextFormatting(this.data.title.text);
			this.data.description = this.#_applyContextFormatting(this.data.description);
			this.data.footer.text = this.#_applyContextFormatting(this.data.footer.text);

			// Author icon
			if (this.data.author.icon === true && this.data.author.context) {
				if (this.data.author.context instanceof GuildMember)
					this.data.author.icon = this.data.author.context.user.avatarURL();

				// prettier-ignore
				if (this.data.author.context instanceof User)
					this.data.author.icon = this.data.author.context.avatarURL();
			}
			// Author icon fallback
			else if (!this.data.author.icon) this.data.author.icon = null;
		}
		// Fallback
		else {
			// Author icon
			if (this.data.author.icon === true) this.data.author.icon = null;
		}
	}

	/** @param {{}} options Configure with temporary data. */
	#_configure(options = null) {
		if (options) return this.clone({ ...this.data, ...options });

		this.setAuthor();
		this.setTitle();
		this.setThumbnail();
		this.setDescription();
		this.setImage();
		this.setFooter();
		this.addFields(this.data.fields, true);
		this.setColor();
		this.setTimestamp();
	}

	/** A better version of the classic `EmbedBuilder`.
	 *
	 * /// Author:
	 * - **`$USER`**: *author's mention (@xsqu1znt)*
	 * - **`$USER_NAME`**: *author's username*
	 * - **`$DISPLAY_NAME`**: *author's display name (requires `GuildMember` context)*
	 * - **`$USER_AVATAR`**: *author's avatar*
	 *
	 * /// General:
	 * - **`$BOT_AVATAR`**: *bot's avatar (requires `Interaction` or `Message` context)*
	 * - **`$INVIS`**: *invisible character for fields*
	 *
	 * - **`$YEAR`**: *YYYY*
	 * - **`$MONTH`**: *MM*
	 * - **`$DAY`**: *DD*
	 * - **`$year`**: *YY*
	 * - **`$month`**: *M or MM*
	 * - **`$day`**: *D or DD*
	 *
	 * All functions utilize automatic context formatting, unless `disableAutomaticContext` is set to `true`.
	 *
	 * **NOTE**: Use a blackslash `\` to escape any context.
	 * @param {bE_options} options */
	constructor(options) {
		this.data = { ...this.#init_data, ...options };

		this.#_parseData();
		this.#_configure();
	}

	/** Returns a new `BetterEmbed` with the same configuration.
	 * - **`$USER`**: *author's mention (@xsqu1znt)*
	 *
	 * - **`$USERNAME`**: *author's display name or username*
	 * @param {bE_options} options */
	clone(options) {
		return new BetterEmbed({ ...this.options, ...options });
	}

	/** Serializes this builder to API-compatible JSON data.
	 *
	 * @remarks
	 * This method runs validations on the data before serializing it. As such, it may throw an error if the data is invalid. */
	toJSON() {
		return this.#embed.toJSON();
	}

	/** Set the embed's author.
	 * @param {bE_author} author The AUTHOR of the `Embed`. */
	setAuthor(author = this.data.author) {
		// prettier-ignore
		if (author === null)
			this.data.author = structuredClone(this.#init_data.author);
	
		else if (typeof author === "string")
			this.data.author = { ...this.data.author, text: author };
	
		else
			this.data.author = { ...this.data.author, ...author };

		// Icon
		if (this.data.author.icon)
			try {
				// enables the use of the $USER_AVATAR and $BOT_AVATAR context
				if (!this.data.disableAutomaticContext)
					this.data.author.icon = this.#_applyContextFormatting(this.data.author.icon);

				// prettier-ignore
				this.#embed.setAuthor({ name: this.#embed.data.author?.name || null, iconURL: this.data.author.icon, url: this.#embed.data.author?.url || null });
			} catch (err) {
				console.log(err);
				logger.error("[BetterEmbed]: Failed to configure", `INVALID_AUTHOR_ICON | '${this.data.author.icon}'`);
			}

		// Hyperlink
		if (this.data.author.hyperlink)
			try {
				// prettier-ignore
				this.#embed.setAuthor({ name: this.#embed.data.author?.name || null, iconURL: this.#embed.data.author?.icon_url || null, url: this.data.author.hyperlink });
			} catch {
				logger.error("[BetterEmbed]: Failed to configure", `INVALID_AUTHOR_HYPERLINK | '${this.data.author.icon}'`);
			}

		// Text
		if (!this.data.disableAutomaticContext) this.data.author.text = this.#_applyContextFormatting(this.data.author.text);
		// prettier-ignore
		this.#embed.setAuthor({ name: this.data.author.text, iconURL: this.#embed.data.author?.icon_url || null, url: this.#embed.data.author?.url || null });

		return this;
	}

	/** Set the embed's title.
	 * @param {bE_title} title The TITLE of the `Embed`. */
	setTitle(title = this.data.title) {
		// prettier-ignore
		if (title === null)
			this.data.title = structuredClone(this.#init_data.title);

		else if (typeof author === "string")
			this.data.title = { ...this.data.title, text: title };

		else
			this.data.title = { ...this.data.title, ...title };

		// Hyperlink
		if (this.data.title.hyperlink)
			try {
				this.#embed.setURL(this.data.title.hyperlink || null);
			} catch {
				logger.error(
					"[BetterEmbed]: Failed to configure",
					`INVALID_TITLE_HYPERLINK | '${this.data.title.hyperlink}'`
				);
				return this;
			}

		/// Text
		if (!this.data.disableAutomaticContext) this.data.title.text = this.#_applyContextFormatting(this.data.title.text);
		this.#embed.setTitle(this.data.title.text || null);

		return this;
	}

	/** Set the embed's thumbnail.
	 * @param {bE_title} title The THUMBNAIL of the `Embed`. */
	setThumbnail(url = this.data.thumbnailURL) {
		if (url) url = url.trim();

		// wrapping in a try-catch checks if the URL is valid
		try {
			// enables the use of the $USER_AVATAR and $BOT_AVATAR context
			if (!this.data.disableAutomaticContext) url = this.#_applyContextFormatting(url);

			this.#embed.setThumbnail(url);
		} catch {
			logger.error("[BetterEmbed]: Failed to configure", `INVALID_THUMBNAIL_URL | '${this.data.thumbnailURL}'`);
			return this;
		}

		this.data.thumbnailURL = url;

		return this;
	}

	/** Set the embed's description.
	 * @param {string|null} description The text to be displayed inside of the `Embed`. */
	setDescription(description = this.data.description) {
		if (!this.data.disableAutomaticContext) description = this.#_applyContextFormatting(description);

		this.data.description = description;
		this.#embed.setDescription(description);

		return this;
	}

	/** Set the embed's image.
	 * @param {string|null} url The image to be displayed inside of the `Embed`. */
	setImage(url = this.data.imageURL) {
		if (url) url = url.trim();

		// wrapping in a try-catch checks if the URL is valid
		try {
			// enables the use of the $USER_AVATAR and $BOT_AVATAR context
			if (!this.data.disableAutomaticContext) url = this.#_applyContextFormatting(url);

			this.#embed.setImage(url);
		} catch {
			logger.error("[BetterEmbed]: Failed to configure", `INVALID_IMAGE_URL | '${this.data.imageURL}'`);
			return this;
		}

		this.data.imageURL = url;

		return this;
	}

	/** Set the embed's footer.
	 * @param {bE_footer} footer The FOOTER of the `Embed`. */
	setFooter(footer = this.data.footer) {
		// prettier-ignore
		if (footer === null)
			this.data.footer = structuredClone(this.#init_data.footer);
	
		else if (typeof footer === "string")
			this.data.footer = { ...this.data.footer, text: footer };
	
		else
			this.data.footer = { ...this.data.footer, ...footer };

		// Icon
		if (this.data.footer.icon)
			try {
				// enables the use of the $USER_AVATAR and $BOT_AVATAR context
				if (!this.data.disableAutomaticContext)
					this.data.footer.icon = this.#_applyContextFormatting(this.data.footer.icon);

				this.#embed.setFooter({ text: this.#embed.data.footer?.text || null, iconURL: this.data.footer.icon });
			} catch {
				logger.error("[BetterEmbed]: Failed to configure", `INVALID_FOOTER_ICON | '${this.data.footer.icon}'`);
				return this;
			}

		// Text
		if (!this.data.disableAutomaticContext) this.data.footer.text = this.#_applyContextFormatting(this.data.footer.text);
		this.#embed.setFooter({ text: this.data.footer.text, iconURL: this.#embed.data.footer?.icon_url || null });

		return this;
	}

	/** Add or replace the embed's fields.
	 *
	 * - **NOTE**: You can only have a MAX of 25 fields per `Embed`.
	 * @param {import("discord.js").APIEmbedField|import("discord.js").APIEmbedField[]} fieldData The FIELDS of the `Embed`. */
	addFields(fieldData = this.data.fields, replaceAll = false) {
		fieldData = jt.forceArray(fieldData);

		// Clear all fields
		if (replaceAll && (!fieldData.length || (fieldData[0] === null && fieldData.length === 1))) {
			this.data.fields = [];

			this.#embed.spliceFields(0, this.#embed.data.fields?.length || 0);
			return this;
		}

		/* - - - - - { Validate Fields } - - - - - */
		if (fieldData.length > 25) {
			// prettier-ignore
			logger.debug(`[BetterEmbed]: You can only have a MAX of 25 fields per \`Embed\`. ${fieldData.length - 25} fields have been trimmed.`);

			// Trim the array
			fieldData = fieldData.slice(0, 25);
		}

		// Check if all fields have a NAME and VALUE property
		for (let i = 0; i < fieldData.length; i++) {
			if (!fieldData[i].name) {
				logger.debug(`[BetterEmbed]: Field ${i} does not have a 'name' property. Field has been removed.`);
				console.log(fieldData[i]);

				// Remove from array
				fieldData.splice(i, 1);
				continue;
			}

			if (!fieldData[i].value) {
				logger.debug(`[BetterEmbed]: Field ${i} does not have a 'value' property. Field has been removed.`);
				console.log(fieldData[i]);

				// Remove from array
				fieldData.splice(i, 1);
				continue;
			}

			/// Apply context formatting
			if (!this.data.disableAutomaticContext) fieldData[i].name = this.#_applyContextFormatting(fieldData[i].name);
			if (!this.data.disableAutomaticContext) fieldData[i].value = this.#_applyContextFormatting(fieldData[i].value);
		}

		if (replaceAll) {
			this.data.fields = fieldData;
			this.#embed.setFields(fieldData);
		} else {
			this.data.fields.push(...fieldData);

			// Cap out field size
			if (this.data.fields.length > 25) {
				// prettier-ignore
				logger.debug(`[BetterEmbed]: You can only have a MAX of 25 fields per \`Embed\`. ${this.data.fields.length - 25} fields have been trimmed.`);

				// Trim the array
				this.data.fields = this.data.fields.slice(0, 25);
			}

			this.#embed.addFields(fieldData);
		}

		return this;
	}

	/** Replace or delete the embed's fields.
	 *
	 * - **NOTE**: You can only have a MAX of 25 fields per `Embed`.
	 * @param {import("discord.js").APIEmbedField|import("discord.js").APIEmbedField[]} fieldData The FIELDS of the `Embed`. */
	spliceFields(index, deleteCount, fieldData) {
		fieldData = jt.forceArray(fieldData);

		// Delete fields
		if (deleteCount && !fieldData.length) {
			this.data.fields.splice(index, deleteCount);
			this.#embed.setFields(this.data.fields);
		}

		/* - - - - - { Validate Fields } - - - - - */
		if (fieldData.length) {
			if (fieldData.length > 25) {
				// prettier-ignore
				logger.debug(`[BetterEmbed]: You can only have a MAX of 25 fields per \`Embed\`. ${fieldData.length - 25} fields have been trimmed.`);

				// Trim the array
				fieldData = fieldData.slice(0, 25);
			}

			// Check if all fields have a NAME and VALUE property
			for (let i = 0; i < fieldData.length; i++) {
				if (!fieldData[i].name) {
					logger.debug(`[BetterEmbed]: Field ${i} does not have a 'name' property. Field has been removed.`);
					console.log(fieldData[i]);

					// Remove from array
					fieldData.splice(i, 1);
					continue;
				}

				if (!fieldData[i].value) {
					logger.debug(`[BetterEmbed]: Field ${i} does not have a 'value' property. Field has been removed.`);
					console.log(fieldData[i]);

					// Remove from array
					fieldData.splice(i, 1);
					continue;
				}

				/// Apply context formatting
				if (!this.data.disableAutomaticContext) fieldData[i].name = this.#_applyContextFormatting(fieldData[i].name);
				if (!this.data.disableAutomaticContext)
					fieldData[i].value = this.#_applyContextFormatting(fieldData[i].value);
			}

			// Add the new fields at the index
			this.data.fields.splice(index, 0, ...fieldData);

			// Cap out field size
			if (this.data.fields.length > 25) {
				// prettier-ignore
				logger.debug(`[BetterEmbed]: You can only have a MAX of 25 fields per \`Embed\`. ${this.data.fields.length - 25} fields have been trimmed.`);

				// Trim the array
				this.data.fields = this.data.fields.slice(0, 25);
			}
		}

		return this;
	}

	/** Set the embed's color.
	 * @param {bE_footer} color The COLOR of the `Embed`. */
	setColor(color = this.data.color) {
		this.data.color = color !== null ? jt.choice(jt.forceArray(color)) : null;

		try {
			this.#embed.setColor(this.data.color || null);
		} catch {
			logger.error("[BetterEmbed]: Failed to configure", `INVALID_COLOR | '${this.data.color}'`);
			return this;
		}

		return this;
	}

	/** Set the embed's timestamp.
	 * @param {bE_timestamp} timestamp The TIMESTAMP of the `Embed`. */
	setTimestamp(timestamp = this.data.timestamp) {
		this.data.timestamp = timestamp || null;
		if (this.data.timestamp === true) this.data.timestamp = Date.now();

		try {
			this.#embed.setTimestamp(timestamp || null);
		} catch {
			logger.error("[BetterEmbed]: Failed to configure", `INVALID_TIMESTAMP | '${this.data.timestamp}'`);
			return this;
		}

		return this;
	}

	/** Send the embed.
	 *
	 * @param {Handler} handler The `Interaction`, `Channel`, or `Message` to use to send the `Embed`.
	 * @param {bE_sendOptions} options Preform a non-mutative change to the `Embed` before sending. */
	async send(handler, options) {
		let _embed = this;
		this.#_parseData();

		// prettier-ignore
		if (options?.author || options?.title || options?.thumbnailURL || options?.description || options?.imageURL || options?.footer || options?.footer || options?.color || options?.timestamp) {
			// Clone the embed and apply the options
			_embed = this.#_configure(options);
		} else {
			// Configure the embed before sending
			this.#_configure();
		}

		let sendData = {
			interaction: handler instanceof CommandInteraction ? handler : null,
			channel: handler instanceof BaseChannel ? handler : null,
			message: handler instanceof Message ? handler : null,
			embeds: [_embed],
			components: [],
			allowedMentions: {},
			sendMethod: "",
			...options
		};

		// SendMethod defaults
		if (sendData.interaction) sendData.sendMethod = "reply";
		else if (sendData.channel) sendData.sendMethod = "sendToChannel";
		else if (sendData.message) sendData.sendMethod = "messageReply";

		// Send the message
		return await dynaSend(sendData);
	}
}

module.exports = BetterEmbed;
