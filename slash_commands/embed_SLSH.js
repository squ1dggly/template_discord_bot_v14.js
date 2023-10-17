// prettier-ignore
const {
	Client, Message, CommandInteraction, InteractionCollector,
	SlashCommandBuilder, ModalBuilder, TextInputBuilder,
	ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder,
	ButtonStyle, ComponentType, TextInputStyle, StringSelectMenuBuilder,
} = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools/_dsT");
const _jsT = require("../modules/jsTools/_jsT");

const config = require("./embed_config.json");

const timeouts = {
	base: _jsT.parseTime(config.TIMEOUT)
};

module.exports = {
	options: { icon: "📝", deferReply: false, guildAdminOnly: true },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("embed")
        .setDescription("Make a custom embed")
    
        .addStringOption(option => option.setName("template").setDescription("Choose a template to start with")
            .addChoices(...config.templates.filter(temp => temp.meta?.name && temp.meta?.value).map(temp => ({ name: temp.meta.name, value: temp.meta.value })))
        ),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		/* - - - - - { Configure the Template } - - - - - */
		let template_name = interaction.options.getString("template") || "";

		/// Parse the template
		let template = config.init;
		let templateUsed = false;

		// Get the template data if the user selected one
		if (template_name) {
			let _temp = config.templates[template_name];

			if (_temp) {
				template = { ...template, ...(config.templates[template_name] || {}) };
				templateUsed = true;
			}
		}

		// Apply formatting to the template
		formatTemplate(template, interaction.member);

		/* - - - - - { Configure the Embed } - - - - - */
		// Create the base embed :: { CUSTOM EMBED }
		let embed = new BetterEmbed({ interaction });

		// Apply the template to the embed
		applyEmbedTemplate(embed, templateUsed ? template : formatTemplate(config.template_default, interaction.member));

		/* - - - - - { Configure Message Components } - - - - - */
		// prettier-ignore
		// Create the messages components
		let message_components = {
			/// Edit
			message: new ButtonBuilder().setLabel("Message").setStyle(ButtonStyle.Secondary).setCustomId("btn_message"),
			embedContent: new ButtonBuilder().setLabel("Content").setStyle(ButtonStyle.Secondary).setCustomId("btn_embedContent"),
			embedDetails: new ButtonBuilder().setLabel("Details").setStyle(ButtonStyle.Secondary).setCustomId("btn_embedDetails"),
			fieldMode_toggle: new ButtonBuilder().setLabel("Fields").setStyle(ButtonStyle.Primary).setCustomId("btn_fieldMode_toggle"),
			timestamp: new ButtonBuilder().setLabel("Timestamp").setStyle(ButtonStyle.Primary).setCustomId("btn_timestamp"),

			/// Field Edit Mode
			fieldMode_selectMenu: new StringSelectMenuBuilder().setOptions({label: "deez nuts", value: "defr"}).setPlaceholder("Select a field to edit...").setCustomId("ssm_fieldSelect"),

			fieldMode_back: new ButtonBuilder().setLabel("Back").setStyle(ButtonStyle.Primary).setCustomId("btn_fieldMode_back"),
			fieldMode_add: new ButtonBuilder().setLabel("Add").setStyle(ButtonStyle.Secondary).setCustomId("btn_fieldMode_add"),
			fieldMode_remove: new ButtonBuilder().setLabel("Remove").setStyle(ButtonStyle.Secondary).setCustomId("btn_fieldMode_remove"),
			fieldMode_edit: new ButtonBuilder().setLabel("Edit").setStyle(ButtonStyle.Secondary).setCustomId("btn_fieldMode_edit"),

			/// Submit
			confirm: new ButtonBuilder().setLabel("Confirm").setStyle(ButtonStyle.Success).setCustomId("btn_confirm"),
			cancel: new ButtonBuilder().setLabel("Cancel").setStyle(ButtonStyle.Danger).setCustomId("btn_cancel")
		};

		// Create the embed's ActionRow
		let message_actionRow = {
			buttons_edit: new ActionRowBuilder().addComponents(
				message_components.message,
				message_components.embedContent,
				message_components.embedDetails,
				message_components.fieldMode_toggle,
				message_components.timestamp
			),

			buttons_fieldMode: new ActionRowBuilder().addComponents(
				message_components.fieldMode_back,
				message_components.fieldMode_add,
				message_components.fieldMode_remove,
				message_components.fieldMode_edit
			),

			buttons_submit: new ActionRowBuilder().addComponents(message_components.confirm, message_components.cancel),

			selectMenu_fieldMode: new ActionRowBuilder().addComponents(message_components.fieldMode_selectMenu)
		};

		/* - - - - - { Configure the Modal } - - - - - */

		// Create the modal
		let modal_embedMaker = new ModalBuilder().setCustomId("modal_embedMaker").setTitle("Embed Maker");

		// Create the modal's components
		let modal_components = {
			message: [
				new TextInputBuilder()
					.setCustomId("mti_messageContent")
					.setLabel("Message content (outside the embed):")
					.setStyle(TextInputStyle.Paragraph)
					.setValue((templateUsed ? template : config.init).messageContent || "")
					.setMaxLength(2000)
					.setRequired(false)
			],

			embedContent: [
				new TextInputBuilder()
					.setCustomId("mti_authorText")
					.setLabel("Author:")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).author?.text || "")
					.setMaxLength(256)
					.setRequired(false),

				new TextInputBuilder()
					.setCustomId("mti_titleText")
					.setLabel("Title:")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).title?.text || "")
					.setMaxLength(256)
					.setRequired(false),

				new TextInputBuilder()
					.setCustomId("mti_description")
					.setLabel("Description:")
					.setStyle(TextInputStyle.Paragraph)
					.setValue((templateUsed ? template : config.init).description || "")
					.setMaxLength(4000)
					.setRequired(false),

				new TextInputBuilder()
					.setCustomId("mti_imageURL")
					.setLabel("Image URL:")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).imageURL || "")
					.setRequired(false)
			],

			embedDetails: [
				new TextInputBuilder()
					.setCustomId("mti_authorIconURL")
					.setLabel("Author icon URL:")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).author?.iconURL || "")
					.setRequired(false),

				new TextInputBuilder()
					.setCustomId("mti_titleLinkURL")
					.setLabel("Title URL (this makes the title into a link):")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).title?.url || "")
					.setRequired(false),

				new TextInputBuilder()
					.setCustomId("mti_color")
					.setLabel("Color:")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).color || "")
					.setRequired(false)
			]
		};

		// Create the modal's ActionRows
		let modal_actionRows = {
			message: modal_components.message.map(comp => new ActionRowBuilder().addComponents(comp)),
			embedContent: modal_components.embedContent.map(comp => new ActionRowBuilder().addComponents(comp)),
			embedDetails: modal_components.embedDetails.map(comp => new ActionRowBuilder().addComponents(comp))
		};

		// let modal_actionRow = modal_components..map(component => new ActionRowBuilder().addComponents(component));

		// Send the base embed
		let message = await embed.send({
			components: [message_actionRow.buttons_edit, message_actionRow.buttons_submit]
		});

		/* - - - - - { Collect Button Interactions } - - - - - */
		// Create a filter to look for only button interactions from the user that ran this command
		let filter = i => {
			let passed = i.componentType === ComponentType.Button && i.user.id === interaction.user.id;

			// prettier-ignore
			// Allow the button to know it was submitted and tell the user they can't use it
			// only if the interaction is from a user that didn't run the command
			if (!passed) try {
                i.deferUpdate().then(async ii =>
                    await i.followUp({ content: `${i.user} that button isn't for you!`, ephemeral: true })
                );
            } catch { }

			return passed;
		};

		// Create a collector to catch interactions | timeout after 10 minutes
		let collector = message.createMessageComponentCollector({ filter, time: timeouts.base });

		// Fires whenever a button is pressed on the connected message
		collector.on("collect", async i => {
			// Reset the collector's timer
			collector.resetTimer();

			// Determine the operation
			switch (i.customId) {
				case "btn_message":
					// Set the modal's components
					modal_embedMaker.setComponents(...modal_actionRows.message);

					// Show the modal and await submit
					let modalData_message = await showModal(i, modal_embedMaker, collector);
					if (!modalData_message) return;

					/* - - - - - { Parse Modal Data } - - - - - */
					template.messageContent = modalData_message.fields.getTextInputValue("mti_messageContent") || "";
					formatTemplate(template, interaction.member);

					// Update the modal's text fields to reflect the updated information
					modal_components.message[0].setValue(template.messageContent);

					applyEmbedTemplate(embed, template);
					return await refreshEmbed(message, embed, template);

				case "btn_embedContent":
					// Set the modal's components
					modal_embedMaker.setComponents(...modal_actionRows.embedContent);

					// Show the modal and await submit
					let modalData_embedContent = await showModal(i, modal_embedMaker, collector);
					if (!modalData_embedContent) return;

					/* - - - - - { Parse Modal Data } - - - - - */
					template.author.text = modalData_embedContent.fields.getTextInputValue("mti_authorText") || "";
					template.title.text = modalData_embedContent.fields.getTextInputValue("mti_titleText") || "";
					template.description = modalData_embedContent.fields.getTextInputValue("mti_description") || "";
					template.imageURL = modalData_embedContent.fields.getTextInputValue("mti_imageURL") || "";
					formatTemplate(template, interaction.member);

					// Update the modal's text fields to reflect the updated information
					modal_components.embedContent[0].setValue(template.author.text);
					modal_components.embedContent[1].setValue(template.title.text);
					modal_components.embedContent[2].setValue(template.description);
					modal_components.embedContent[3].setValue(template.imageURL);

					applyEmbedTemplate(embed, template);
					return await refreshEmbed(message, embed, template);

				case "btn_embedDetails":
					// Set the modal's components
					modal_embedMaker.setComponents(...modal_actionRows.embedDetails);

					// Show the modal and await submit
					let modalData_embedDetails = await showModal(i, modal_embedMaker, collector);
					if (!modalData_embedDetails) return;

					/* - - - - - { Parse Modal Data } - - - - - */
					template.author.iconURL = modalData_embedDetails.fields.getTextInputValue("mti_authorIconURL") || "";
					template.title.linkURL = modalData_embedDetails.fields.getTextInputValue("mti_titleLinkURL") || "";
					template.color = modalData_embedDetails.fields.getTextInputValue("mti_color") || "";
					formatTemplate(template, interaction.member);

					// Update the modal's text fields to reflect the updated information
					modal_components.embedDetails[0].setValue(template.author.iconURL);
					modal_components.embedDetails[1].setValue(template.title.linkURL);
					modal_components.embedDetails[2].setValue(template.color);

					applyEmbedTemplate(embed, template);
					return await refreshEmbed(message, embed, template);

				case "btn_timestamp":
					await i.deferUpdate();

					template.timestamp = !template.timestamp;

					applyEmbedTemplate(embed, template);
					return await refreshEmbed(message, embed, template);

				case "btn_fieldMode_toggle":
					await i.deferUpdate();
					return await message.edit({
						components: [message_actionRow.selectMenu_fieldMode, message_actionRow.buttons_fieldMode]
					});

				case "btn_fieldMode_back":
					await i.deferUpdate();
					return await message.edit({
						components: [message_actionRow.buttons_edit, message_actionRow.buttons_submit]
					});

				case "btn_cancel":
					await i.deferUpdate();
					return collector.stop();
			}
		});

		// Delete the message on timeout
		collector.on("end", async () => {
			// prettier-ignore
			try { await message.delete(); } catch { }
		});
	}
};

function formatTemplate(template, user) {
	if (Array.isArray(template.description)) template.description = template.description.join("\n");

	// prettier-ignore
	const parse = str => `${str}`
		// User mentions
		.replace(/@[0-9]{18}/gm, s => `<@${s.substring(1)}>`)
		// Channel mentions
		.replace(/#[0-9]{19}/gm, s => `<#${s.substring(1)}>`)

		// Self mention
		.replace(/\$USER\b/g, user.toString())
		// Self username
		.replace(/\$USERNAME\b/g, user?.displayName || user?.username || "{invalid user}");

	if (template.messageContent) template.messageContent = parse(template.messageContent);
	if (template.author?.text) template.author.text = parse(template.author.text);
	if (template.title?.text) template.title.text = parse(template.title.text);
	if (template.description) template.description = parse(template.description);
	if (template.footer) template.footer = parse(template.footer);

	return template;
}

function applyEmbedTemplate(embed, template) {
	// Author
	embed.setAuthor({ text: template.author?.text || null, iconURL: template.author?.iconURL || null });

	// Title
	embed.setTitle({ text: template.title?.text || null, linkURL: template.title?.linkURL || null });

	// Description
	embed.setDescription(template.description || null);

	// Footer
	embed.setFooter(template.footer || null);

	// Image URL
	embed.setImage(template.imageURL || null);

	// Timestamp
	embed.setTimestamp(template.timestamp);

	// Color
	embed.setColor(template.color || null);

	// Prevents crashing as embeds cannot be empty
	if (!template.author?.text && !template.title?.text && !template.description && !template.imageURL)
		embed.setDescription("Embeds can't be empty!");

	return embed;
}

/** Wait for the modal to be submitted and return the modal interaction
 * @param {CommandInteraction} interaction @param {ModalBuilder} modal  @param {InteractionCollector} collector */
async function showModal(interaction, modal, collector) {
	try {
		// Reset the modal's customId so canceling doesn't break the next modal submit
		let uniqueID = `modal_embedMaker_${Date.now()}`;
		modal.setCustomId(uniqueID);

		// Show the modal
		await interaction.showModal(modal);

		// Create a filter to look for the correct modal
		let modalSubmit_filter = i => i.customId === uniqueID;

		// Create a collector to catch the modal submit | timeout after 10 minutes
		let modalSubmit = await interaction.awaitModalSubmit({ filter: modalSubmit_filter, time: timeouts.base });

		// Reset the collector's timer
		collector.resetTimer();

		// Close the modal
		await modalSubmit.deferUpdate();

		// Return the modal interaction
		return modalSubmit;
	} catch {
		return null;
	}
}

/** Update the message with the new embed
 * @param {BetterEmbed} embed @param {Message} message */
async function refreshEmbed(message, embed, template) {
	// prettier-ignore
	// Edit the message with the updated embed
	try { await message.edit({ content: template.messageContent, embeds: [embed] }); } catch { }
}
