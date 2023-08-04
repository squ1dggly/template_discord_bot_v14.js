/** @typedef {{user:GuildMember|User, text:string, iconURL:string, linkURL: string}} bE_authorData */

/** @typedef bE_options
 * @property {CommandInteraction} interaction
 * @property {TextChannel} channel
 * @property {bE_authorData} author
 * @property {string|{text:string, linkURL:string}} title
 * @property {string|{text:string, iconURL:string}} footer
 * @property {string} description
 * @property {string} thumbnailURL
 * @property {string} imageURL
 * @property {string|string[]} color
 * @property {boolean} showTimestamp */

/** @typedef bE_sendOptions
 * @property {CommandInteraction} interaction
 * @property {TextChannel} channel
 * @property {string} messageContent
 * @property {bE_authorData} author
 * @property {string|{text:string, linkURL:string}} title
 * @property {string|{text:string, iconURL:string}} footer
 * @property {string} description
 * @property {string} thumbnailURL
 * @property {string} imageURL
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

class BetterEmbed extends EmbedBuilder {
	#_formatMarkdown(str) {
		return str
			.replace(/\$USER\b/g, this.options.author?.user)
			.replace(/\$USERNAME\b/g, this.options.author?.user?.displayName || this.options.author?.user?.username);
	}

	/** @param {bE_options} options */
	#_configure(options = {}) {
		let _options = { ...this.options, ...options };

		/// Error preventing
		/// Incase a string was provided instead of an object
		if (typeof _options.footer === "string") _options.footer = { text: _options.footer, iconURL: "" };
		if (typeof _options.title === "string") _options.title = { text: _options.title, linkURL: "" };

		if (!_options.description) _options.description = " ";
		if (!_options.author.text) _options.author.text = " ";
		if (!_options.title.text) _options.title.text = " ";
		if (!_options.footer.text) _options.footer.text = " ";
		if (!_options.color) _options.color = config.EMBED_COLOR || "Random";
		if (!Array.isArray(_options.color)) _options.color = [_options.color];

		/// Apply shorthand formatting
		_options.description = this.#_formatMarkdown(_options.description);
		_options.author.text = this.#_formatMarkdown(_options.author.text);
		_options.title.text = this.#_formatMarkdown(_options.title?.text || _options.title);
		_options.footer.text = this.#_formatMarkdown(_options.footer.text);

		/// Author
		if (_options.author.text) this.#_setAuthor(_options.author.text, "name");
		if (_options.author.linkURL) this.#_setAuthor(_options.author.linkURL, "linkURL");
		if ((_options.author.user || _options.author.iconURL) && ![null, false].includes(_options.author.iconURL)) {
			let _avatarURL = _options.author.iconURL || "";

			// prettier-ignore
			// Check if this is a GuildMember or a User
			if (_options.author.user?.guild)
				_avatarURL ||= _options.author.user.user.avatarURL({ dynamic: true });
			else
				_avatarURL ||= _options.author.user.avatarURL({ dynamic: true });

			// prettier-ignore
			try { this.#_setAuthor(_avatarURL, "iconURL"); }
			catch { logger.error("Could not configure embed", `invalid_avatarURL: \`${_avatarURL}\``); }
		}

		// Title
		if (_options.title.text) this.setTitle(_options.title.text);
		// prettier-ignore
		// Title URL
		if (_options.title.linkURL)
			try { this.setURL(_options.title.linkURL); }
			catch { logger.error("Could not configure embed", "invalid_linkURL", `\`${_options.title.linkURL}\``); }

		// prettier-ignore
		// Image URL
		if (_options.imageURL)
			try { this.setImage(_options.imageURL); }
			catch { logger.error("Could not configure embed", "invalid_imageURL", `\`${_options.imageURL}\``); }

		// prettier-ignore
		// Image thumbnail URL
		if (_options.thumbnailURL)
			try { this.setThumbnail(_options.thumbnailURL); }
			catch { logger.error("Could not configure embed", "invalid_thumbnailURL", `\`${_options.thumbnailURL}\``); }

		// Description
		if (_options.description) this.setDescription(_options.description);

		/// Footer
		if (_options.footer.text) this.#_setFooter(_options.footer.text, "text");
		if (_options.footer.iconURL) this.#_setFooter(_options.footer.iconURL, "iconURL");

		// prettier-ignore
		// Color
		if (_options.color.length)
			try { this.setColor(_options.color.length > 1 ? _jsT.choice(_options.color) : _options.color[0]); }
			catch { logger.error("Could not configure embed", "invalid_color", `\`${_options.color}\``); }

		// Timestamp
		if (_options.showTimestamp) this.setTimestamp();
	}

	/** @param {string} update @param {"name"|"linkURL"|"iconURL"} type */
	#_setAuthor(update, type) {
		// prettier-ignore
		switch (type) {
			case "name": return this.setAuthor({ name: update, url: this.data.author?.url, iconURL: this.data.author?.icon_url });

			case "linkURL":
				try { return this.setAuthor({ name: this.data.author?.name, url: update, iconURL: this.data.author?.icon_url }); }
				catch { return logger.error("Could not configure embed", "invalid: author_linkURL", `\`${update}\``); }

			case "iconURL":
				try { return this.setAuthor({ name: this.data.author?.name, url: this.data.author?.url, iconURL: update }); }
				catch { return logger.error("Could not configure embed", "invalid: author_iconURL", `\`${update}\``); }

			default: throw new TypeError(`\`${type}\` is not a valid SetAuthorType`);
		}
	}

	/** @param {string} update @param {"text"|"iconURL"} type */
	#_setFooter(update, type) {
		// prettier-ignore
		switch (type) {
			case "text": return this.setFooter({ text: update, iconURL: this.data.footer?.icon_url });

			case "iconURL":
				try { return this.setFooter({ text: this.data.footer?.text, iconURL: update }); }
				catch { logger.error("Could not configure embed", "invalid: footer_iconURL", `\`${update}\``); }

			default: throw new TypeError(`\`${type}\` is not a valid SetFooterType`);
		}
	}

	/** A better version of the classic EmbedBuilder
	 * - **`$USER`** :: *author's mention*
	 *
	 * - **`$USERNAME`** :: *author's display/user name*
	 * @param {bE_options} options */
	constructor(options) {
		super();

		// prettier-ignore
		this.options = {
			interaction: null, channel: null,
			author: { user: null, text: "", iconURL: "", linkURL: "" },
			title: { text: "", linkURL: "" }, footer: { text: "", iconURL: "" },
			description: "", imageURL: "", thumbnailURL: "",
			color: config.EMBED_COLOR || null,
			showTimestamp: false, ...options
		};

		this.#_configure();
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
		if (!Array.isArray(options.components)) options.components = [options.components];

		// Send the message
		return await dynaSend({ embeds: [this], ...options });
	}
}

module.exports = BetterEmbed;
