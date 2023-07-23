/** @typedef bE_options
 * Author/Title/Description format shorthand:
 *
 * • $USER :: author's mention
 *
 * • $USERNAME :: author's display/user name
 * @property {CommandInteraction} interaction
 * @property {{user:GuildMember|User, text:string, iconURL:string, linkURL: string}} author
 * @property {{text:string, linkURL:string}} title
 * @property {{text:string, iconURL:string}} footer
 * @property {string} description
 * @property {string} thumbnailURL
 * @property {string} imageURL
 * @property {string} color
 * @property {boolean} showTimestamp */

/** @typedef bE_sendOptions
 * Message Content/Author/Title/Description format shorthand:
 *
 * • $USER :: author's mention
 *
 * • $USERNAME :: author's display/user name
 * @property {CommandInteraction} interaction
 * @property {TextChannel} channel
 * @property {string} messageContent
 * @property {{user:GuildMember|User, text:string, iconURL:string, linkURL: string}} author
 * @property {{text:string, linkURL:string}} title
 * @property {{text:string, iconURL:string}} footer
 * @property {string} description
 * @property {string} thumbnailURL
 * @property {string} imageURL
 * @property {string} color
 * @property {"reply"|"editReply"|"followUp"|"channel"} sendMethod if "reply" fails it will use "editReply" | "reply" is default
 * @property {ActionRowBuilder|ActionRowBuilder[]} components
 * @property {boolean} ephemeral
 * @property {number|string} deleteAfter amount of time to wait in milliseconds */

const config = require("./_dsT_config.json");

const { CommandInteraction, User, GuildMember, TextChannel, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const _jsT = require("../jsTools/_jsT");

/** A better version of the classic EmbedBuilder */
class BetterEmbed extends EmbedBuilder {
	#_configure(options = {}) {
		let _options = { ...this.options, ...options };

		/// Apply shorthand formatting
		_options.description = this.#_format(_options.description);
		_options.author.name = this.#_format(_options.author.text);
		_options.title = this.#_format(_options.title.text);
		_options.footer.text = this.#_format(_options.footer.text);

		// Error preventing
		if (!_options.description) _options.description = " ";
		if (!_options.author.text) _options.author.text = " ";
		if (!_options.footer.text) _options.footer.text = " ";
		if (!_options.color) _options.color = "Random";

		/// Author
		// if (this.data.author.text) this.data.author.name = _options.author.text;
		if (_options.author.text) this.#_setAuthor(_options.author.text, "name");
		if (_options.author.linkURL) this.#_setAuthor(_options.author.linkURL, "linkURL");
		if ((_options.author.user || _options.author.iconURL) && _options.author.iconURL !== (false || null)) {
			// Get the authorURL() method from within the GuildMember or from the user itself
			let _foo_avatarURL = _options.author?.user?.user?.avatarURL || _options.author?.user?.avatarURL;
			let _avatarURL = _foo_avatarURL({ dynamic: true });

			// prettier-ignore
			try { this.#_setAuthor(_avatarURL, "iconURL"); }
			catch { logger.error("Could not configure embed", `invalid title URL: \`${_avatarURL}\``); }
		}

		// Title
		if (_options.title.text) this.setTitle(_options.title.text);
		// Title URL
		// prettier-ignore
		if (_options.title.linkURL)
			try { this.setURL(_options.title.linkURL); }
			catch { logger.error("Could not configure embed", "invalid_linkURL", `\`${_options.title.linkURL}\``); }

		// Image URL
		// prettier-ignore
		if (_options.imageURL)
			try { this.setImage(_options.imageURL); }
			catch { logger.error("Could not configure embed", "invalid_imageURL", `\`${_options.imageURL}\``); }

		// Image thumbnail URL
		// prettier-ignore
		if (_options.thumbnailURL)
			try { this.setThumbnail(_options.thumbnailURL); }
			catch { logger.error("Could not configure embed", "invalid_thumbnailURL", `\`${_options.thumbnailURL}\``); }

		// Description
		if (_options.description) this.setDescription(_options.description);

		/// Footer
		if (_options.footer.text) this.#_setFooter(_options.footer.text, "text");
		if (_options.footer.iconURL) this.#_setFooter(_options.footer.iconURL, "iconURL");

		// Color
		// prettier-ignore
		if (_options.color)
			try { this.setColor(_options.color); }
			catch { logger.error("Could not configure embed", "invalid_color", `\`${_options.color}\``); }

		// Timestamp
		if (_options.showTimestamp) this.setTimestamp();
	}

	#_format(str) {
		return str
			.replace(/\$USER/g, this.data.author?.user)
			.replace(/\$USERNAME/g, this.data.author?.user?.displayName || this.data.author?.user?.username);
	}

	/** @param {string} update @param {"name"|"linkURL"|"iconURL"} type */
	#_setAuthor(update, type) {
		// prettier-ignore
		switch (type) {
			case "name": return this.setAuthor({ name: update, url: this.data.author.url, iconURL: this.data.author.icon_url });

			case "linkURL":
				try { return this.setAuthor({ name: this.data.author.name, url: update, iconURL: this.data.author.icon_url }); }
				catch { return logger.error("Could not configure embed", "invalid: author_linkURL", `\`${update}\``); }

			case "iconURL":
				try { return this.setAuthor({ name: this.data.author.name, url: this.data.author.url, iconURL: update }); }
				catch { return logger.error("Could not configure embed", "invalid: author_iconURL", `\`${update}\``); }

			default: throw new Error(`\`${type}\` is not a valid setAuthorType`);
		}
	}

	/** @param {string} update @param {"text"|"iconURL"} type */
	#_setFooter(update, type) {
		// prettier-ignore
		switch (type) {
			case "text": return this.setFooter({ text: update, iconURL: this.data.footer.icon_url });

			case "iconURL":
				try { return this.setFooter({ text: update, iconURL: this.data.footer.icon_url }); }
				catch { logger.error("Could not configure embed", "invalid: footer_iconURL", `\`${update}\``); }
		}
	}

	/** Send a confirmation message and await the user's response
	 * @param {bE_options} options */
	constructor(options) {
		super();

		// prettier-ignore
		this.options = {
			interaction: null,
			author: { user: null, text: "", iconURL: "", linkURL: "" },
            title: { text: "", linkURL: "" }, footer: { text: "", iconURL: "" },
            description: "", imageURL: "", thumbnailURL: "",
            color: config.EMBED_COLOR || null,
            showTimestamp: false, ...options
		};

		this.#_configure();
	}

	/** Send the embed using the interaction or channel
	 * @param {bE_sendOptions} options */
	async send(options) {
		// prettier-ignore
		options = {
			channel: null,
			messageContent: "", components: [],
			sendMethod: "reply", ephemeral: false, deleteAfter: 0,
			...this.options, ...options
		};

		this.#_configure(options);
		options.messageContent = this.#_format(options.messageContent);
		options.deleteAfter = _jsT.parseTime(options.deleteAfter);
	}
}

console.log(new BetterEmbed());

module.exports = BetterEmbed;
