/** @typedef {{user:GuildMember|User|null, text:string|null, iconURL:string|null, linkURL: string|null}|string|null} bE_author */
/** @typedef {{text:string|null, linkURL:string|null}|string|null} bE_title */
/** @typedef {string|null} bE_thumbnailURL */
/** @typedef {string|null} bE_description */
/** @typedef {string|null} bE_imageURL */
/** @typedef {{text:string|null, iconURL:string|null}|string|null} bE_footer */
/** @typedef {string|string[]|null} bE_color */
/** @typedef {number|Date|boolean|null} bE_timestamp */

/** @typedef bE_options
 * @property {CommandInteraction | null} interaction
 * @property {TextChannel | null} channel
 * @property {bE_author} author
 * @property {bE_title} title
 * @property {bE_thumbnailURL} thumbnailURL
 * @property {bE_description} description
 * @property {string} imageURL
 * @property {bE_footer} footer
 * @property {bE_color} color
 * @property {bE_timestamp} timestamp
 * @property {boolean} disableFormatting */

/** @typedef bE_sendOptions
 * @property {CommandInteraction} interaction
 * @property {TextChannel} channel
 * @property {string} messageContent
 * @property {bE_author} author
 * @property {string|{text:string, linkURL:string}} title
 * @property {string} thumbnailURL
 * @property {string} description
 * @property {string} imageURL
 * @property {string|{text:string, iconURL:string}} footer
 * @property {string|string[]} color
 * @property {"reply"|"editReply"|"followUp"|"channel"} sendMethod if `reply` fails, `editReply` will be used :: `reply` is default
 * @property {ActionRowBuilder|ActionRowBuilder[]} components
 * @property {boolean} ephemeral
 * @property {import("discord.js").MessageMentionOptions} allowedMentions
 * @property {number|string} deleteAfter amount of time to wait in milliseconds */

const config = require("./_dsT_config.json");

const { CommandInteraction, TextChannel, GuildMember, User, EmbedBuilder, ActionRowBuilder } = require("discord.js");
const dynaSend = require("./dsT_dynaSend");
const _jsT = require("../jsTools/_jsT");
const logger = require("../logger");

class BetterEmbed extends EmbedBuilder {
	#init = {
		interaction: null,
		channel: null,
		author: { user: null, text: null, iconURL: null, linkURL: null },
		title: { text: null, linkURL: null },
		thumbnailURL: null,
		description: null,
		imageURL: null,
		footer: { text: null, iconURL: null },
		color: config.EMBED_COLOR || null,
		timestamp: null,
		disableFormatting: false
	};

	#_formatMarkdown(str) {
		if (!str) return null;
		if (this.options.disableFormatting) return str;

		return str
			.replace(/(?<!\\)\$USER\b/g, this.options.author?.user)
			.replace(/(?<!\\)\$USERNAME\b/g, this.options.author?.user?.displayName || this.options.author?.user?.username);
	}

	/** A better version of the classic EmbedBuilder
	 * - **`$USER`** :: *author's mention*
	 *
	 * - **`$USERNAME`** :: *author's display/user name*
	 * @param {bE_options} options */
	constructor(options) {
		super();
		this.options = { ...this.#init, ...options };
		this.#_configure();
	}

	/** Return a new BetterEmbed with the same configuration @param {bE_options} options*/
	copy(options) {
		return new BetterEmbed({ ...this.options, ...options });
	}

	/** Set this embed's author @param {bE_author} author */
	setAuthor(author) {
		let _author = { user: null, text: null, iconURL: null, linkURL: null };

		// prettier-ignore
		if (author === null)
			this.options.author = _author;

		else if (typeof author === "string")
			this.options.author = { ..._author, user: this.options.author.user, text: author };

		else
			this.options.author = { ..._author, ...author };

		this.options.author.text = this.#_formatMarkdown(this.options.author.text);

		this.#_setAuthor();
		return this;
	}

	#_setAuthor() {
		super.setAuthor({ name: this.#_formatMarkdown(this.options.author.text) });
		this.#_parseOptions();

		try {
			// prettier-ignore
			if (typeof this.options.author.iconURL === "string")
				super.setAuthor({ name: this.options.author.text, iconURL: this.options.author.iconURL });

			else if (this.options.author.iconURL === true) {
				let _iconURL = "";

				// Get the avatar URL of the provided user
				if (this.options.author.user) {
					try {
						_iconURL = this.options.author.user.user.avatarURL({ dynamic: true });
					} catch {
						_iconURL = this.options.author.user.avatarURL({ dynamic: true });
					}
				}

				// Get the avatar URL from the user's interaction
				else if (this.options.interaction)
					_iconURL = this.options.interaction.user.avatarURL({ dynamic: true });

				super.setAuthor({ name: this.options.author.text, iconURL: _iconURL });
			}

			// Remove the avatar icon from the embed
			else if (this.options.author.iconURL === null)
				this.data.author.icon_url = undefined;
		} catch (err) {
			console.error(err);
			logger.error("Could not configure embed", "invalid_authorIconURL", `\`${this.options.author.iconURL}\``);
		}

		try {
			// prettier-ignore
			if (this.options.author.linkURL)
				super.setAuthor({ url: this.options.author.linkURL });
			else
				this.data.author.url = undefined;
		} catch {
			logger.error("Could not configure embed", "invalid_authorLinkURL", `\`${this.options.author.linkURL}\``);
		}
	}

	/** Set this embed's title @param {bE_title} title */
	setTitle(title) {
		let _title = { text: null, linkURL: null };

		// prettier-ignore
		if (title === null)
			this.options.title = _title;

		else if (typeof title === "string")
			this.options.title = { ..._title, text: title };

		else
			this.options.title = { ..._title, ...title };

		// Formatting
		this.options.title.text = this.#_formatMarkdown(this.options.title.text);

		this.#_setTitle();
		return this;
	}

	#_setTitle() {
		super.setTitle(this.#_formatMarkdown(this.options.title.text));

		try {
			// prettier-ignore
			if (this.options.title.linkURL)
				super.setURL(this.options.title.linkURL);
			else
				this.data.url = undefined;
		} catch {
			logger.error("Could not configure embed", "invalid_titleLinkURL", `\`${this.options.title.linkURL}\``);
		}
	}

	/** ***Deprecated!*** Use `setTitle()` instead @deprecated */
	setURL() {
		logger.log("BetterEmbed.setURL() is deprecated. Use setTitle() instead");
		return this;
	}

	/** Set this embed's thumbnail @param {bE_thumbnailURL} url */
	setThumbnail(url) {
		this.options.thumbnailURL = url;
		this.#_setThumbnail();
		return this;
	}

	#_setThumbnail() {
		try {
			// prettier-ignore
			if (this.options.thumbnailURL)
				super.setThumbnail(this.options.thumbnailURL);
			else
				this.data.thumbnail = undefined;
		} catch {
			logger.error("Could not configure embed", "invalid_thumbnailURL", `\`${this.options.thumbnailURL}\``);
		}
	}

	/** Set this embed's description @param {bE_description} description */
	setDescription(description) {
		this.options.description = this.#_formatMarkdown(description);
		this.#_setDescription();
		return this;
	}

	#_setDescription() {
		super.setDescription(this.#_formatMarkdown(this.options.description));
	}

	/** Set this embed's image @param {bE_imageURL} url */
	setImage(url) {
		this.options.imageURL = url;
		this.#_setImage();
		return this;
	}

	#_setImage() {
		try {
			// prettier-ignore
			if (this.options.imageURL)
				super.setImage(this.options.imageURL);
			else
				this.data.image = undefined;
		} catch {
			logger.error("Could not configure embed", "invalid_imageURL", `\`${this.options.imageURL}\``);
		}
	}

	/** Set this embed's footer @param {bE_footer} footer */
	setFooter(footer) {
		let _footer = { text: null, iconURL: null };

		// prettier-ignore
		if (footer === null)
			this.options.footer = _footer;

		else if (typeof footer === "string")
			this.options.footer = { ..._footer, text: footer };

		else
			this.options.footer = { ..._footer, ...footer };

		// Formatting
		this.options.footer.text = this.#_formatMarkdown(this.options.footer.text);

		this.#_setFooter();
		return this;
	}

	#_setFooter() {
		super.setFooter({ text: this.#_formatMarkdown(this.options.footer.text) });

		try {
			// prettier-ignore
			if (this.options.footer.iconURL)
				super.setFooter({ text: this.options.footer.text, iconURL: this.options.footer.iconURL });
			else
				this.data.footer.icon_url = undefined;
		} catch {
			logger.error("Could not configure embed", "invalid_footerIconURL", `\`${this.options.footer.iconURL}\``);
		}
	}

	/** Set this embed's color @param {bE_footer} color */
	setColor(color) {
		// prettier-ignore
		/// Format color strings
		if (Array.isArray(color)) color.forEach((str, idx) => {
			if (str[0] !== "#") color[idx] = `#${str}`.trim();
			else color[idx] = str.trim().toUpperCase();
		});
		else if (color !== null) color = color.trim();

		this.options.color = color || config.EMBED_COLOR;
		this.#_setColor();
		return this;
	}

	#_setColor() {
		let color = Array.isArray(this.options.color) ? _jsT.choice(this.options.color) : this.options.color;

		try {
			super.setColor(color);
		} catch {
			logger.error("Could not configure embed", "invalid_color", `\`${this.options.color}\``);
		}
	}

	/** Set this embed's timestamp @param {bE_timestamp} timestamp */
	setTimestamp(timestamp) {
		this.options.timestamp = timestamp || null;
		this.#_setTimestamp();
		return this;
	}

	#_setTimestamp() {
		// prettier-ignore
		if (this.options.timestamp === true)
			super.setTimestamp();

		else if (this.options.timestamp === null)
			super.setTimestamp(null);

		else try {
			super.setTimestamp(this.options.timestamp);
		} catch {
			logger.error("Could not configure embed", "invalid_timestamp", `\`${this.options.timestamp}\``);
		}
	}

	#_parseOptions() {
		/* - - - - - { Cleanup Shorthand Configurations } - - - - - */
		if (typeof this.options.author === "string")
			this.options.author = { user: null, text: this.options.author, iconURL: null, linkURL: null };

		// prettier-ignore
		if (typeof this.options.title === "string")
			this.options.title = { text: this.options.title, linkURL: null };

		// prettier-ignore
		if (typeof this.options.footer === "string")
			this.options.footer = { text: this.options.footer, iconURL: null };

		// Add the interaction's member as the author's user if needed
		if (!this.options.author.user && this.options.interaction)
			this.options.author.user = this.options.interaction.member;

		// prettier-ignore
		// Add the interaction's channel as the default send channel if needed
		if (!this.options.channel && this.options.interaction)
			this.options.channel = this.options.interaction.channel;

		/* - - - - - { Formatting } - - - - - */
		this.options.author.text = this.#_formatMarkdown(this.options.author.text);
		this.options.title.text = this.#_formatMarkdown(this.options.title.text);
		this.options.description = this.#_formatMarkdown(this.options.description);
		this.options.footer.text = this.#_formatMarkdown(this.options.footer.text);
	}

	/** @param {{}} options Configure with temporary options */
	#_configure(options) {
		const execute = () => {
			this.#_setAuthor();
			this.#_setTitle();
			this.#_setThumbnail();
			this.#_setDescription();
			this.#_setImage();
			this.#_setFooter();
			this.#_setColor();
			this.#_setTimestamp();
		};

		if (options) {
			let _prev = structuredClone(this.options);

			this.options = { ...this.options, ...options };
			execute();
			this.options = _prev;
			return;
		}

		this.#_parseOptions();
		execute();
	}

	/** Send the embed using the interaction or channel
	 *
	 * - **`$USER`** :: *author's mention*
	 *
	 * - **`$USERNAME`** :: *author's display/user name*
	 * @param {bE_sendOptions} options */
	async send(options) {
		// prettier-ignore
		options = {
			interaction: null, channel: null,
			messageContent: "", components: [], allowedMentions: {},
			sendMethod: "reply", ephemeral: false, deleteAfter: 0,
			...this.options, ...options
		};

		this.#_configure(options);
		options.messageContent = this.#_formatMarkdown(options.messageContent);
		options.deleteAfter = _jsT.parseTime(options.deleteAfter);

		// If a single component was given, convert it into an array
		options.components = _jsT.isArray(options.components);

		// Send the message
		return await dynaSend({ embeds: [this], ...options });
	}
}

module.exports = BetterEmbed;
