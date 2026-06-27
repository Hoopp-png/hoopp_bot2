// commands/perfil.js — VERSIÓN MEJORADA, reemplaza la anterior completa
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'perfil',
    description: 'Muestra tu perfil completo: Discord + Hoopp Web.',
    async execute(message, args, supabase) {
        const discordUser = message.mentions.users.first() || message.author;
        const discordId = discordUser.id;

        const { data, error } = await supabase
            .from('profiles')
            .select('hooppcoins, equipped_title, equipped_theme, genshin_uid')
            .eq('discord_id', discordId)
            .maybeSingle();

        if (error || !data) {
            return message.reply(
                discordUser.id === message.author.id
                    ? '❌ No encontré tu cuenta. ¿Ya vinculaste tu Discord en Hoopp Web?'
                    : `❌ ${discordUser.username} no tiene cuenta vinculada en Hoopp Web.`
            );
        }

        const member = message.guild?.members.cache.get(discordId);
        const joinedServer = member?.joinedAt
            ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:D>`
            : 'Desconocido';
        const accountCreated = `<t:${Math.floor(discordUser.createdAt.getTime() / 1000)}:D>`;

        const embed = new EmbedBuilder()
            .setColor('#a994ff')
            .setAuthor({ name: discordUser.tag, iconURL: discordUser.displayAvatarURL() })
            .setThumbnail(discordUser.displayAvatarURL({ size: 256 }))
            .setTitle('Perfil de Hoopp')
            .addFields(
                { name: '🪙 HooppCoins', value: `${data.hooppcoins}`, inline: true },
                { name: '🏷️ Título', value: `${data.equipped_title || 'Ninguno'}`, inline: true },
                { name: '🎨 Aura', value: `${data.equipped_theme || 'Default'}`, inline: true },
                { name: '🍃 UID Genshin', value: `${data.genshin_uid || 'No vinculado'}`, inline: true },
                { name: '📅 Cuenta de Discord', value: accountCreated, inline: true },
                { name: '🚪 En el server desde', value: joinedServer, inline: true },
            );

        message.reply({ embeds: [embed] });
    }
};
