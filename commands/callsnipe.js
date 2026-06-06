const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { createVillageLink } = require('../utils/createVillageLink');

const DEFENDER_ROLE_ID = '1474690511666155661';
const CALLSNIPE_CATEGORY_ID = '1482854971677347975';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('callsnipe')
        .setDescription('Create a call snipe channel')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Player name')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('villagename')
                .setDescription('Village name')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('x')
                .setDescription('X coordinate')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('y')
                .setDescription('Y coordinate')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Landing time (server time, e.g. 14:32:10)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('time2')
                .setDescription('Second landing time (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('time3')
                .setDescription('Third landing time (optional)')
                .setRequired(false)),

    async execute(interaction) {
        const name = interaction.options.getString('name', true);
        const villageName = interaction.options.getString('villagename', true);
        const x = interaction.options.getString('x', true).trim();
        const y = interaction.options.getString('y', true).trim();
        const time = interaction.options.getString('time', true);
        const time2 = interaction.options.getString('time2');
        const time3 = interaction.options.getString('time3');

        const villageLink = createVillageLink(x, y);

        await interaction.deferReply({ ephemeral: true });

        const channelName = `${name}-snipe`.toLowerCase().replace(/\s+/g, '-').slice(0, 100);

        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: CALLSNIPE_CATEGORY_ID,
            reason: `Callsnipe created by ${interaction.user.tag}`
        });

        const times = [time, time2, time3].filter(Boolean);
        const timeLines = times.map(t => `Exactly at ${t} Server time  ---- 0/5k`);

        const body = [
            `<@&${DEFENDER_ROLE_ID}> SNIPE needed at: ${villageLink} (${villageName})`,
            ...timeLines
        ].join('\n');

        await channel.send({
            content: body,
            allowedMentions: { roles: [DEFENDER_ROLE_ID] }
        });

        await interaction.editReply({ content: `Created snipe channel <#${channel.id}>` });
    }
};
