const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { supabase, DAILY_TABLE } = require('../utils/supabase');
const { createVillageLink } = require('../utils/createVillageLink');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playerlookup')
        .setDescription('Look up a player\'s villages from the map data')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('Player name to search for')
                .setRequired(true)),

    async execute(interaction) {
        const playerName = interaction.options.getString('player', true);

        await interaction.deferReply();

        const { data, error } = await supabase
            .from(DAILY_TABLE)
            .select('X, Y, "Village name", "Player name", "Alliance Tag", Population, Tribe, Capital')
            .ilike('"Player name"', playerName)
            .limit(100);

        if (error) {
            return interaction.editReply(`⚠️ Failed to fetch data: ${error.message}`);
        }

        if (!data || data.length === 0) {
            return interaction.editReply(`No player found matching **${playerName}**.`);
        }

        const villages = data.map(row => ({
            x: Number(row.X),
            y: Number(row.Y),
            name: row['Village name'] ?? '',
            playerName: row['Player name'] ?? '',
            allianceTag: row['Alliance Tag'] ?? '',
            population: Number(row.Population),
            isCapital: Boolean(row.Capital),
        }));

        villages.sort((a, b) => b.population - a.population);

        const resolvedName = villages[0].playerName;
        const allianceTag = villages[0].allianceTag || 'None';
        const totalPop = villages.reduce((sum, v) => sum + v.population, 0);

        const villageLines = villages.map(v => {
            const capital = v.isCapital ? ' ★' : '';
            const link = createVillageLink(v.x, v.y);
            return `[${v.name}${capital}](${link}) (${v.x}/${v.y}) — ${v.population.toLocaleString()} pop`;
        });

        const embed = new EmbedBuilder()
            .setTitle(`${resolvedName}`)
            .setDescription(`**Alliance:** ${allianceTag}\n**Villages:** ${villages.length} | **Total pop:** ${totalPop.toLocaleString()}`)
            .setColor(0x5865f2);

        const CHUNK = 15;
        for (let i = 0; i < villageLines.length; i += CHUNK) {
            const chunk = villageLines.slice(i, i + CHUNK).join('\n');
            embed.addFields({ name: i === 0 ? 'Villages' : '\u200b', value: chunk });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};
