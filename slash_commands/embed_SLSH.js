// prettier-ignore
const {
	Client, Message, CommandInteraction, InteractionCollector, AttachmentBuilder,
	SlashCommandBuilder, ModalBuilder, TextInputBuilder,
	ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder,
	ButtonStyle, ComponentType, TextInputStyle, StringSelectMenuBuilder
} = require("discord.js");

const { BetterEmbed } = require("../modules/discordTools");
const jt = require("../modules/jsTools");

const config = require("./embed_config.json");

const timeouts = {
	base: jt.parseTime(config.timeouts.BASE),
	channelSelect: jt.parseTime(config.timeouts.CHANNEL_SELECT)
};

module.exports = {
	options: { deferReply: false, guildAdminOnly: true },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("embed")
        .setDescription("Make a custom embed")
    
        .addStringOption(option => option.setName("template").setDescription("Choose a template to start with")
			.addChoices( ...config.templates
				.filter(tmp => tmp?.meta?.name && tmp?.meta?.name)
				.map(tmp => tmp.meta)
			)
        ),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		/* - - - - - { Configure the Template } - - - - - */
		let templateName = interaction.options.getString("template") || "";

		/// Parse the template
		let template = config.init;
		let templateUsed = false;
		let fieldMode_selectedFieldIndex = null;

		// Get the template data if the user selected one
		if (templateName) {
			let _temp = config.templates.find(tmp => tmp?.meta?.value === templateName) || {};

			if (_temp) {
				template = { ...template, ..._temp };
				templateUsed = true;
			}
		}

		// Apply formatting to the template
		template = formatTemplate(client, interaction.member, template);

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
					.setRequired(false),

				new TextInputBuilder()
					.setCustomId("mti_color")
					.setLabel("Embed color:")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).color || "")
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
					.setCustomId("mti_footerText")
					.setLabel("Footer:")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).footer?.text || "")
					.setMaxLength(2048)
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
					.setCustomId("mti_footerIconURL")
					.setLabel("Footer icon URL:")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).title?.iconURL || "")
					.setRequired(false),

				new TextInputBuilder()
					.setCustomId("mti_authorLinkURL")
					.setLabel("Author Link URL:")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).author?.linkURL || "")
					.setRequired(false),

				new TextInputBuilder()
					.setCustomId("mti_titleLinkURL")
					.setLabel("Title Link URL:")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).title?.linkURL || "")
					.setRequired(false),

				new TextInputBuilder()
					.setCustomId("mti_thumbnailURL")
					.setLabel("Thumbnail URL:")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).thumbnailURL || "")
					.setRequired(false)
			],

			fieldEdit: [
				new TextInputBuilder()
					.setCustomId("mti_fieldName")
					.setLabel("Title:")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).author?.text || "")
					.setMaxLength(256)
					.setRequired(false),

				new TextInputBuilder()
					.setCustomId("mti_fieldValue")
					.setLabel("Content:")
					.setStyle(TextInputStyle.Short)
					.setValue((templateUsed ? template : config.init).title?.text || "")
					.setMaxLength(1024)
					.setRequired(false)
			]
		};

		// Create the modal's ActionRows
		let modal_actionRows = {
			message: modal_components.message.map(comp => new ActionRowBuilder().addComponents(comp)),
			embedContent: modal_components.embedContent.map(comp => new ActionRowBuilder().addComponents(comp)),
			embedDetails: modal_components.embedDetails.map(comp => new ActionRowBuilder().addComponents(comp)),
			fieldEdit: modal_components.fieldEdit.map(comp => new ActionRowBuilder().addComponents(comp))
		};

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
			fieldMode_selectMenu: new StringSelectMenuBuilder().setPlaceholder("Select a field to edit...").setCustomId("ssm_fieldSelect"),

			fieldMode_add: new ButtonBuilder().setLabel("Add").setStyle(ButtonStyle.Secondary).setCustomId("btn_fieldMode_add"),
			fieldMode_remove: new ButtonBuilder().setLabel("Remove").setStyle(ButtonStyle.Secondary).setCustomId("btn_fieldMode_remove"),
			fieldMode_edit: new ButtonBuilder().setLabel("Edit").setStyle(ButtonStyle.Secondary).setCustomId("btn_fieldMode_edit"),
			fieldMode_inline: new ButtonBuilder().setLabel("Toggle Inline").setStyle(ButtonStyle.Primary).setCustomId("btn_fieldMode_inline"),
			fieldMode_back: new ButtonBuilder().setLabel("Back").setStyle(ButtonStyle.Primary).setCustomId("btn_fieldMode_back"),

			/// Submit
			toJSON: new ButtonBuilder().setLabel("JSON").setStyle(ButtonStyle.Success).setCustomId("btn_toJSON"),
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
				message_components.fieldMode_add,
				message_components.fieldMode_remove,
				message_components.fieldMode_edit,
				message_components.fieldMode_inline,
				message_components.fieldMode_back
			),

			buttons_submit: new ActionRowBuilder().addComponents(
				message_components.toJSON,
				message_components.confirm,
				message_components.cancel
			),

			selectMenu_fieldMode: new ActionRowBuilder().addComponents(message_components.fieldMode_selectMenu)
		};

		/* - - - - - { Configure the Embed } - - - - - */
		// Create the embed :: { CUSTOM EMBED }
		let embed = new BetterEmbed({ interaction, disableFormatting: true });

		// prettier-ignore
		// Apply the template to the embed
		applyEmbedTemplate(
			embed, message_components,
			templateUsed ? template : formatTemplate(client, interaction.member, config.template_default)
		);

		// Send the embed
		let message = await embed.send({
			components: [message_actionRow.buttons_edit, message_actionRow.buttons_submit]
		});

		/* - - - - - { Collect Interactions } - - - - - */
		// Create a filter to look for interactions from the user that ran this command
		let filter = i => {
			let passed = i.user.id === interaction.user.id;

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

		// Fires whenever an interaction is sent from the connected message
		collector.on("collect", async i => {
			// Reset the collector's timer
			collector.resetTimer();

			// Determine the operation
			switch (i.customId) {
				case "ssm_fieldSelect":
					await i.deferUpdate();

					if (!template?.fields || !template.fields?.length) fieldMode_selectedFieldIndex = null;

					fieldMode_selectedFieldIndex = template.fields.findIndex(option => option.meta === i.values[0]);

					return;

				case "btn_message":
					// Set the modal's components
					modal_embedMaker.setComponents(...modal_actionRows.message);

					// Update the modal's text fields to the current template
					modal_components.message[0].setValue(template.messageContent || "");
					modal_components.embedDetails[1].setValue(template.color || "");

					// Show the modal and await submit
					let modalData_message = await showModal(i, modal_embedMaker, collector);
					if (!modalData_message) return;

					/* - - - - - { Parse Modal Data } - - - - - */
					template.messageContent = modalData_message.fields.getTextInputValue("mti_messageContent") || "";
					template.color = modalData_message.fields.getTextInputValue("mti_color") || "";
					formatTemplate(client, interaction.member, template);

					applyEmbedTemplate(embed, message_components, template);
					return await refreshEmbed(message, embed, template);

				case "btn_embedContent":
					// Set the modal's components
					modal_embedMaker.setComponents(...modal_actionRows.embedContent);

					// Update the modal's text fields to the current template
					modal_components.embedContent[0].setValue(template.author.text || "");
					modal_components.embedContent[1].setValue(template.title.text || "");
					modal_components.embedContent[2].setValue(template.description || "");
					modal_components.embedContent[3].setValue(template.footer.text || "");
					modal_components.embedContent[4].setValue(template.imageURL || "");

					// Show the modal and await submit
					let modalData_embedContent = await showModal(i, modal_embedMaker, collector);
					if (!modalData_embedContent) return;

					/* - - - - - { Parse Modal Data } - - - - - */
					template.author.text = modalData_embedContent.fields.getTextInputValue("mti_authorText") || "";
					template.title.text = modalData_embedContent.fields.getTextInputValue("mti_titleText") || "";
					template.footer.text = modalData_embedContent.fields.getTextInputValue("mti_footerText") || "";
					template.description = modalData_embedContent.fields.getTextInputValue("mti_description") || "";
					template.imageURL = modalData_embedContent.fields.getTextInputValue("mti_imageURL") || "";
					formatTemplate(client, interaction.member, template);

					applyEmbedTemplate(embed, message_components, template);
					return await refreshEmbed(message, embed, template);

				case "btn_embedDetails":
					// Set the modal's components
					modal_embedMaker.setComponents(...modal_actionRows.embedDetails);

					// Update the modal's text fields to the current template
					modal_components.embedDetails[0].setValue(template.author.iconURL || "");
					modal_components.embedDetails[1].setValue(template.footer.iconURL || "");
					modal_components.embedDetails[2].setValue(template.author.linkURL || "");
					modal_components.embedDetails[3].setValue(template.title.linkURL || "");
					modal_components.embedDetails[4].setValue(template.thumbnailURL || "");

					// Show the modal and await submit
					let modalData_embedDetails = await showModal(i, modal_embedMaker, collector);
					if (!modalData_embedDetails) return;

					/* - - - - - { Parse Modal Data } - - - - - */
					template.author.iconURL = modalData_embedDetails.fields.getTextInputValue("mti_authorIconURL") || "";
					template.footer.iconURL = modalData_embedDetails.fields.getTextInputValue("mti_footerIconURL") || "";
					template.author.linkURL = modalData_embedDetails.fields.getTextInputValue("mti_authorLinkURL") || "";
					template.title.linkURL = modalData_embedDetails.fields.getTextInputValue("mti_titleLinkURL") || "";
					template.thumbnailURL = modalData_embedDetails.fields.getTextInputValue("mti_thumbnailURL") || "";
					formatTemplate(client, interaction.member, template);

					applyEmbedTemplate(embed, message_components, template);
					return await refreshEmbed(message, embed, template);

				case "btn_timestamp":
					await i.deferUpdate();

					template.timestamp = !template.timestamp;

					applyEmbedTemplate(embed, message_components, template);
					return await refreshEmbed(message, embed, template);

				case "btn_fieldMode_toggle":
					await i.deferUpdate();

					/// Configure field select menu
					let showSelectMenu = false;
					if (template.fields && template.fields.length) showSelectMenu = true;

					// Configre the respective message components
					let _components_fieldModeToggle = showSelectMenu
						? [message_actionRow.selectMenu_fieldMode, message_actionRow.buttons_fieldMode]
						: [message_actionRow.buttons_fieldMode];

					// Edit the message's components
					message.components = _components_fieldModeToggle;
					return await refreshEmbed(message, embed, template);

				case "btn_fieldMode_back":
					await i.deferUpdate();

					message.components = [message_actionRow.buttons_edit, message_actionRow.buttons_submit];
					return await refreshEmbed(message, embed, template);

				case "btn_fieldMode_add":
					// prettier-ignore
					if (template?.fields && template.fields.length >= 25) return await i.reply({
						content: "You can only have a max of `25` fields", ephemeral: true
					});

					/// Configure the components being used
					modal_components.fieldEdit[0].setValue("");
					modal_components.fieldEdit[1].setValue("");

					// Set the modal's components
					modal_embedMaker.setComponents(...modal_actionRows.fieldEdit);

					// Show the modal and await submit
					let modalData_fieldMode_add = await showModal(i, modal_embedMaker, collector);
					if (!modalData_fieldMode_add) return;

					/* - - - - - { Parse Modal Data } - - - - - */
					template.fields ||= [];
					template.fields.push({
						name: modalData_fieldMode_add.fields.getTextInputValue("mti_fieldName") || "",
						value: modalData_fieldMode_add.fields.getTextInputValue("mti_fieldValue") || "",
						inline: false
					});

					/// Apply changes
					formatTemplate(client, interaction.member, template);
					applyEmbedTemplate(embed, message_components, template);

					// Add the field select menu to the message
					message.components = [message_actionRow.selectMenu_fieldMode, message_actionRow.buttons_fieldMode];

					return await refreshEmbed(message, embed, template);

				case "btn_fieldMode_remove":
					// prettier-ignore
					if (fieldMode_selectedFieldIndex === null) return await i.reply({
						content: "No field was selected to remove", ephemeral: true
					});

					// prettier-ignore
					if (!template.fields[fieldMode_selectedFieldIndex]) return await i.reply({
						content: `\`Field ${fieldMode_selectedFieldIndex || 1}\` doesn't exist and can't be removed`, ephemeral: true
					});

					await i.deferUpdate();

					template.fields.splice(fieldMode_selectedFieldIndex, 1);

					if (!template?.fields || !template.fields?.length)
						message.components = [message_actionRow.buttons_fieldMode];

					applyEmbedTemplate(embed, message_components, template);
					return await refreshEmbed(message, embed, template);

				case "btn_fieldMode_edit":
					// prettier-ignore
					if (fieldMode_selectedFieldIndex === null) return await i.reply({
						content: "No field was selected to edit", ephemeral: true
					});

					let _field_edit = template.fields[fieldMode_selectedFieldIndex];

					// prettier-ignore
					if (!_field_edit) return await i.reply({
						content: `\`Field ${fieldMode_selectedFieldIndex || 1}\` doesn't exist and can't be edited`, ephemeral: true
					});

					/// Configure the components being used
					modal_components.fieldEdit[0].setValue(_field_edit.name || "");
					modal_components.fieldEdit[1].setValue(_field_edit.value || "");

					// Set the modal's components
					modal_embedMaker.setComponents(...modal_actionRows.fieldEdit);

					// Show the modal and await submit
					let modalData_fieldMode_edit = await showModal(i, modal_embedMaker, collector);
					if (!modalData_fieldMode_edit) return;

					/* - - - - - { Parse Modal Data } - - - - - */
					_field_edit.name = modalData_fieldMode_edit.fields.getTextInputValue("mti_fieldName") || "";
					_field_edit.value = modalData_fieldMode_edit.fields.getTextInputValue("mti_fieldValue") || "";

					/// Apply changes
					formatTemplate(client, interaction.member, template);
					applyEmbedTemplate(embed, message_components, template);

					return await refreshEmbed(message, embed, template);

				case "btn_fieldMode_inline":
					// prettier-ignore
					if (fieldMode_selectedFieldIndex === null) return await i.reply({
						content: "No field was selected to edit", ephemeral: true
					});

					let _field_toggleInline = template.fields[fieldMode_selectedFieldIndex];

					// prettier-ignore
					if (!_field_toggleInline) return await i.reply({
						content: `\`Field ${fieldMode_selectedFieldIndex || 1}\` doesn't exist and can't be edited`, ephemeral: true
					});

					await i.deferUpdate();

					/* - - - - - { Parse Modal Data } - - - - - */
					_field_toggleInline.inline = !_field_toggleInline.inline || false;

					/// Apply changes
					formatTemplate(client, interaction.member, template);
					applyEmbedTemplate(embed, message_components, template);

					return await refreshEmbed(message, embed, template);

				case "btn_toJSON":
					let _templateJSON = structuredClone(template);

					/// Clean up the template
					delete _templateJSON.meta;

					if (!_templateJSON.messageContent) delete _templateJSON.messageContent;

					// prettier-ignore
					if (_templateJSON?.author && !_templateJSON?.author?.text && !_templateJSON.author.iconURL) delete _templateJSON.author;
					if (_templateJSON?.author && !_templateJSON?.author?.text) delete _templateJSON.author.text;
					if (_templateJSON?.author && !_templateJSON?.author?.iconURL) delete _templateJSON.author.iconURL;

					// prettier-ignore
					if (_templateJSON?.title && !_templateJSON?.title?.text && !_templateJSON.title?.linkURL) delete _templateJSON.title;
					if (_templateJSON?.title && !_templateJSON?.title?.text) delete _templateJSON.title.text;
					if (_templateJSON?.title && !_templateJSON?.title?.linkURL) delete _templateJSON.title.linkURL;

					if (_templateJSON.description === "") delete _templateJSON.description;
					if (_templateJSON.imageURL === "") delete _templateJSON.imageURL;
					if (_templateJSON.footer === "") delete _templateJSON.footer;
					if (_templateJSON.color === "") delete _templateJSON.color;

					if (!_templateJSON.fields.length) delete _templateJSON.fields;
					if (_templateJSON.fields?.length) _templateJSON.fields.forEach(f => delete f?.meta);

					// Add meta values
					_templateJSON = { meta: { name: "Untitled Template", value: "untitled_template" }, ..._templateJSON };

					// Convert JSON into an attachment
					let attachment_json = new AttachmentBuilder(Buffer.from(
						JSON.stringify(_templateJSON, null, 4)),
						{ name: "template.json", description: "untitled template" }
					);

					// Send the attachment
					return await i.reply({ files: [attachment_json], ephemeral: true });

				case "btn_confirm":
					await i.deferUpdate();

					/// Update the embed to reflect its final changes
					formatTemplate(client, interaction.member, template);
					applyEmbedTemplate(embed, message_components, template);
					await refreshEmbed(message, embed, template);

					/// Send a follow up message asking where the user wants to send the embed
					let cS_channelSelectMenu = new ChannelSelectMenuBuilder()
						.setCustomId("csm_channelSelect")
						.setPlaceholder("Select channel(s)...")
						.setMinValues(1)
						.setMaxValues(5);

					let cS_actionRow = new ActionRowBuilder().addComponents(cS_channelSelectMenu);

					// Send the message
					let cS_message = await message.reply({ components: [cS_actionRow] });

					/* - - - - - { Collect Interactions } - - - - - */
					// Create a filter to look for interactions from the user that ran this command
					let cS_filter = cS_i =>
						cS_i.componentType === ComponentType.ChannelSelect && cS_i.user.id === interaction.user.id;

					// Create an interaction collector
					return await cS_message
						.awaitMessageComponent({ filter: cS_filter, time: timeouts.channelSelect })
						.then(async cS_i => {
							await cS_i.deferUpdate();

							// Send the custom embed to the selected channels
							cS_i.channels.forEach(c => c.send({ content: template.messageContent, embeds: [embed] }));

							// prettier-ignore
							// Delete this message
							try { await cS_message.delete(); } catch { }

							// End the main interaction collector
							collector.stop();
						})
						.catch(async err => {
							// Log the error
							console.log(err);

							// Let the user know something went wrong
							try {
								await message.reply({ content: "An error occurred while sending the embeds. Try again" });
							} catch {}

							// prettier-ignore
							// Delete this message
							try { await cS_message.delete(); } catch { }
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

function formatTemplate(client, user, template) {
	if (Array.isArray(template.description)) template.description = template.description.join("\n");

	if (typeof template.author === "string") template.author = { text: template.author, iconURL: "", linkURL: "" };
	if (typeof template.title === "string") template.title = { text: template.title, linkURL: "" };
	if (typeof template.footer === "string") template.footer = { text: template.footer, iconURL: "" };

	// prettier-ignore
	// Uses negative lookbehind for "\" to allow escaping
	const parse = str => `${str}`
		// User mentions
		.replace(/(?<!\\|<)@[0-9]{18}(?!>)/g, s => `<@${s.substring(1)}>`)
		// Role mentions
		.replace(/(?<!\\|<)@&[0-9]{18}(?!>)/g, s => `<@&${s.substring(2)}>`)
		// Channel mentions
		.replace(/(?<!\\|<)#[0-9]{19}(?!>)/g, s => `<#${s.substring(1)}>`)

		// Self mention
		.replace(/(?<!\\)\$USER\b/g, user.toString())
		// Self username
		.replace(/(?<!\\)\$USERNAME\b/g, user?.displayName || user?.username || "{invalid user}")

		// Self avatar
		.replace(/(?<!\\)\$USER_AVATAR\b/g, user.user.avatarURL({ dynamic: true }) || "{invalid avatar url}")
		// Bot avatar
		.replace(/(?<!\\)\$BOT_AVATAR\b/g, client.user.avatarURL({ dynamic: true }) || "{invalid avatar url}")
		
		/// Dates
		.replace(/(?<!\\)\$YEAR/g, new Date().getFullYear())
		.replace(/(?<!\\)\$MONTH/g, `0${new Date().getMonth() + 1}`.slice(-2))
		.replace(/(?<!\\)\$DAY/g, `0${new Date().getDate()}`.slice(-2))
		.replace(/(?<!\\)\$year/g, `${new Date().getFullYear()}`.substring(2))
		.replace(/(?<!\\)\$month/g, `0${new Date().getMonth() + 1}`.slice(-2))
		.replace(/(?<!\\)\$day/g, `0${new Date().getDate()}`.slice(-2))
		
		.replace(/\\/g, "");

	// prettier-ignore
	const parseSpecial = str => `${str}`
		// User avatar
		.replace(/(?<!\\)\$USER_AVATAR\b/g, user.user.avatarURL({ dynamic: true }) || "n/a")
		// Bot avatar
		.replace(/(?<!\\)\$BOT_AVATAR\b/g, client.user.avatarURL({ dynamic: true }) || "n/a");

	if (template.messageContent) template.messageContent = parse(template.messageContent);
	if (template.author?.text) template.author.text = parse(template.author.text);
	if (template.title?.text) template.title.text = parse(template.title.text);
	if (template.footer?.text) template.footer.text = parse(template.footer.text);
	if (template.description) template.description = parse(template.description);

	// Special
	if (template.author?.iconURL) template.author.iconURL = parseSpecial(template.author.iconURL);
	if (template.thumbnailURL) template.thumbnailURL = parseSpecial(template.thumbnailURL);
	if (template.imageURL) template.imageURL = parseSpecial(template.imageURL);
	if (template.footer?.iconURL) template.footer.iconURL = parseSpecial(template.footer.iconURL);

	// Fields
	if (template.fields) {
		template.fields = template.fields.filter(f => f.name);

		template.fields.forEach((f, idx) => {
			template.fields[idx].meta = `field_${idx}`;
			template.fields[idx].name = parse(f.name);

			// prettier-ignore
			if (Array.isArray(template.fields[idx].value)) template.fields[idx].value = template.fields[idx].value.join("\n")
			template.fields[idx].value = parse(f.value);

			template.fields[idx].inline ? (template.fields[idx].inline = true) : (template.fields[idx].inline = false);
		});
	}

	return template;
}

function applyEmbedTemplate(embed, messageComponents, template) {
	// Set field select menu options
	if (template?.fields && template.fields.length)
		messageComponents.fieldMode_selectMenu.setOptions(
			template.fields.map((f, idx) => ({
				label: `Field ${idx + 1}`,
				value: f.meta || `field_${idx + 1}`,
				description: `${f.name.substring(0, 16)}...`
			}))
		);

	// Author
	embed.setAuthor({
		text: template.author?.text || null,
		iconURL: template.author?.iconURL || null,
		linkURL: template.author?.linkURL || null
	});

	// Title
	embed.setTitle({ text: template.title?.text || null, linkURL: template.title?.linkURL || null });

	// Thumbnail
	embed.setThumbnail(template.thumbnailURL || null);

	// Description
	embed.setDescription(template.description || null);

	// Footer
	embed.setFooter({ text: template.footer?.text || null, iconURL: template.footer?.iconURL || null });

	// Image URL
	embed.setImage(template.imageURL || null);

	// Timestamp
	embed.setTimestamp(template.timestamp);

	// Color
	embed.setColor(template.color || null);

	// Fields
	if (template.fields) embed.setFields(...template.fields.filter(f => f.name));

	// prettier-ignore
	// Prevents crashing as embeds can't be empty
	if (!template.author?.text && !template.title?.text && !template.description && !template.imageURL && !template?.fields[0]?.name)
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
	} catch (err) {
		console.error(err);
		return null;
	}
}

/** Update the message with the new embed
 * @param {BetterEmbed} embed @param {Message} message */
async function refreshEmbed(message, embed, template) {
	// Edit the message with the updated embed
	try {
		await message.edit({
			content: template.messageContent,
			embeds: [embed],
			components: message.components || []
		});
	} catch (err) {
		console.error(err);
	}
}
