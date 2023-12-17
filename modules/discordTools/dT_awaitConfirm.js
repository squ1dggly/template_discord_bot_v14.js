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
 * @property {import("./dT_dynaSend").SendMethod} sendMethod if `reply` fails, `editReply` will be used **|** `reply` is default
 * @property {boolean} ephemeral

 * @property {boolean} dontEmbed send a message instead of an embed
 * @property {boolean} useAuthorForTitle use `setAuthor()` instead of `setTitle()` **|** *this only applies if a `title` or `author` isn't provided*
 * @property {boolean} deleteOnConfirm delete the message after the `confirm` button is pressed
 * @property {boolean} deleteOnCancel delete the message after the `cancel` button is pressed
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
		sendMethod: "",
		ephemeral: false,

		dontEmbed: false,
		useAuthorForTitle: false,
		deleteOnConfirm: false,
		deleteOnCancel: true,
		timeout: jt.parseTime(config.timeouts.CONFIRMATION),
		...options
	};

	/* - - - - - { Parse Options } - - - - - */
	options.timeout = jt.parseTime(options.timeout);

	// Pre-determine the SendMethod
	if (options.message) options.sendMethod ||= "replyTo";
	else options.sendMethod ||= "reply";

	/* - - - - - { Error Checking } - - - - - */
	if (!options.user && (options.channel || options.message))
		throw new Error("You must provide a User for collecting interactions if a CommandInteraction isn't provided");

	if (options.timeout < 1000) logger.debug("dT_awaitConfirm timeout is less than 1 second; Is this intentional?");

	/* - - - - - { Create the Confirmation Message } - - - - - */
	// Create the buttons
	let buttons = {
		confirm: new ButtonBuilder({ label: "Confirm", style: ButtonStyle.Success, custom_id: "btn_confirm" }),
		cancel: new ButtonBuilder({ label: "Cancel", style: ButtonStyle.Danger, custom_id: "btn_cancel" })
	};

	// Create the action row
	let actionRow = new ActionRowBuilder().addComponents(...Object.values(buttons));

	/** @type {Message|null} */
	let message = null;

	if (options.dontEmbed) {
		// prettier-ignore
		message = await dynaSend({
            interaction: options.interaction, channel: options.channel, message: options.message,
            messageContent: options.messageContent || config.CONFIRMATION_TITLE,
			components: [actionRow, ...options.components],
			sendMethod: options.sendMethod,
            ephemeral: options.ephemeral
        });
	} else {
		// prettier-ignore
		let _title = options.useAuthorForTitle && !options.title && !options.author
        ? { author: config.CONFIRMATION_TITLE }
        : { title: config.CONFIRMATION_TITLE };

		// Create the embed :: { CONFIRM }
		let embed_confirm = new BetterEmbed({ ..._title, ...options });

		// Send the confirmation message
		message = await embed_confirm.send({
			messageContent: options.messageContent,
			sendMethod: options.sendMethod,
			allowedMentions: options.allowedMentions,
			components: [actionRow, ...options.components],
			ephemeral: options.ephemeral
		});
	}

	// Wait for the user's decision, or timeout
	return new Promise(async resolve => {
		const cleanUp = async confirmed => {
			const _edit = async () => {
				// Remove the confirmation action row from the message
				message.components.splice(1);

				// prettier-ignore
				// Edit the confirmation message
				return await message.edit({
					// clears content if dontEmbed was used, or if messageContent was provided
					content: options.dontEmbed ? "" : options.content ? "" : message.content,
					components: message.components
				}).catch(() => null);
			};

			switch (confirmed) {
				case true:
					// Delete the confirmation message
					if (options.deleteOnConfirm && message.deletable) return await message.delete().catch(() => null);
					// Edit the confirmation message
					if (!options.deleteOnConfirm && message.editable) return await _edit();
					return;

				case false:
					// Delete the confirmation message
					if (options.deleteOnCancel && message.deletable) return await message.delete().catch(() => null);
					// Edit the confirmation message
					if (!options.deleteOnCancel && message.editable) return await _edit();
					return;
			}
		};

		// Create the component filter
		const filter = async i => {
			await i.deferUpdate().catch(() => null);

			if (i.user.id !== (options.interaction?.user?.id || options.user?.id)) return false;
			if (i.componentType !== ComponentType.Button) return false;
			if (![buttons.confirm.data.custom_id, buttons.cancel.data.custom_id].includes(i.customId)) return false;
			return true;
		};

		// prettier-ignore
		message.awaitMessageComponent({ filter, time: options.timeout })
            .then(async i => {
                await cleanUp(i.customId === buttons.confirm.data.custom_id);
                // Return whether the user pressed the confirm button
				resolve(i.customId === buttons.confirm.data.custom_id);
            })
            .catch(async i => {
                await cleanUp(false);
                return resolve(false);
            });
	});
}

module.exports = awaitConfirm;
