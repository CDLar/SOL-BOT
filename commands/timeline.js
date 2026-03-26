const { SlashCommandBuilder } = require('discord.js');

const EVENTS = [
    { name: 'Artefacts', date: new Date('2026-04-27') },
    { name: 'Construction plans', date: new Date('2026-07-26') },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeline')
        .setDescription('Shows days remaining until key server events'),

    async execute(interaction) {
        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        const lines = EVENTS.map(({ name, date }) => {
            const days = Math.round((date - today) / 86_400_000);
            return `**${days}** days until ${name}`;
        });

        await interaction.reply({ content: lines.join('\n') });
    }
};
