const { ChannelType } = require('discord.js');
const { parseAmount } = require('../utils/parseAmount');
const { createVillageLink } = require('../utils/createVillageLink');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        const isThread = message.channel.isThread();
        const isRespushChannel = message.channel.type === ChannelType.GuildText
            && message.channel.parentId === process.env.RESPUSH_CATEGORY_ID;

        // Village link from (x/y) in regular channels
        if (!isThread && !isRespushChannel) {
            const match = message.content.match(/\((\d+)\/(\d+)\)/);
            if (match) {
                const url = createVillageLink(match[1], match[2]);
                message.reply(`Generating village link: ${url}`);
            }
            return;
        }

        const updateMatch = message.content.match(/^([+-])([\d,.]+)(k)?/i);
        if (!updateMatch) return;

        const amount = parseAmount(updateMatch);
        const operator = updateMatch[1];

        try {
            // Fetch the oldest messages — reliable regardless of how many messages have accumulated
            const fetched = await message.channel.messages.fetch({ limit: 5, after: '0' });
            const originalBotMessage = fetched
                .filter(m => m.author.id === client.user.id)
                .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
                .first();

            if (!originalBotMessage) {
                message.reply('⚠️ Cannot find the original message to update.');
                return;
            }

            const content = originalBotMessage.content;

            if (content.includes('Defender:')) {
                const troopMatch = content.match(/Amount Filled:\s*([\d,]+)\s*\/\s*([\d,]+)/);
                let current = parseInt(troopMatch[1].replace(/,/g, ''), 10);
                const goal = parseInt(troopMatch[2].replace(/,/g, ''), 10);

                current = operator === '+' ? current + amount : current - amount;
                if (current < 0) current = 0;
                const remaining = Math.max(goal - current, 0);

                await originalBotMessage.edit(content.replace(
                    /Amount Filled:\s*[\d,]+\s*\/\s*[\d,]+/,
                    `Amount Filled: ${current.toLocaleString()} / ${goal.toLocaleString()}`
                ));
                await message.channel.send(`🛡 Troops ${operator === '+' ? 'increased' : 'decreased'} by ${amount.toLocaleString()} (${remaining.toLocaleString()} remaining)`);

                if (current >= goal) {
                    if (!message.channel.name.startsWith('✅ ')) {
                        await message.channel.setName(`✅ ${message.channel.name}`);
                    }
                    await message.channel.send('✅ Goal reached - Locking thread');
                    await message.channel.setLocked(true).catch(() => { });
                }

            } else if (content.includes('Receiver:')) {
                const resMatch = content.match(/Resources:\s*([\d,]+)\s*\/\s*([\d,]+)/);
                let current = parseInt(resMatch[1].replace(/,/g, ''), 10);
                const goal = parseInt(resMatch[2].replace(/,/g, ''), 10);

                if (current >= goal) {
                    await message.channel.send('Thanks, but this push is already complete! Try checking others.');
                    return;
                }

                current = operator === '+' ? current + amount : current - amount;
                if (current < 0) current = 0;
                const remaining = Math.max(goal - current, 0);

                await originalBotMessage.edit(content.replace(
                    /Resources:\s*[\d,]+\s*\/\s*[\d,]+/,
                    `Resources: ${current.toLocaleString()} / ${goal.toLocaleString()}`
                ));
                const villageLinkMatch = content.match(/Village Link:\s*(\S+)/);
                const villageLinkSuffix = villageLinkMatch ? `\n🛖 ${villageLinkMatch[1]}` : '';
                await message.channel.send(`🌾 Resources ${operator === '+' ? 'increased' : 'decreased'} by ${amount.toLocaleString()} (${remaining.toLocaleString()} remaining)${villageLinkSuffix}`);

                if (current >= goal) {
                    if (!message.channel.name.startsWith('✅-')) {
                        await message.channel.setName(`✅-${message.channel.name}`).catch(() => { });
                    }
                    const gifs = [
                        'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnM1Zjh5Y3l3ZW5tazRtaHVheGJ1aWc1Z3ZmeDRoMGNyNjE4ZjR4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JJfkt7QEKRvMY6JwDL/giphy.gif',
                        'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjczZXBkeHM2em10MnRwbjB6ODY4Mm8wb2wxZzF1a2MxanBhNTJjOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MZppavoFOeIlrcWMfK/giphy.gif',
                        'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExczl0OG04ZjhvbjNwdnl5bjE2dDJkZWM1aHBqemVlcXA5dWFrc2QwYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3q2Kgm3KOBUE6wF2/giphy.gif',
                        'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmd3bWQ5bG1iaDN0YWg4dGNnbTY5M2ZuNDczcmJ3enIxbjBuZTV0ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l1EtkTvcg8biz3Vza/giphy.gif',
                        'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExaHBkMzFjeHAwbTNrM3RoYXB4eWdia2F6emsxNWJpdXNlam9kNWVmNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MfTW6bkRhvFzbAZO1p/giphy.gif',
                        'https://tenor.com/fwh5Zj0HmxI.gif',
                        'https://tenor.com/bJqqM.gif',
                        'https://tenor.com/9Sq7.gif',
                        'https://tenor.com/bkgNK.gif',
                        'https://tenor.com/bWV88.gif',
                        'https://tenor.com/enwQKHqnfp4.gif',
                        'https://tenor.com/boh8j.gif',
                    ];
                    const gif = gifs[Math.floor(Math.random() * gifs.length)];
                    await message.channel.send('✅ Goal reached - This push is now closed!');
                    await message.channel.send(gif);
                }
            }

        } catch (err) {
            console.error('Error updating count:', err);
            message.reply('⚠️ Something went wrong updating the count.');
        }
    }
};
