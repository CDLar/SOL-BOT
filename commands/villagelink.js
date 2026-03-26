const { SlashCommandBuilder } = require('discord.js');
const { createVillageLink } = require('../utils/createVillageLink');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('villagelink')
        .setDescription('Generate a village map link from coordinates')
        .addIntegerOption(option =>
            option.setName('x')
                .setDescription('X coordinate (-200 to 200)')
                .setRequired(true)
                .setMinValue(-200)
                .setMaxValue(200))
        .addIntegerOption(option =>
            option.setName('y')
                .setDescription('Y coordinate (-200 to 200)')
                .setRequired(true)
                .setMinValue(-200)
                .setMaxValue(200)),

    async execute(interaction) {
        const x = interaction.options.getInteger('x', true);
        const y = interaction.options.getInteger('y', true);

        const villageLink = createVillageLink(x, y);

        await interaction.reply({ content: `Village link for (${x}|${y}): ${villageLink}` });
    }
};
