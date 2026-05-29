const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { createVillageLink } = require('../utils/createVillageLink');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('respush')
        .setDescription('Create a resource push channel')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the person receiving resources')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('village')
                .setDescription('Village name or identifier')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('coords')
                .setDescription('Coordinates, e.g. 45/76')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('res')
                .setDescription('Total resource goal')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Channel name (e.g. john-500k)')
                .setRequired(true)),

    async execute(interaction) {
        const name = interaction.options.getString('name', true);
        const village = interaction.options.getString('village', true);
        const coords = interaction.options.getString('coords', true);
        const [x, y] = coords.split('/').map(v => v.trim());
        const res = interaction.options.getInteger('res', true);
        const title = interaction.options.getString('title', true);

        const villageLink = createVillageLink(x, y);

        await interaction.deferReply({ ephemeral: true });

        const channelName = title;

        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: process.env.RESPUSH_CATEGORY_ID,
            reason: `Respush created by ${interaction.user.tag}`
        });

        const body = [
            `Receiver: ${name}`,
            `Village: ${village}`,
            `Village Link: ${villageLink}`,
            `Resources: 0 / ${res.toLocaleString()}`
        ].join('\n');

        await channel.send({ content: body });
        await interaction.editReply({ content: `Created resource push channel <#${channel.id}>` });
    }
};
