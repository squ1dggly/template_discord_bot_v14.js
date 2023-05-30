const {
    CommandInteraction, GuildMember, User, Message,
    EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType
} = require('discord.js');

const { dateTools } = require('./jsTools');
const logger = require('./logger');

/// Configuration
const embed_defaults = {
    color: "#2B2D31"
};

const timeouts = {
    pagination: "30s",
    confirmation: "15s",
    errorMessage: "5s"
};

const nav_emojis = {
    toFirst: { name: "◀◀", emoji: "◀◀" },
    back: { name: "◀", emoji: "◀" },
    jump: { name: "📄", emoji: "📄" },
    next: { name: "▶", emoji: "▶" },
    toLast: { name: "▶▶", emoji: "▶▶" }
};

/// Quality of Life
class bE_constructorOptions {
    constructor() {
        /** @type {CommandInteraction | null} */
        this.interaction = null;

        this.author = {
            /** @type {GuildMember | User | null} */
            user: null, text: "", iconURL: "", linkURL: ""
        };

        this.title = { text: "", linkURL: "" };
        this.imageURL = "";
        this.description = "";
        this.footer = { text: "", iconURL: "" };

        this.color = embed_defaults.color || null;

        this.showTimestamp = false;
    }
}

class bE_sendOptions {
    constructor() {
        /** Add a message outside of the embed. */
        this.messageContent = "";

        /** Send the embed with additional components.
         * @type {ActionRowBuilder | Array<ActionRowBuilder>} */
        this.components = [];

        /** Send the embed with a new description.
         * 
         * Useful for cleaner code. */
        this.description = "";

        /** Send the embed with a new image.
         * 
         * Useful for cleaner code. */
        this.imageURL = "";

        /** The method to send the embed.
         * 
         * If "reply" isn't possible, it will fallback to "editReply".
         * 
         * @type {"reply" | "editReply" | "followUp" | "send"} */
        this.method = "reply";

        /** Send the message as ephemeral. */
        this.ephemeral = false;
    }
}

/** A better embed builder. */
class BetterEmbed extends EmbedBuilder {
    /**
     * @example
     // Text formatting shorthand:
     * "%AUTHOR_NAME" = "the author's display/user name"
     * 
     * @param {bE_constructorOptions} options */
    constructor(options) {
        super(); options = { ...new bE_constructorOptions(), ...options };

        /// Variables
        this.interaction = options.interaction;
        this.author = options.author;

        /// Configure the embed
        //* Embed Author
        if (this.author.text) this.setAuthor({
            name: this.author.text
                // Formatting shorthand
                .replace("%AUTHOR_NAME", this.author.user?.displayName || this.author.user?.username)
        });

        if ((this.author.iconURL || this.author.user) && this.author.iconURL !== null) this.setAuthor({
            name: this.data.author?.name || null, iconURL: this.author.iconURL
                || (this.author.user?.user?.avatarURL({ dynamic: true }) || this.author.user?.avatarURL({ dynamic: true }))
        });

        if (this.author.linkURL) this.setAuthor({
            name: this.data.author?.name, iconURL: this.data.author.icon_url,
            url: this.author.linkURL
        });

        //* Embed Title
        if (options.title.text) this.setTitle(options.title.text
            // Formatting shorthand
            .replace("%AUTHOR_NAME", options.author.user?.displayName || options.author.user?.username)
        );

        if (options.title.linkURL) this.setURL(options.title.linkURL);

        //* Embed Description
        if (options.description) this.setDescription(options.description);

        //* Embed Image
        if (options.imageURL) try {
            this.setImage(options.imageURL);
        } catch {
            logger.error("Failed to create embed", `invalid image URL: \`${options.imageURL}\``); return null;
        }

        //* Embed Footer
        if (options.footer.text) this.setFooter({ text: options.footer.text, iconURL: options.footer.iconURL });
        if (options.footer.iconURL) this.setFooter({
            text: this.data.footer.text, iconURL: options.footer.iconURL
        });

        //* Embed Color
        if (options.color) this.setColor(options.color);

        //* Embed Timestamp
        if (options.showTimestamp) this.setTimestamp();
    }

    /** Send the embed using the given interaction.
     * 
     * @example
     // Text formatting shorthand:
     * "%AUTHOR_NAME" = "the author's display/user name"
     * "%AUTHOR_MENTION" = "the author's mention"
     * 
     * @param {bE_sendOptions} options */
    async send(options) {
        options = { ...new bE_sendOptions(), ...options };

        // Format message content
        options.messageContent = options.messageContent
            // Formatting shorthand
            .replace("%AUTHOR_NAME", this.author.user?.displayName || this.author.user?.username)
            .replace("%AUTHOR_MENTION", this.author.user?.toString());

        // Change the embed's description if applicable
        if (options.description) this.setDescription(options.description
            // Formatting shorthand
            .replace("%AUTHOR_NAME", this.author.user?.displayName || this.author.user?.username)
            .replace("%AUTHOR_MENTION", this.author.user?.toString())
        );

        // Change the embed's image if applicable
        if (options.imageURL) try {
            this.setImage(options.imageURL);
        } catch {
            logger.error("Failed to send embed", `invalid image URL: \`${options.imageURL}\``); return null;
        }

        // Create an array if a single object was given
        if (!Array.isArray(options.components)) options.components = [options.components];

        // Send the embed
        try {
            switch (options.method) {
                case "reply": try {
                    return await this.interaction.reply({
                        content: options.messageContent, components: options.components,
                        embeds: [this], ephemeral: options.ephemeral
                    });
                } catch { // Fallback to "editReply"
                    return await this.interaction.editReply({
                        content: options.messageContent, components: options.components,
                        embeds: [this]
                    });
                }

                case "editReply": return await this.interaction.editReply({
                    content: options.messageContent, components: options.components,
                    embeds: [this]
                });

                case "followUp": return await this.interaction.followUp({
                    content: options.messageContent, components: options.components,
                    embeds: [this], ephemeral: options.ephemeral
                });

                case "send": return await this.interaction.channel.send({
                    content: options.messageContent, components: options.components,
                    embeds: [this]
                });

                default: logger.error("Failed to send embed", `invalid send method: \"${options.method}\"`); return null;
            }
        } catch (err) {
            logger.error("Failed to send embed", "message_embed.send", err); return null;
        }
    }
}

/** @type {"short" | "shortJump" | "long" | "longJump" | false} */
const nav_paginationType = null;

/** @type {BetterEmbed | EmbedBuilder | Array<BetterEmbed | EmbedBuilder> | Array<Array<BetterEmbed | EmbedBuilder>>} */
const nav_embedsType = null;

/** @type {BetterEmbed | EmbedBuilder} */
const nav_embedsType2 = null;

class nav_constructorOptions {
    constructor() {
        /** @type {CommandInteraction | null} */
        this.interaction = null;

        /** @type {nav_embedsType} */
        this.embeds = null;

        /** @type {nav_paginationType} */
        this.paginationType = false;
        this.dynamicPagination = true;
        this.useReactionsForPagination = false;
        this.selectMenu = false;

        this.timeout = dateTools.parseStr(timeouts.pagination);
    }
}

class nav_selectMenuOptionData {
    constructor(idx = 0) {
        this.emoji = "";
        this.label = `page ${idx + 1}`;
        this.description = "";
        this.value = `ssm_o_${idx + 1}`;
        this.isDefault = idx === 0 ? true : false;
    }
}

class nav_sendOptions {
    constructor() {
        /** The method to send the embed.
         * 
         * If "reply" isn't possible, it will fallback to "editReply".
         * 
         * @type {"reply" | "editReply" | "followUp" | "send"} */
        this.method = "reply";

        /** Send the message as ephemeral. */
        this.ephemeral = false;
    }
}

/** Add a navigation system to embeds. */
class EmbedNavigator {
    #createButton(emoji, label, customID) {
        return new ButtonBuilder({
            emoji, label, style: ButtonStyle.Secondary, custom_id: customID
        });
    }

    /** @param {nav_constructorOptions} options */
    constructor(options) {
        options = { ...new nav_constructorOptions(), ...options };
        if (!options.interaction) return logger.error("Failed to navigationate", "interaction not given");

        // Variables
        this.data = {
            interaction: options.interaction,
            /** @type {Message} */
            message: null,

            embeds: options.embeds,

            timeout: options.timeout,

            /** @type {nav_embedsType2} */
            page_current: null,
            page_nestedLength: 0,
            page_idx: { current: 0, nested: 0 },

            selectMenuEnabled: options.selectMenu,
            selectMenuValues: [],

            paginationType: options.paginationType,
            dynamicPagination: options.dynamicPagination,
            /** @type {Array<{name: string, emoji: string}>} */
            paginationReactions: [], useReactionsForPagination: options.useReactionsForPagination,
            requiresPagination: false, requiresLongPagination: false, canJumpToPage: false,

            messageComponents: [],

            collectors: {
                interaction: null,
                reaction: null
            },

            actionRows: {
                selectMenu: new ActionRowBuilder(),
                pagination: new ActionRowBuilder()
            },

            components: {
                selectMenu: new StringSelectMenuBuilder().setCustomId("ssm_pageSelect").setPlaceholder("choose a page to view..."),

                pagination: {
                    toFirst: this.#createButton(null, nav_emojis.toFirst.emoji, "btn_toFirst"),
                    back: this.#createButton(null, nav_emojis.back.emoji, "btn_back"),
                    jump: this.#createButton(nav_emojis.jump.emoji, null, "btn_jump"),
                    next: this.#createButton(null, nav_emojis.next.emoji, "btn_next"),
                    toLast: this.#createButton(null, nav_emojis.toLast.emoji, "btn_toLast")
                }
            }
        }

        // Configure
        if (!Array.isArray(this.data.embeds)) this.data.embeds = [this.data.embeds];

        this.data.actionRows.selectMenu.setComponents(this.data.components.selectMenu);
    }

    /** Toggle the select menu on/off. */
    async toggleSelectMenu() {
        this.data.selectMenuEnabled = !this.data.selectMenuEnabled;

        return await this.refresh();
    }

    /** Add an option to the select menu.
     * @param {nav_selectMenuOptionData} data */
    addToSelectMenu(data) {
        data = { ...new nav_selectMenuOptionData(this.data.selectMenuValues.length), ...data };

        // Append a new value to reference this select menu option
        this.data.selectMenuValues.push(data.value);

        // Create the select menu option
        let option = new StringSelectMenuOptionBuilder()
            .setLabel(data.label)
            .setValue(data.value)
            .setDefault(data.isDefault);

        // Add a description if applicable
        if (data.description) option.setDescription(data.description);

        // Add an emoji if applicable
        if (data.emoji) option.setEmoji(data.emoji);

        // Add the newly created option to the select menu
        this.data.components.selectMenu.addOptions(option);
    }

    /** Remove an option from the select menu using its index.
     * @param {number} idx */
    removeFromSelectMenu(idx) {
        this.data.components.selectMenu.spliceOptions(idx, 1);
    }

    /** Set pagination type. Set to false to disable.
     * @param {nav_paginationType} type */
    async setPaginationType(type) {
        this.data.paginationType = type;

        await this.refresh();
    }

    #updatePagination() {
        this.#updateCurrentPage(); this.data.paginationReactions = [];
        let _paginationButtons = [];

        if (this.data.requiresPagination) switch (this.data.paginationType) {
            case "short": _paginationButtons = ["back", "next"]; break;

            case "shortJump":
                _paginationButtons = this.data.dynamicPagination
                    ? this.data.canJumpToPage
                        ? ["back", "jump", "next"]
                        : ["back", "next"]
                    : ["back", "jump", "next"]
                break;

            case "long":
                _paginationButtons = this.data.dynamicPagination
                    ? this.data.requiresLongPagination
                        ? ["toFirst", "back", "next", "toLast"]
                        : ["back", "next"]
                    : ["toFirst", "back", "next", "toLast"]
                break;

            case "longJump":
                // requiresLongPagination and canJumpToPage both activate on the same page length
                // so we can skip a 2nd canJumpToPage check
                _paginationButtons = this.data.dynamicPagination
                    ? this.data.requiresLongPagination
                        ? this.data.canJumpToPage
                            ? ["toFirst", "back", "jump", "next", "toLast"]
                            : ["toFirst", "back", "next", "toLast"]
                        : ["back", "next"]
                    : ["toFirst", "back", "jump", "next", "toLast"]
                break;
        }

        // Parse the button string array into button/emoji data
        if (this.data.useReactionsForPagination)
            this.data.paginationReactions = _paginationButtons.map(btnType => nav_emojis[btnType]);
        else this.data.actionRows.pagination.setComponents(
            ..._paginationButtons.map(btnType => this.data.components.pagination[btnType])
        );
    }

    #updateCurrentPage() {
        let page = this.data.embeds[this.data.page_idx.current];

        if (page?.length)
            this.data.page_current = page[this.data.page_idx.nested];
        else
            this.data.page_current = page;

        // Keep track of how many nested pages are on this page
        this.data.page_nestedLength = page?.length || 0;

        // Determine whether or not pagination is required
        this.data.requiresPagination = page?.length >= 2;

        // Check whether or not it would be necessary to use long pagination
        this.data.requiresLongPagination = page?.length >= 4;

        // Check whether or not there's enough pages to enable page jumping
        this.data.canJumpToPage = page?.length >= 4;
    }

    #clampPageIndex() {
        /// Current
        if (this.data.page_idx.current < 0) this.data.page_idx.current = 0;

        if (this.data.page_idx.current > (this.data.embeds.length - 1))
            this.data.page_idx.current = (this.data.embeds.length - 1);

        /// Nested
        if (this.data.page_idx.nested < 0)
            this.data.page_idx.nested = (this.data.page_nestedLength - 1);

        if (this.data.page_idx.nested > (this.data.page_nestedLength - 1))
            this.data.page_idx.nested = 0;
    }

    async #addPaginationReactions() {
        try {
            for (let reaction of this.data.paginationReactions)
                await this.data.message.react(reaction.emoji);
        } catch { }
    }

    async #removeReactions() {
        try { await this.data.message.reactions.removeAll(); } catch { }
    }

    async #refreshPaginationReactions() {
        await this.#removeReactions();
        await this.#addPaginationReactions();
    }

    async #removeComponents() {
        try { await this.data.message.edit({ components: [] }) } catch { }
    }

    async #awaitChoosePageNumber() {
        // Tell the user to choose a page number
        let msg = await this.data.message.reply({
            content: `${this.data.interaction.user.toString()} what page do you want to jump to?`
        });

        // Create a message collector to await the user's next message
        let filter = m => m.author.id === this.data.interaction.user.id;
        await msg.channel.awaitMessages({ filter, time: dateTools.parseStr(timeouts.confirmation), max: 1 })
            .then(async collected => {
                // Delete the user's message along with the confirmation message
                await Promise.all([collected.first().delete(), msg.delete()]);

                // Parse the user's message into a number
                let _content = collected.first().content;
                let _number = +_content;

                // Check whether it's a valid number
                if (isNaN(_number) || (_number > this.data.page_nestedLength && _number < 0))
                    // Send a self destructing error message
                    await message_deleteAfter(await this.data.interaction.followUp({
                        content: `${this.data.interaction.user.toString()} \`${_content}\` is an invalid page number`
                    }), dateTools.parseStr(timeouts.errorMessage));

                // Set the nested page index
                this.data.page_idx.nested = _number - 1;
            })
            .catch(async () => {
                try { await msg.delete() } catch { };
            });
    }

    /** Send the embed with navigation.
     * @param {nav_sendOptions} options */
    async send(options) {
        options = { ...new nav_sendOptions(), ...options };
        this.#updateCurrentPage(); this.#updatePagination();

        // Add the select menu if enabled
        if (this.data.selectMenuEnabled)
            this.data.messageComponents.push(this.data.actionRows.selectMenu);

        // Add pagination if enabled (buttons)
        if (this.data.requiresPagination && !this.data.useReactionsForPagination)
            this.data.messageComponents.push(this.data.actionRows.pagination);

        // Send the message
        try {
            switch (options.method) {
                case "reply": try {
                    this.data.message = await this.data.interaction.reply({
                        embeds: [this.data.page_current], ephemeral: options.ephemeral,
                        components: this.data.messageComponents
                    }); break;
                } catch { // Fallback to "editReply"
                    this.data.message = await this.data.interaction.editReply({
                        embeds: [this.data.page_current], components: this.data.messageComponents
                    }); break;
                }

                case "editReply": this.data.message = await this.data.interaction.editReply({
                    embeds: [this.data.page_current], components: this.data.messageComponents
                }); break;

                case "followUp": this.data.message = await this.data.interaction.followUp({
                    embeds: [this.data.page_current], ephemeral: options.ephemeral,
                    components: this.data.messageComponents
                }); break;

                case "send": this.data.message = await this.data.interaction.channel.send({
                    embeds: [this.data.page_current], components: this.data.messageComponents
                }); break;

                default: logger.error("Failed to send embed", `invalid send method: \"${options.method}\"`); return null;
            }
        } catch (err) {
            logger.error("Failed to send embed", "message_embed.send", err); return null;
        }

        // Add pagination if enabled (reactions)
        if (this.data.requiresPagination && this.data.useReactionsForPagination) this.#addPaginationReactions();

        // Collect message component interactions
        if (this.data.messageComponents.length) this.#collectInteractions();

        // Collect message reactions
        if (this.data.paginationReactions.length) this.#collectReactions();

        // Return the message object
        return this.data.message;
    }

    /** Refresh the message with the current page and components. */
    async refresh() {
        // Check if the message is editable
        if (!this.data.message?.editable) {
            logger.error("(Navigationator) Failed to edit message", "message not sent/editable");
            return null;
        }

        this.#updateCurrentPage(); this.#updatePagination();

        // Reset message components
        this.data.messageComponents = [];

        // Add the select menu if enabled
        if (this.data.selectMenuEnabled)
            this.data.messageComponents.push(this.data.actionRows.selectMenu);

        // Add pagination if enabled (buttons)
        if (this.data.requiresPagination && !this.data.useReactionsForPagination)
            this.data.messageComponents.push(this.data.actionRows.pagination);

        // Add/remove pagination if enabled (reactions)
        if (this.data.useReactionsForPagination) if (this.data.requiresPagination) {
            let _emojis_nav_names = [...Object.values(nav_emojis)].map(emoji => emoji.name);

            // Check if the current pagination reactions are updated
            let _currentPaginationReactions = this.data.message.reactions.cache.filter(reaction =>
                _emojis_nav_names.includes(reaction.emoji.name)
            );

            // Update pagination reactions
            if (_currentPaginationReactions.size !== this.data.paginationReactions.length)
                this.#refreshPaginationReactions();
        } else this.#removeReactions();

        // Collect message component interactions
        if (this.data.messageComponents.length && !this.data.collectors.interaction) this.#collectInteractions();
        if (this.data.collectors.interaction) this.data.collectors.interaction.resetTimer();

        // Collect message reactions
        if (this.data.paginationReactions.length && !this.data.collectors.reaction) this.#collectReactions();
        if (this.data.collectors.reaction) this.data.collectors.reaction.resetTimer();

        // Edit & return the message
        this.data.message = await this.data.message.edit({
            embeds: [this.data.page_current], components: this.data.messageComponents
        }); return this.data.message;
    }

    async #collectInteractions() {
        // Create an interaction collector
        let filter = i => i.user.id === this.data.interaction.user.id;
        let collector = this.data.message.createMessageComponentCollector({ filter, time: this.data.timeout });
        this.data.collectors.interaction = collector;

        collector.on("collect", async i => {
            // Defer the interaction and reset the collector's timer
            await i.deferUpdate(); collector.resetTimer();

            // Ignore non-button/select menu interactions
            if (![ComponentType.Button, ComponentType.StringSelect].includes(i.componentType)) return;

            switch (i.customId) {
                case "ssm_pageSelect":
                    this.data.page_idx.current = this.data.selectMenuValues.findIndex(val => val === i.values[0]);
                    this.data.page_idx.nested = 0;

                    // Change the default select menu option
                    this.data.components.selectMenu.options.forEach(option => option.setDefault(false));
                    this.data.components.selectMenu.options[this.data.page_idx.current].setDefault(true);

                    await this.refresh(); return;

                case "btn_toFirst":
                    this.data.page_idx.nested = 0;
                    await this.refresh(); return;

                case "btn_back":
                    this.data.page_idx.nested--; this.#clampPageIndex();
                    await this.refresh(); return;

                case "btn_jump":
                    await this.#awaitChoosePageNumber();
                    await this.refresh(); return;

                case "btn_next":
                    this.data.page_idx.nested++; this.#clampPageIndex();
                    await this.refresh(); return;

                case "btn_toLast":
                    this.data.page_idx.nested = (this.data.page_nestedLength - 1);
                    await this.refresh(); return;

                default: return;
            }
        });

        // Remove message components on timeout
        collector.on("end", async () => {
            this.data.collectors.reaction = null;
            await this.#removeComponents();
        });
    }

    async #collectReactions() {
        // Create the reaction collector        
        let filter = (reaction, user) => {
            if (user.id !== this.data.interaction.guild.members.me.id) reaction.users.remove(user.id);

            let _paginationEmojis = this.data.paginationReactions.map(emoji => emoji.name);

            return _paginationEmojis.includes(reaction.emoji.name)
                && user.id === this.data.interaction.user.id;
        };

        let collector = this.data.message.createReactionCollector({
            filter: filter, dispose: true,
            time: this.data.timeout
        }); this.data.collectors.reaction = collector;

        // Collect reactions
        collector.on("collect", async reaction => {
            switch (reaction.emoji.name) {
                case nav_emojis.toFirst.name:
                    this.data.page_idx.nested = 0;
                    await this.refresh(); return;

                case nav_emojis.back.name:
                    this.data.page_idx.nested--; this.#clampPageIndex();
                    await this.refresh(); return;

                case nav_emojis.jump.name:
                    await this.#awaitChoosePageNumber();
                    await this.refresh(); return;

                case nav_emojis.next.name:
                    this.data.page_idx.nested++; this.#clampPageIndex();
                    await this.refresh(); return;

                case nav_emojis.toLast.name:
                    this.data.page_idx.nested = (this.data.page_nestedLength - 1);
                    await this.refresh(); return;

                default: return;
            }
        });

        // Remove all reactions when the reaction collector times out or ends
        collector.on("end", async () => {
            this.data.collectors.reaction = null;
            await this.#removeReactions();
        });
    }
}

module.exports = { BetterEmbed, EmbedNavigator };