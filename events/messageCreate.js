const { parseAmount } = require('../utils/parseAmount');
const { createVillageLink } = require('../utils/createVillageLink');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        // ----------- Village link from (x/y) in normal messages -----------
        const match = message.content.match(/\((\d+)\/(\d+)\)/);
        if (match && !message.channel.isThread()) {
            const x = match[1];
            const y = match[2];
            const url = createVillageLink(x, y);
            message.reply(`Generating village link: ${url}`);
            return;
        }

        // ----------- Thread update logic -----------
        if (!message.channel.isThread()) return;

        // Matches +5k, -1000, +2,500 etc.
        const updateMatch = message.content.match(/^([+-])([\d,.]+)(k)?/i);
        if (!updateMatch) return;

        const amount = parseAmount(updateMatch);
        const operator = updateMatch[1];

        try {
            // Fetch the bot's original message in the thread
            const fetchedMessages = await message.channel.messages.fetch({ limit: 50 });
            const botMessages = fetchedMessages.filter(m => m.author.id === client.user.id);
            const originalBotMessage = botMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp).first();

            if (!originalBotMessage) {
                message.reply('⚠️ Cannot find the original thread message to update.');
                return;
            }

            const content = originalBotMessage.content;

            if (content.includes('Defender:')) {
                // Defcall
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
                    await message.channel.setLocked(true).catch(() => { });
                }

            } else if (content.includes('Receiver:')) {
                // Respush
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
                    await message.channel.setLocked(true).catch(() => { });
                }
            }

        } catch (err) {
            console.error('Error updating count:', err);
            message.reply('⚠️ Something went wrong updating the count.');
        }
    }
};
