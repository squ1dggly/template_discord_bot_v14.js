/** @typedef bE_options
 * Title/description formatting shorthand:
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
 * Title/description formatting shorthand:
 *
 * • $USER :: author's mention
 *
 * • $USERNAME :: author's display/user name
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
 * @property {boolean} ephemeral */

const config = require("./_dsT_config.json");

const { Message, CommandInteraction, User, GuildMember, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const _jsT = require("../jsTools/_jsT");

class BetterEmbed extends EmbedBuilder {
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

	#_configure() {
		/// Apply shorthand formatting
		this.data.description = this.#_format(this.options.description);
		this.data.author.name = this.#_format(this.options.author.text);
		this.data.title = this.#_format(this.options.title.text);
		this.data.footer.text = this.#_format(this.options.footer.text);

		/// Author
		// if (this.data.author.text) this.data.author.name = this.options.author.text;
		if (this.data.author.text) this.#_setAuthor(this.options.author.text, "name");
		if (this.data.author.linkURL) this.#_setAuthor(this.options.author.linkURL, "linkURL");
		if ((this.options.author.user || this.options.author.iconURL) && this.options.author.iconURL !== (false || null)) {
			// Get the authorURL() method from within the GuildMember or from the user itself
			let _foo_avatarURL = this.options.author?.user?.user?.avatarURL || this.options.author?.user?.avatarURL;
			let _avatarURL = _foo_avatarURL({ dynamic: true });

			// prettier-ignore
			try { this.#_setAuthor(_avatarURL, "iconURL"); }
			catch { logger.error("Could not configure embed", `invalid title URL: \`${_avatarURL}\``); }
		}

		// Title
		if (this.options.title.text) this.setTitle(this.options.title.text);
		// Title URL
		// prettier-ignore
		if (this.options.title.linkURL)
			try { this.setURL(this.options.title.linkURL); }
			catch { logger.error("Could not configure embed", "invalid_linkURL", `\`${this.options.title.linkURL}\``); }

		// Image URL
		// prettier-ignore
		if (this.options.imageURL)
			try { this.setImage(this.options.imageURL); }
			catch { logger.error("Could not configure embed", "invalid_imageURL", `\`${this.options.imageURL}\``); }

		// Image thumbnail URL
		// prettier-ignore
		if (this.options.thumbnailURL)
			try { this.setThumbnail(this.options.thumbnailURL); }
			catch { logger.error("Could not configure embed", "invalid_thumbnailURL", `\`${this.options.thumbnailURL}\``); }

		// Description
		if (this.options.description) this.setDescription(this.options.description);

		/// Footer
		if (this.options.footer.text) this.#_setFooter(this.options.footer.text, "text");
		if (this.options.footer.iconURL) this.#_setFooter(this.options.footer.iconURL, "iconURL");
	}

	#_format(str) {
		return str
			.replace(/\$USER/g, this.data.author.user)
			.replace(/\$USERNAME/g, this.data.author.user?.displayName || this.data.author.user?.username);
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
}

new BetterEmbed();

module.exports = BetterEmbed;
