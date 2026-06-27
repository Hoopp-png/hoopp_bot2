// commands/apostar.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'apostar',
    description: 'Apuesta tus HooppCoins en un coinflip 50/50. Uso: !apostar <cantidad>',
    async execute(message, args, supabase) {
        const discordId = message.author.id;
        const amount = parseInt(args[0], 10);

        if (!amount || amount <= 0) {
            return message.reply('⚠️ Uso correcto: `!apostar 100`');
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('discord_id', discordId)
            .maybeSingle();

        if (profileError || !profile) {
            return message.reply('❌ No encontré tu cuenta. Vincula tu Discord en Hoopp Web primero.');
        }

        const { data: result, error } = await supabase.rpc('place_bet_atomic', {
            p_user_id: profile.user_id,
            p_amount: amount,
        });

        if (error) {
            console.error('APOSTAR ERROR:', error);
            return message.reply('❌ Error al procesar la apuesta.');
        }

        if (result?.error) {
            return message.reply(`❌ ${result.error}`);
        }

        const embed = new EmbedBuilder()
            .setColor(result.won ? '#34d399' : '#ef4444')
            .setTitle(result.won ? '🪙 ¡Ganaste!' : '💀 Perdiste')
            .setDescription(
                result.won
                    ? `Duplicaste tu apuesta de **${amount}**.`
                    : `Perdiste **${amount}** HooppCoins.`
            )
            .addFields({ name: 'Balance actual', value: `${result.new_balance}` });

        message.reply({ embeds: [embed] });
    }
};
