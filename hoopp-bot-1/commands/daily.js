const { EmbedBuilder } = require('discord.js');

const REWARD = 50;
const COOLDOWN_HOURS = 24;

module.exports = {
    name: 'daily',
    description: 'Reclama tus HooppCoins diarios.',
    async execute(message, args, supabase) {
        const discordId = message.author.id;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('hooppcoins, last_daily')
            .eq('discord_id', discordId)
            .maybeSingle();

        if (error || !profile) {
            return message.reply('❌ No encontré tu cuenta. Vincula tu Discord en Hoopp Web primero.');
        }

        const now = new Date();
        const lastClaim = profile.last_daily ? new Date(profile.last_daily) : null;

        if (lastClaim) {
            const hoursSince = (now - lastClaim) / (1000 * 60 * 60);
            if (hoursSince < COOLDOWN_HOURS) {
                const hoursLeft = (COOLDOWN_HOURS - hoursSince).toFixed(1);
                return message.reply(`⏳ Ya reclamaste hoy. Vuelve en **${hoursLeft}h**.`);
            }
        }

        const newBalance = profile.hooppcoins + REWARD;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ hooppcoins: newBalance, last_daily: now.toISOString() })
            .eq('discord_id', discordId);

        if (updateError) return message.reply('❌ Error al reclamar tu daily.');

        const embed = new EmbedBuilder()
            .setColor('#a994ff')
            .setTitle('🎁 Daily Reclamado')
            .setDescription(`Recibiste **${REWARD} HooppCoins**.\nBalance actual: **${newBalance}**`);

        message.reply({ embeds: [embed] });
    }
};
