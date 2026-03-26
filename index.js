require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Collection for commands
client.commands = new Collection();

// ---------------------
// Load Commands
// ---------------------
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

// ---------------------
// Register slash commands
// ---------------------
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log('Slash commands registered.');
    } catch (err) {
        console.error('Error registering commands:', err);
    }
})();

// ---------------------
// Load Events
// ---------------------
const eventFiles = fs.readdirSync('./events').filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client, client.commands));
    }
}

// ---------------------
// Login
// ---------------------
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
