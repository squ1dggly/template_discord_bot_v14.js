/** @typedef aC_options
 * @property {GuildMember|User} user must be provided if `CommandInteraction` isn't used
 * @property {CommandInteraction} interaction
 * @property {TextChannel } channel
 * @property {Message} message used with the `replyTo` `sendMethod`
 * @property {import("./dT_betterEmbed").bE_author} author
 * @property {import("./dT_betterEmbed").bE_title} title
 * @property {import("./dT_betterEmbed").bE_thumbnailURL} thumbnailURL
 * @property {import("./dT_betterEmbed").bE_description} description
 * @property {string} imageURL
 * @property {import("./dT_betterEmbed").bE_footer} footer
 * @property {import("./dT_betterEmbed").bE_color} color
 * @property {import("./dT_betterEmbed").bE_timestamp} timestamp
 * @property {boolean} disableFormatting

 * @property {string} messageContent either is sent with the embed, or is the confirmation message itself
 * @property {ActionRowBuilder|ActionRowBuilder[]} components
 * @property {import("discord.js/typings").MessageMentionOptions} allowedMentions
 * @property {"reply"|"editReply"|"followUp"|"channel"|"replyTo"} sendMethod if `reply` fails, `editReply` will be used **|** `reply` is default
 * @property {boolean} ephemeral

 * @property {boolean} dontEmbed send a message instead of an embed
 * @property {boolean} useAuthorForTitle use `setAuthor()` instead of `setTitle()` **|** *this only applies if a `title` or `author` isn't provided*
 * @property {boolean} deleteAfter delete the message after the `confirm` or `cancel` button is pressed
 * @property {string|number} timeout */

// prettier-ignore
const {
    User, GuildMember, CommandInteraction, TextChannel, Message,
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType
} = require("discord.js");

const BetterEmbed = require("./dT_betterEmbed");
const dynaSend = require("./dT_dynaSend");
const logger = require("../logger");
const jt = require("../jsTools");

const config = require("./dT_config.json");

/** Send a confirmation message and await the user's response
 * - **`$USER`** :: *author's mention*
 *
 * - **`$USERNAME`** :: *author's display/user name*
 *
 * This function utilizes **BetterEmbed**
 * @param {aC_options} options */
async function awaitConfirm(options) {
	options = {
		user: null,
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
		disableFormatting: false,

		messageContent: "",
		components: [],
		allowedMentions: {},
		sendMethod: "reply",
		ephemeral: false,

		dontEmbed: false,
		useAuthorForTitle: false,
		deleteAfter: true,
		timeout: jt.parseTime(config.timeouts.CONFIRMATION),
		...options
	};

	/* - - - - - { Parse Options } - - - - - */
	options.timeout = jt.parseTime(options.timeout);

	/// Pre-determine the SendMethod
	if (options.interaction) options.sendMethod ||= "reply";
	else if (options.channel) options.sendMethod ||= "channel";
	else if (options.message) options.sendMethod ||= "replyTo";

	/* - - - - - { Error Checking } - - - - - */
	if (!options.interaction && !options.channel) throw new Error("You must provide either a CommandInteraction or Channel");

	// prettier-ignore
	if (!options.user && (options.channel || options.message)) 
		throw new Error( "You must provide the user to collect button interactions since a CommandInteraction wasn't provided");

	if (options.sendMethod === ("reply" || "editReply" || "followUp") && options.channel)
		throw new Error("The chosen SendMethod cannot be used when a Channel is provided");

	if (options.sendMethod !== "replyTo" && options.message)
		throw new Error("The chosen SendMethod cannot be used when a Message is provided");

	if (options.sendMethod === "replyTo" && !options.message)
		throw new Error("You must provide a Message to use the 'replyTo' SendMethod");

	if (options.sendMethod === ("replyTo" || "channel") && options.ephemeral)
		logger.debug("Ephemeral can only be used with interaction based SendMethods (except 'editReply')");

	if (options.timeout > 1000) logger.debug("dT_awaitConfirm timeout is less than 1 second; Is this intentional?");

	/* - - - - - { Create the Confirmation Message } - - - - - */
	/** @type {Message|null} */
	let message = null;

	if (options.dontEmbed) {
		// prettier-ignore
		message = dynaSend({
            interaction: options.interaction, channel: options.channel, message: options.message,
            messageContent: config.CONFIRMATION_TITLE || options.messageContent,
            components: [actionRow, ...options.components],
            ephemeral: options.ephemeral
        });
	} else {
		// prettier-ignore
		let _title = options.useAuthorForTitle && !options.title && !options.author
        ? { author: config.CONFIRMATION_TITLE }
        : { title: config.CONFIRMATION_TITLE };

		// Create the embed :: { CONFIRM }
		let embed_confirm = new BetterEmbed({ ..._title, ...options });

		// Create the buttons
		let buttons = {
			confirm: new ButtonBuilder({ label: "Confirm", style: ButtonStyle.Success, custom_id: "btn_confirm" }),
			cancel: new ButtonBuilder({ label: "Cancel", style: ButtonStyle.Danger, custom_id: "btn_cancel" })
		};

		// Create the action row
		let actionRow = new ActionRowBuilder().addComponents(...Object.values(buttons));

		// prettier-ignore
		// Send the confirmation message
		message = await embed_confirm.send({
            messageContent: options.messageContent,
            sendMethod: options.sendMethod, allowedMentions: options.allowedMentions, ephemeral: options.ephemeral,
            components: [actionRow, ...options.components]
        });
	}

	// Wait for the user's decision, or timeout
	return new Promise(async resolve => {
		const cleanUp = async () => {
			// Delete the confirmation message
			if (options.deleteAfter && message.deletable) return await message.delete().catch(() => null);
			// Edit the confirmation message
			else if (!options.deleteAfter && message.editable) {
				// Remove the confirmation action row from the message
				message.components.splice(1);

				// prettier-ignore
				// Edit the confirmation message
				return await message.edit({
                    // Clears content if dontEmbed was used, or if content was provided
					content: options.dontEmbed ? "" : options.content ? "" : message.content,
					components: message.components
				}).catch(() => null);
			}
		};

		// Create the component filter
		const filter = async i => {
			await i.deferUpdate().catch(() => null);

			if (!i.user.id === (options.interaction?.user?.id || options.user?.id)) return false;
			if (!i.componentType === ComponentType.Button) return false;
			if (!i.customId !== ("btn_confirm" || "btn_cancel")) return false;
			return true;
		};

		// prettier-ignore
		message.awaitMessageComponent({ filter, time: options.timeout })
            .then(async i => {
                await cleanUp();
                // Return whether the user pressed the confirm button
				resolve(i.customId === "btn_confirm");
            })
            .catch(async i => {
                await cleanUp();
                return resolve(false);
            });
	});
}

module.exports = awaitConfirm;
