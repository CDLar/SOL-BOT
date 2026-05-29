const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('memberlist')
        .setDescription('Export a CSV of all server members with their display names'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const members = await interaction.guild.members.fetch();

        const rows = ['Display Name,Username,User ID'];

        members
            .filter(m => !m.user.bot)
            .sort((a, b) => {
                const nameA = (a.nickname ?? a.user.globalName ?? a.user.username).toLowerCase();
                const nameB = (b.nickname ?? b.user.globalName ?? b.user.username).toLowerCase();
                return nameA.localeCompare(nameB);
            })
            .forEach(m => {
                const displayName = m.nickname ?? m.user.globalName ?? m.user.username;
                const username = m.user.username;
                const id = m.user.id;
                // Wrap fields in quotes and escape any internal quotes
                const escape = val => `"${String(val).replace(/"/g, '""')}"`;
                rows.push(`${escape(displayName)},${escape(username)},${escape(id)}`);
            });

        const csv = rows.join('\n');
        const buffer = Buffer.from(csv, 'utf-8');
        const file = new AttachmentBuilder(buffer, { name: 'members.csv' });

        await interaction.editReply({
            content: `Found **${rows.length - 1}** members.`,
            files: [file]
        });
    }
};
