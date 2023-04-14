const { Client, CommandInteraction, SlashCommandBuilder } = require('discord.js');

const { randomTools } = require('../modules/jsTools');

module.exports = {
    builder: new SlashCommandBuilder().setName("cookie")
        .setDescription("Get a cookie, or a glass of milk."),

    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    execute: async (client, interaction) => {
        let choices = [
            "Hey, %USER! Have a cookie! :cookie:",
            "%USER. It's your lucky day! Have a glass of milk! :milk:",
        ];

        let response = randomTools.choice(choices).replace("%USER", interaction.user);
        return await interaction.reply({ content: response });
    }
};