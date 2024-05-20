/** @typedef aC_options
 * @property {User|User[]|GuildMember|GuildMember[]} userAccess The users that will be able to interact with the message.
 * @property {string} text The text that will either be sent with the embed, or is the confirmation message itself.
 * @property {BetterEmbed.bE_options} embed The configuration of the embed. Utilizes `BetterEmbed`.
 * @property {boolean} dontEmbed Send a message instead of an embed.
 * @property {boolean} deleteOnConfirm Delete the message after the `confirm` button is pressed. Defaults to `true`.
 * @property {boolean} deleteOnCancel Delete the message after the `cancel` button is pressed. Defaults to `true`.
 * @property {string|number} timeout How long to wait before timing out. Defaults to `15` seconds.
 *
 * This utilizes `jsTools.parseTime()`, letting you also use "10s", "1m", or "1m 30s" for example.
 * @property {import("discord.js").MessageMentionOptions} allowedMentions The allowed mentions of the message.
 * @property {import("./dT_dynaSend").SendMethod} sendMethod The method to send the embed. */

// prettier-ignore
const { User, GuildMember, CommandInteraction, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

const BetterEmbed = require("./dT_betterEmbed");
const dynaSend = require("./dT_dynaSend");
const logger = require("../logger");
const jt = require("../jsTools");

const config = require("./dT_config.json");

/** Send a confirmation message and await the user's response.

 * This function utilizes `BetterEmbed`.
 * @param {CommandInteraction|import("discord.js").Channel|Message} handler ***REQUIRED*** to send the message.
 *
 * The type of handler depends on the `SendMethod` you choose to use.
 *
 * **1.** `CommandInteraction` is required for `Interaction` based `SendMethods`.
 *
 * **2.** `Channel` is required for the "sendToChannel" `SendMethod`.
 *
 * **3.** `Message` is required for `Message` based `SendMethods`.
 * @param {aC_options} options
 * @returns {Promise<boolean>} */
async function awaitConfirm(handler, options) {
	options = {
		userAccess: [],
		text: "",
		embed: {},
		dontEmbed: false,
		deleteOnConfirm: true,
		deleteOnCancel: true,
		allowedMentions: {},
		sendMethod: "reply",
		timeout: config.timeouts.CONFIRMATION,
		...options
	};

	// Force users to be an array
	options.userAccess = jt.forceArray(options.userAccess);

	// Parse timeout
	options.timeout = jt.parseTime(options.timeout);

	/* - - - - - { Error Checking } - - - - - */
	if (!options.userAccess?.length) throw new Error("[AwaitConfirm]: 'users' must be provided to handle the interaction.");

	if (!options.text && !Object.keys(options.embed).length)
		throw new Error("[AwaitConfirm]: you must either provide 'text' or 'embed' to send the message.");

	if (options.timeout < 1000) logger.debug("[AwaitConfirm]: 'timeout' is less than 1 second; Is this intentional?");

	/* - - - - - { Configure the Embed } - - - - - */
	let embed = null;

	// Create the embed, if embedConfig is provided
	if (Object.keys(options.embed).length) embed = new BetterEmbed(options.embed);

	/* - - - - - { Create the Confirmation Message } - - - - - */
	let buttons = {
		confirm: new ButtonBuilder({ label: "Confirm", style: ButtonStyle.Success, custom_id: "btn_confirm" }),
		cancel: new ButtonBuilder({ label: "Cancel", style: ButtonStyle.Danger, custom_id: "btn_cancel" })
	};

	let ar_confirmation = new ActionRowBuilder().addComponents(buttons.confirm, buttons.cancel);

	/* - - - - - { Send the Confirmation Message } - - - - - */
	let message = null;

	if (embed) {
		// Send the embed using BetterEmbed
		message = await embed.send(handler, {
			content: options.text,
			allowedMentions: options.allowedMentions,
			components: ar_confirmation
		});
	} else {
		// Send the message using DynaSend
		message = await dynaSend({
			interaction: handler instanceof CommandInteraction ? handler : null,
			channel: handler instanceof BaseChannel ? handler : null,
			message: handler instanceof Message ? handler : null,

			content: options.text,
			allowedMentions: options.allowedMentions,
			components: ar_confirmation
		});
	}

	/* - - - - - { Collect Interactions } - - - - - */
	return new Promise(async resolve => {
		const cleanUp = async confirmed => {
			const _edit = async () => {
				// Remove the confirmation action row from the message
				message.components.splice(1);

				// prettier-ignore
				// Edit the confirmation message
				return await message.edit({
					content: options.text ? "" : message.content,
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

			if (!options.userAccess.find(u => u.id === i.user.id)) return false;
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
