/** @typedef bE_options
 * Title/description formatting shorthand:
 *
 * • $USER :: author's mention
 *
 * • $USERNAME :: author's display/user name
 * @property {CommandInteraction} interaction
 * @property {{user:GuildMember|User, text:string, iconURL:string, linkURL: string}} author
 * @property {{text:string, linkURL:string}} title
 * @property {{text:string, linkURL:string}} footer
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
 * @property {{text:string, linkURL:string}} footer
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
            title: { text: "", linkURL: "" }, footer: { text: "", linkURL: "" },
            description: "", imageURL: "", thumbnailURL: "",
            color: config.EMBED_COLOR || null,
            showTimestamp: false, ...options
		};

		this.#configure();
	}

	#configure() {
		/// Apply shorthand formatting
		this.data.description = this.#format(this.options.description);
		this.data.author.name = this.#format(this.options.author.text);
		this.data.title = this.#format(this.options.title.text);
		this.data.footer.text = this.#format(this.options.footer.text);

		/// Author
		if (this.data.author.text) this.data.author.name = this.options.author.text;
		if (this.data.author.linkURL) this.data.author.url = this.options.author.linkURL;
		/* if ((this.options.author.user || this.options.author.iconURL) && this.options.author.iconURL !== (false || null)) {
			// Get the authorURL() method from within the GuildMember or from the user itself
			let _userAvatarURL = this.options.author?.user?.user?.avatarURL || this.options.author?.user?.avatarURL;
			this.data.author.icon_url = _userAvatarURL({ dynamic: true });
		} */

		if ((this.options.author.user || this.options.author.iconURL) && this.options.author.iconURL !== (false || null)) {
			// Get the authorURL() method from within the GuildMember or from the user itself
			let _foo_avatarURL = this.options.author?.user?.user?.avatarURL || this.options.author?.user?.avatarURL;
			let _avatarURL = _foo_avatarURL({ dynamic: true });

			// prettier-ignore
			try { this.setAuthor({ iconURL: _avatarURL }); }
			catch { logger.error("Could not configure embed", `invalid title URL: \`${_avatarURL}\``); }
		}

		// Title
		if (this.options.title.text) this.setTitle(this.options.title.text);
		// Title URL
		// prettier-ignore
		if (this.options.title.linkURL)
			try { this.setURL(this.options.title.linkURL); }
			catch { logger.error("Could not configure embed", `invalid title URL: \`${this.options.title.linkURL}\``); }

		// Image URL
		// prettier-ignore
		if (this.options.imageURL)
			try { this.setImage(this.options.imageURL); }
			catch { logger.error("Could not configure embed", `invalid image URL: \`${this.options.imageURL}\``); }

		// Image thumbnail URL
		// prettier-ignore
		if (this.options.thumbnailURL)
			try { this.setThumbnail(this.options.thumbnailURL); }
			catch { logger.error("Could not configure embed", `invalid thumbnail URL: \`${this.options.thumbnailURL}\``); }

		// Description
		if (this.options.description) this.data.description = this.options.description;
	}

	#format(str) {
		return str
			.replace(/\$USER/g, this.data.author.user)
			.replace(/\$USERNAME/g, this.data.author.user?.displayName || this.data.author.user?.username);
	}
}

new BetterEmbed();

module.exports = BetterEmbed;
