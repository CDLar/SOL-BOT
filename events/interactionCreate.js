module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client, commands) {
        if (!interaction.isChatInputCommand()) return;

        const command = commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing /${interaction.commandName} command:`, error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: '❌ Something went wrong.' });
            } else {
                await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
            }
        }
    }
};
