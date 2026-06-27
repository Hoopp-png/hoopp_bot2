// commands/perfil.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'perfil',
    description: 'Muestra tu perfil y HooppCoins extraídos de la web.',
    async execute(message, args, supabase) {
        const discordId = message.author.id;

        const { data, error } = await supabase
            .from('profiles')
            .select('hooppcoins, equipped_title')
            .eq('discord_id', discordId)
            .maybeSingle();

        if (error || !data) {
            return message.reply("❌ No encontré tu cuenta. ¿Ya vinculaste tu Discord en Hoopp Web?");
        }

        const embed = new EmbedBuilder()
            .setColor('#a994ff')
            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
            .setTitle(`Perfil de Hoopp`)
            .addFields(
                { name: '🪙 HooppCoins', value: `${data.hooppcoins}`, inline: true },
                { name: '🏷️ Título Equipado', value: `${data.equipped_title || 'Ninguno'}`, inline: true }
            );

        message.reply({ embeds: [embed] });
    }
};
