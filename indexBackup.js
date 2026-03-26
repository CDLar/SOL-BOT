require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, Events, ChannelType } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

/* --------------------------
   Define commands
   -------------------------- */
const defcallCommand = new SlashCommandBuilder()
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
    .toJSON();

const respushCommand = new SlashCommandBuilder()
    .setName('respush')
    .setDescription('Create a resource push thread')
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
    .toJSON();

/* --------------------------
   Register commands
   -------------------------- */
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: [defcallCommand, respushCommand] }
        );
        console.log('Slash commands registered.');
    } catch (err) {
        console.error('Error registering commands:', err);
    }
})();

/* --------------------------
   Event handlers
   -------------------------- */
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Auto village link reply if a message contains "(x/y)"
    const match = message.content.match(/\((\d+)\/(\d+)\)/);
    if (match) {
        const x = match[1];
        const y = match[2];
        const url = `https://ts1.x1.europe.travian.com/karte.php?x=${x}&y=${y}`;
        message.reply(`Generating village link: ${url}`);
        return;
    }

    // Only run in threads
    if (!message.channel.isThread()) return;

    // Regex supports +5k, -1.5k, etc.
    const updateMatch = message.content.match(/^([+-])([\d,.]+)(k)?/i);
    if (!updateMatch) return;

    const operator = updateMatch[1];
    let amount = parseFloat(updateMatch[2].replace(/,/g, ''));

    // If 'k' or 'K' is present, treat it as thousands
    if (updateMatch[3]) {
        amount *= 1000;
    }

    // Round final amount to avoid decimals
    amount = Math.round(amount);

    try {
        // Get last 50 messages to find the bot's original thread message
        const fetchedMessages = await message.channel.messages.fetch({ limit: 50 });
        const botMessages = fetchedMessages.filter(m => m.author.id === client.user.id);
        const originalBotMessage = botMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp).first();

        if (!originalBotMessage) {
            message.reply('⚠️ Cannot find the original thread message to update.');
            return;
        }

        const content = originalBotMessage.content;

        /* ----------- DEF CALL THREAD ----------- */
        if (content.includes('Defender:')) {
            const troopMatch = content.match(/Amount filled:\s*([\d,]+)\s*\/\s*([\d,]+)/);
            let current = parseInt(troopMatch[1].replace(/,/g, ''), 10);
            const goal = parseInt(troopMatch[2].replace(/,/g, ''), 10);

            current = operator === '+' ? current + amount : current - amount;
            if (current < 0) current = 0;

            const remaining = Math.max(goal - current, 0);

            const updatedContent = content.replace(
                /Amount filled:\s*[\d,]+\s*\/\s*[\d,]+/,
                `Amount filled: ${current.toLocaleString()} / ${goal.toLocaleString()}`
            );

            await originalBotMessage.edit(updatedContent);
            await message.channel.send(`🛡 Troops ${operator === '+' ? 'increased' : 'decreased'} by ${amount.toLocaleString()} (${remaining.toLocaleString()} remaining)`);

            if (current >= goal) {
                if (!message.channel.name.startsWith('✅ ')) {
                    await message.channel.setName(`✅ ${message.channel.name}`);
                }
                await message.channel.send('✅ Goal reached - Locking thread');
                try {
                    await message.channel.setLocked(true);
                } catch (error) {
                    console.error('Failed to lock thread:', error);
                }
            }

            /* ----------- RES PUSH THREAD ----------- */
        } else if (content.includes('Receiver:')) {
            const resMatch = content.match(/Resources:\s*([\d,]+)\s*\/\s*([\d,]+)/);
            let current = parseInt(resMatch[1].replace(/,/g, ''), 10);
            const goal = parseInt(resMatch[2].replace(/,/g, ''), 10);

            current = operator === '+' ? current + amount : current - amount;
            if (current < 0) current = 0;

            const remaining = Math.max(goal - current, 0);

            const updatedContent = content.replace(
                /Resources:\s*[\d,]+\s*\/\s*[\d,]+/,
                `Resources: ${current.toLocaleString()} / ${goal.toLocaleString()}`
            );

            await originalBotMessage.edit(updatedContent);
            await message.channel.send(`🌾 Resources ${operator === '+' ? 'increased' : 'decreased'} by ${amount.toLocaleString()} (${remaining.toLocaleString()} remaining)`);

            if (current >= goal) {
                if (!message.channel.name.startsWith('✅ ')) {
                    await message.channel.setName(`✅ ${message.channel.name}`);
                }
                await message.channel.send('✅ Goal reached - Locking thread');
                try {
                    await message.channel.setLocked(true);
                } catch (error) {
                    console.error('Failed to lock thread:', error);
                }
            }
        }

        // Delete the update message to keep thread clean
        await message.delete().catch(() => { });

    } catch (err) {
        console.error('Error updating count:', err);
        message.reply('⚠️ Something went wrong updating the count.');
    }
});

/* --------------------------
   Slash command handling
   -------------------------- */
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
        /* ----------- DEF CALL COMMAND ----------- */
        if (interaction.commandName === 'defcall') {
            const defenderDisplay = interaction.options.getString('defender', true);
            const attacker = interaction.options.getString('attacker', true);
            const village = interaction.options.getString('village', true); // plain text
            const coords = interaction.options.getString('coords', true);   // "x/y"
            const [x, y] = coords.split('/').map(v => v.trim());
            const eta = interaction.options.getString('eta', true);
            const troops = interaction.options.getInteger('troops', true);

            const villageLink = `https://ts1.x1.europe.travian.com/karte.php?x=${x}&y=${y}`;

            await interaction.deferReply({ ephemeral: false });

            const threadName = `${defenderDisplay} 🛡 (${troops.toLocaleString()})`;
            const thread = await interaction.channel.threads.create({
                name: threadName.length > 100 ? threadName.slice(0, 100) : threadName,
                autoArchiveDuration: 1440,
                reason: `Defcall created by ${interaction.user.tag}`,
                type: ChannelType.PublicThread
            });

            const body = [
                `Defender: ${defenderDisplay}`,
                `Attacker: ${attacker}`,
                `Village: ${village}`,
                `Coords: ${coords}`,
                `Village Link: ${villageLink}`,
                `ETA: ${eta} (Server time)`,
                `Amount filled: 0 / ${troops.toLocaleString()}`
            ].join('\n');

            await thread.send({ content: body });
            await interaction.editReply({ content: `Created thread <#${thread.id}>` });

            /* ----------- RES PUSH COMMAND ----------- */
        } else if (interaction.commandName === 'respush') {
            const name = interaction.options.getString('name', true);
            const village = interaction.options.getString('village', true); // plain text
            const coords = interaction.options.getString('coords', true);   // "x/y"
            const [x, y] = coords.split('/').map(v => v.trim());
            const res = interaction.options.getInteger('res', true);

            const villageLink = `https://ts1.x1.europe.travian.com/karte.php?x=${x}&y=${y}`;

            await interaction.deferReply({ ephemeral: false });

            const threadName = `${name} 🌾 (${res.toLocaleString()})`;
            const thread = await interaction.channel.threads.create({
                name: threadName.length > 100 ? threadName.slice(0, 100) : threadName,
                autoArchiveDuration: 1440,
                reason: `Respush created by ${interaction.user.tag}`,
                type: ChannelType.PublicThread
            });

            const body = [
                `Receiver: ${name}`,
                `Village: ${village}`,
                `Coords: ${coords}`,
                `Village Link: ${villageLink}`,
                `Resources: 0 / ${res.toLocaleString()}`
            ].join('\n');

            await thread.send({ content: body });
            await interaction.editReply({ content: `Created resource push thread <#${thread.id}>` });
        }
    } catch (error) {
        console.error(`Error in /${interaction.commandName} command:`, error);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: '❌ Something went wrong creating the thread.' });
        } else {
            await interaction.reply({ content: '❌ Something went wrong creating the thread.', ephemeral: true });
        }
    }
});

client.login(TOKEN);