const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { createVillageLink } = require('../utils/createVillageLink');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('defcall')
        .setDescription('Create a defensive-call thread')
        .addStringOption(option =>
            option.setName('defender')
                .setDescription('Defender name')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('attacker')
                .setDescription('Attacker name / tribe')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('village')
                .setDescription('Village name or identifier')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('coords')
                .setDescription('Coordinates, e.g. 46/7')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('eta')
                .setDescription('ETA — server time (e.g. 06:59:58)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('troops')
                .setDescription('Total troops required')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('comment')
                .setDescription('Optional comment')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const defender = interaction.options.getString('defender', true);
        const attacker = interaction.options.getString('attacker', true);
        const village = interaction.options.getString('village', true);
        const coords = interaction.options.getString('coords', true);
        const [x, y] = coords.split(/[\/|]/).map(v => v.trim());
        if (!x || !y) {
            await interaction.reply({ content: 'Invalid coordinates. Use format `x/y` or `x|y` (e.g. `46/7`).', ephemeral: true });
            return;
        }
        const eta = interaction.options.getString('eta', true);
        const troops = interaction.options.getInteger('troops', true);
        const comment = interaction.options.getString('comment');
        const targetChannel = await interaction.client.channels.fetch('1488781996355485716');

        const villageLink = createVillageLink(x, y);

        await interaction.deferReply({ ephemeral: false });

        const threadName = `${defender} 🛡 (${troops.toLocaleString()}) - ${village} (${x}/${y})`;
        const thread = await targetChannel.threads.create({
            name: threadName.slice(0, 100),
            autoArchiveDuration: 1440,
            reason: `Defcall created by ${interaction.user.tag}`,
            type: ChannelType.PublicThread
        });

        const body = [
            `Defender: ${defender}`,
            `Attacker: ${attacker}`,
            `Village: ${village} (${x}/${y})`,
            `Village Link: ${villageLink}`,
            `Landing Time: ${eta} (Server time)`,
            `Amount Filled: 0 / ${troops.toLocaleString()}`
        ].join('\n');

        await thread.send({ content: body });

        const alertParts = [`@everyone`, `New defcall: <#${thread.id}>`];
        if (comment) alertParts.push(`\n${comment}`);
        await targetChannel.send({ content: alertParts.join('\n'), allowedMentions: { parse: ['everyone'] } });

        await interaction.editReply({ content: `Created thread <#${thread.id}>` });
    }
};
