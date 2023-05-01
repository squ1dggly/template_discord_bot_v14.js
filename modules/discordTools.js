const {
    CommandInteraction,
    Embed,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require('discord.js');

const { botSettings } = require('../configs/heejinSettings.json');
const logger = require('./logger');

//! Message Tools
/** Create a simple embed with a description. */
class message_Embedinator {
    /** @param {CommandInteraction} interaction */
    constructor(interaction, options = { author: null, title: "", description: "" }) {
        options = { author: null, title: "title", description: "", ...options };

        this.interaction = interaction;
        this.author = options.author;
        this.title = options.title
            .replace("%USER", options.author?.username || interaction.user.username);
        this.description = options.description;

        // Create the embed
        this.embed = new EmbedBuilder().setColor(botSettings.embedColor || null);

        if (this.description) this.embed.setDescription(this.description);
        if (this.title) this.embed.setAuthor({ name: this.title });
        if (this.author) this.embed.setAuthor({
            name: this.embed.data.author.name,
            iconURL: this.author.avatarURL({ dynamic: true })
        });
    }

    /** Change the title.
     * @param {string} title The title.
     */
    setTitle(title) {
        this.title = title
            .replace("%USER", this.author.username || this.interaction.user.username);;
    }
    /** Change the embed's author.
     * @param {string} author The author.
     */
    setAuthor(author) { this.author = author; }

    /** Send the embed.
     * @param {string} description The description of the embed.
     * @param {{followUp: boolean, ephemeral: boolean}} options Optional options.
     */
    async send(description, options = { followUp: false, ephemeral: false }) {
        options = { followUp: false, ephemeral: false, ...options };

        if (description) this.embed.setDescription(description);

        // Send the embed
        if (options.followUp)
            return await this.interaction.followUp({ embeds: [this.embed], ephemeral: options.ephemeral });
        else
            try {
                return await this.interaction.reply({ embeds: [this.embed], ephemeral: options.ephemeral });
            } catch {
                // If you edit a reply you can't change the message to ephemeral unfortunately
                // unless you do a follow up message and then delete the original reply but that's pretty scuffed
                return await this.interaction.editReply({ embeds: [this.embed] });
            }
    }
}

/** Send a message with a select menu/pagination to switch to different views. */
class message_Navigationify {
    /**
     * @param {CommandInteraction} interaction
     * @param {Array<Embed | Array<Embed>} embedViews
     */
    constructor(interaction, embedViews, options = { ephemeral: false, followUp: false, timeout: 10000 }) {
        options = { ephemeral: false, followUp: false, timeout: 10000, ...options };

        this.interaction = interaction;
        this.fetchedReply = null;

        this.views = embedViews;
        this.options = options;

        this.selectMenu_enabled = false;
        this.selectMenu_values = [];
        this.pagination_enabled = false;

        this.viewIndex = 0; this.nestedPageIndex = 0;

        this.actionRow = {
            selectMenu: new ActionRowBuilder(),
            pagination: new ActionRowBuilder()
        };

        this.components = {
            stringSelectMenu: new StringSelectMenuBuilder()
                .setCustomId("menu_view")
                .setPlaceholder("make a selection..."),

            pagination: {
                skipFirst: new ButtonBuilder({ label: "◀◀", style: ButtonStyle.Primary, custom_id: "btn_skipFirst" }),
                pageBack: new ButtonBuilder({ label: "◀", style: ButtonStyle.Primary, custom_id: "btn_back" }),
                jump: new ButtonBuilder({ label: "📄", style: ButtonStyle.Primary, custom_id: "btn_jump" }),
                pageNext: new ButtonBuilder({ label: "▶", style: ButtonStyle.Primary, custom_id: "btn_next" }),
                skipLast: new ButtonBuilder({ label: "▶▶", style: ButtonStyle.Primary, custom_id: "btn_skipLast" })
            }
        };

        // Add the select menu component to the selectMenu action row
        this.actionRow.selectMenu.addComponents(this.components.stringSelectMenu);
    }

    addSelectMenuOption(options = { emoji: "", label: "", description: "", isDefault: false }) {
        options = {
            emoji: "",
            label: `option ${this.selectMenu_values.length + 1}`,
            description: "",
            value: `view_${this.selectMenu_values.length + 1}`,
            isDefault: false,
            ...options
        }; this.selectMenu_values.push(options.value);

        // Create a new select menu option
        let newOption = new StringSelectMenuOptionBuilder()
            .setLabel(options.label)
            .setValue(options.value)
            .setDefault(options.isDefault);

        // Add a description if provided
        if (options.description) newOption.setDescription(options.description);

        // Add an emoji if provided
        if (options.emoji) newOption.setEmoji(options.emoji);

        // Add the new option to the select menu
        this.components.stringSelectMenu.addOptions(newOption);
    }

    removeSelectMenuOption(index) {
        this.components.stringSelectMenu.spliceOptions(index);
    }

    determinePageinationStyle() {
        let nestedPageCount = this.views[this.viewIndex]?.length || 0;

        if (nestedPageCount > 1) this.actionRow.pagination.setComponents(
            this.components.pagination.pageBack,
            this.components.pagination.pageNext
        );

        if (nestedPageCount > 3) this.actionRow.pagination.setComponents(
            this.components.pagination.skipFirst,
            this.components.pagination.pageBack,
            this.components.pagination.jump,
            this.components.pagination.pageNext,
            this.components.pagination.skipLast
        );
    }

    async setSelectMenuDisabled(disabled = true) {
        this.components.stringSelectMenu.setDisabled(disabled);
        await this.updateMessageComponents();
    }

    async setPaginationDisabled(disabled = true) {
        this.actionRow.pagination.components.forEach(btn => btn.setDisabled(disabled));
        await this.updateMessageComponents();
    }

    toggleSelectMenu() {
        this.selectMenu_enabled = !this.selectMenu_enabled;
    }

    togglePagination() {
        this.pagination_enabled = !this.pagination_enabled;
    }

    async send() {
        let view = this.views[this.viewIndex];
        if (Array.isArray(view)) view = view[this.nestedPageIndex];

        let replyOptions = {
            embeds: [view],
            components: [],
            ephemeral: this.options.ephemeral
        };

        // If enabled, add in the select menu action row
        if (this.selectMenu_enabled) replyOptions.components.push(this.actionRow.selectMenu);

        // If enabled, add in the pagination action row
        if (this.views[this.viewIndex]?.length > 1 && this.pagination_enabled) {
            this.determinePageinationStyle();
            replyOptions.components.push(this.actionRow.pagination);
        }

        // Send the embed and neccesary components
        if (this.options.followUp)
            this.fetchedReply = await this.interaction.followUp(replyOptions);
        else
            try {
                this.fetchedReply = await this.interaction.reply(replyOptions);
            } catch {
                // If you edit a reply you can't change the message to ephemeral
                // unless you do a follow up message and then delete the original reply but that's pretty scuffed
                this.fetchedReply = await this.interaction.editReply(replyOptions);
            }

        // Collect message component interactions
        this.collectInteractions(); return this.fetchedReply;
    }

    async update(resetNestedIndex = false) {
        if (resetNestedIndex) this.nestedPageIndex = 0;

        let view = this.views[this.viewIndex];
        if (Array.isArray(view)) view = view[this.nestedPageIndex];

        let replyOptions = {
            embeds: [view],
            components: [],
            ephemeral: this.options.ephemeral
        };

        // If enabled, add in the select menu action row
        if (this.selectMenu_enabled) replyOptions.components.push(this.actionRow.selectMenu);

        // If enabled, add in the pagination action row
        if (this.views[this.viewIndex]?.length > 1 && this.pagination_enabled) {
            this.determinePageinationStyle();
            replyOptions.components.push(this.actionRow.pagination);
        }

        // Set the option the user picked as default so the select menu shows the relevant option selected
        if (this.selectMenu_enabled) {
            this.components.stringSelectMenu.options.forEach(option => option.setDefault(false));
            this.components.stringSelectMenu.options[this.viewIndex].setDefault(true);
        }

        await this.fetchedReply.edit(replyOptions);
    }

    async collectInteractions() {
        // Collect button interactions
        let filter = i => i.user.id === this.interaction.user.id;
        let collector = this.fetchedReply.createMessageComponentCollector({ filter, time: this.options.timeout });

        collector.on("collect", async i => {
            // Defer the interaction and reset the collector's timer
            await i.deferUpdate(); collector.resetTimer();

            // Ignore interactions that aren't dealing with the select menu or pagination buttons
            if (![ComponentType.Button, ComponentType.StringSelect].includes(i.componentType)) return;

            switch (i.customId) {
                case "menu_view":
                    let changeView = this.selectMenu_values.findIndex(v => v === i.values[0]);
                    if (changeView >= 0) {
                        this.viewIndex = changeView;
                        return await this.update(true);
                    }

                case "btn_skipFirst": this.nestedPageIndex = 0; break;

                case "btn_back":
                    this.nestedPageIndex--;
                    if (this.nestedPageIndex < 0) this.nestedPageIndex = this.views[this.viewIndex].length - 1;

                    break;

                case "btn_jump":
                    // Let the user know what action they should take
                    let _msg = await this.interaction.followUp({
                        content: `${this.interaction.user} say the page number you want to jump to`
                    });

                    // Create a new message collector and await the user's next message
                    let filter_temp = m => m.author.id === this.interaction.user.id;
                    await this.interaction.channel.awaitMessages({ filter: filter_temp, time: 10000, max: 1 })
                        .then(async collected => {
                            // Delete the user's number message along with our previous message telling the user what to do
                            collected.first().delete(); _msg.delete();

                            // Convert the collected message to a number
                            let pageNum = Number(collected.first().content);

                            // Check if the collected page number is actually a number, and that embed page is available
                            if (isNaN(pageNum) || pageNum > this.views[this.viewIndex]?.length || pageNum < 0)
                                // Send a self destructing message to the user stating that the given page number is invalid
                                return await message_deleteAfter(await this.interaction.followUp({
                                    content: `${this.interaction.user} that's an invalid page number`
                                }), 5000);

                            // Update the current page index
                            this.nestedPageIndex = pageNum - 1;
                        });

                    break;

                case "btn_next":
                    this.nestedPageIndex++;
                    if (this.nestedPageIndex > this.views[this.viewIndex].length - 1) this.nestedPageIndex = 0;

                    break;

                case "btn_skipLast": this.nestedPageIndex = (this.views[this.viewIndex].length - 1); break;

                default: return;
            }

            // Update the message
            return await this.update();
        });

        // When the collector times out remove the message's components
        try { collector.on("end", () => this.fetchedReply.edit({ components: [] })); }
        catch (err) { logger.error("Failed to remove message components", "navigationify", err) };
    }
}

async function message_deleteAfter(message, time) {
    let m;

    setTimeout(async () => m = await message.delete(), time);
    return m;
}

//! Markdown
function bold(space = true, ...str) {
    if (!Array.isArray(str)) str = [str];

    return space ? (`**${str.join(" ")}**`) : (`**${str.join("")}**`);
}

function italic(space = true, ...str) {
    if (!Array.isArray(str)) str = [str];

    return space ? (`*${str.join(" ")}*`) : (`*${str.join("")}*`);
}

function inline(space = true, ...str) {
    if (!Array.isArray(str)) str = [str];

    return space ? (`\`${str.join(" ")}\``) : (`\`${str.join("")}\``);
}

function quote(space = true, ...str) {
    if (!Array.isArray(str)) str = [str];

    return space ? (`> ${str.join(" ")}`) : (`> ${str.join("")}`);
}

function link(label, url, tooltip = "") {
    return `[${label}](${url}${tooltip ? ` "${tooltip}"` : ""})`;
}

/** @param {"left" | "right" | "both"} side */
function space(side = "both", ...str) {
    if (!Array.isArray(str)) str = [str];

    switch (side) {
        case "left": return space ? (" " + str.join(" ")) : (" " + str.join(""));
        case "right": return space ? (str.join(" ") + " ") : (str.join("") + " ");
        case "both": return space ? (" " + str.join(" ") + " ") : (" " + str.join("") + " ");
    }
}

module.exports = {
    messageTools: {
        Embedinator: message_Embedinator,
        Navigationify: message_Navigationify,

        deleteAfter: message_deleteAfter,
        paginationify: message_paginationify
    },

    markdown: { bold, italic, inline, quote, link, space }
};