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

class BetterEmbed {
	#embed = new EmbedBuilder();

	/** Send a confirmation message and await the user's response
	 * @param {bE_options} options */
	constructor(options) {
		// prettier-ignore
		this.data = {
			interaction: null,
			author: { user: null, text: "", iconURL: "", linkURL: "" },
            title: { text: "", linkURL: "" }, footer: { text: "", linkURL: "" },
            description: "", imageURL: "", thumbnailURL: "",
            color: config.EMBED_COLOR || null,
            showTimestamp: false, ...options
		};
	}

	#configure() {
		let _embed = this.#embed;

		/// Apply shorthand formatting
		this.data.description = this.#format(this.data.description);
		this.data.author.text = this.#format(this.data.author.text);
		this.data.title.text = this.#format(this.data.title.text);
		this.data.footer.text = this.#format(this.data.footer.text);

		// Author
		// prettier-ignore
		if (this.data.author.text) _embed.setAuthor({
			name: this.data.author.text,
			url: _embed.data.author.icon_url
		});

		// Title
		if (this.data.title.text) _embed.setTitle(this.data.title.text);
		// Title URL
		if (this.data.title.linkURL) _embed.setURL(this.data.title.linkURL);

		// Image
		if (this.data.imageURL) _embed.setImage(this.data.imageURL);
	}

	#format(str) {
		return str
			.replace(/\$USER/g, this.data.author.user)
			.replace(/\$USERNAME/g, this.data.author.user?.displayName || this.data.author.user?.username);
	}
}

new BetterEmbed();
embed.options.embed.module.exports = BetterEmbed;
