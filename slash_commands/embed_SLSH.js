// prettier-ignore
const {
	Client, Message, CommandInteraction, InteractionCollector,
	SlashCommandBuilder, ModalBuilder, TextInputBuilder,
	ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder,
	ButtonStyle, ComponentType, TextInputStyle,
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
			embedContent: new ButtonBuilder().setLabel("Embed Content").setStyle(ButtonStyle.Secondary).setCustomId("btn_embedContent"),
			embedDetails: new ButtonBuilder().setLabel("Embed Details").setStyle(ButtonStyle.Secondary).setCustomId("btn_embedDetails"),
			timestamp: new ButtonBuilder().setLabel("Timestamp").setStyle(ButtonStyle.Primary).setCustomId("btn_timestamp"),

			/// Submit
			confirm: new ButtonBuilder().setLabel("Confirm").setStyle(ButtonStyle.Success).setCustomId("btn_confirm"),
			cancel: new ButtonBuilder().setLabel("Cancel").setStyle(ButtonStyle.Danger).setCustomId("btn_cancel")
		};

		// Create the embed's ActionRow
		let embed_actionRows = {
			edit: new ActionRowBuilder().addComponents(
				message_components.message,
				message_components.embedContent,
				message_components.embedDetails,
				message_components.timestamp
			),

			submit: new ActionRowBuilder().addComponents(message_components.confirm, message_components.cancel)
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
					.setCustomId("mti_authorName")
					.setLabel("Author:")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).author?.name || "")
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
					.setCustomId("mti_titleURL")
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
		let message = await embed.send({ components: [embed_actionRows.edit, embed_actionRows.submit] });

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
				case "btn_edit":
					// Set the modal's components
					modal_embedMaker.setComponents(...modal_actionRow);

					// Show the modal and await submit
					let modalData_edit = await showModal(i, modal_embedMaker, collector);
					if (!modalData_edit) return;

					/* - - - - - { Parse Modal Data } - - - - - */
					data.messageContent = modalData_edit.fields.getTextInputValue("mti_messageContent") || "";
					data.embed.author.name = modalData_edit.fields.getTextInputValue("mti_authorName") || "";
					data.embed.author.iconURL = modalData_edit.fields.getTextInputValue("mti_authorIconURL") || "";
					data.embed.description = modalData_edit.fields.getTextInputValue("mti_description") || "";
					data.embed.imageURL = modalData_edit.fields.getTextInputValue("mti_imageURL") || "";
					formatCustomizedData(data);

					/// Update the modal's text fields to show the updated information
					modal_components[0].setValue(data.messageContent);
					modal_components[1].setValue(data.embed.author.name);
					modal_components[2].setValue(data.embed.author.iconURL);
					modal_components[3].setValue(data.embed.description);
					modal_components[4].setValue(data.embed.imageURL);

					/// Update the embed
					if (data.embed.author.name) embed.setAuthor({ name: data.embed.author.name });

					// prettier-ignore
					if (data.embed.author.iconURL) try {
						embed.setAuthor({ iconURL: data.embed.author.iconURL });
					} catch {
						await i.followUp({ content: `An invalid author icon URL was provided`, ephemeral: true });
						modal_components[2].setValue("");
					}

					if (data.embed.description) embed.setDescription(data.embed.description);

					if (data.embed.imageURL)
						try {
							embed.setImage(data.embed.imageURL);
						} catch {
							await i.followUp({ content: `An invalid image URL was provided`, ephemeral: true });
							modal_components[4].setValue("");
						}

					return await refreshEmbed(message, embed, data);

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
					template.author.name = modalData_embedContent.fields.getTextInputValue("mti_authorName") || "";
					template.description = modalData_embedContent.fields.getTextInputValue("mti_description") || "";
					template.imageURL = modalData_embedContent.fields.getTextInputValue("mti_imageURL") || "";
					formatTemplate(template, interaction.member);

					// Update the modal's text fields to reflect the updated information
					modal_components.embedContent[0].setValue(template.author.name);
					modal_components.embedContent[1].setValue(template.description);
					modal_components.embedContent[2].setValue(template.imageURL);

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
					template.title = modalData_embedDetails.fields.getTextInputValue("mti_titleURL") || "";
					template.color = modalData_embedDetails.fields.getTextInputValue("mti_color") || "";
					formatTemplate(template, interaction.member);

					// Update the modal's text fields to reflect the updated information
					modal_components.embedDetails[0].setValue(template.author.iconURL);
					modal_components.embedDetails[1].setValue(template.title);
					modal_components.embedDetails[2].setValue(template.color);

					applyEmbedTemplate(embed, template);
					return await refreshEmbed(message, embed, template);

				case "btn_timestamp":
					await i.deferUpdate();

					template.showTimestamp = !template.showTimestamp;

					applyEmbedTemplate(embed, template);
					return await refreshEmbed(message, embed, template);

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
	if (template.author?.name) template.author.name = parse(template.author.name);
	if (template.title?.text) template.title.text = parse(template.title.text);
	if (template.description) template.description = parse(template.description);
	if (template.footer) template.footer = parse(template.footer);

	return template;
}

function applyEmbedTemplate(embed, template) {
	/// Author
	embed.setAuthor({ text: template.author?.name || null, iconURL: template.author?.iconURL || null });

	/// Title
	embed.setTitle({ text: template.title?.text || null, linkURL: template.title?.url || null });

	// Description
	embed.setDescription(template.description);

	// Footer
	embed.setFooter(template.footer);

	// Timestamp
	embed.setTimestamp();

	// Color
	embed.setColor(template.color);

	if (!template.author?.name && !template.title?.text && !template.description && !template.imageURL)
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
