// commands/perfil.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'perfil',
    description: 'Muestra tu perfil completo: Discord + Hoopp Web.',
    async execute(message, args, supabase) {
        const discordUser = message.mentions.users.first() || message.author;
        const discordId = discordUser.id;

        // 1. Fetch completo del usuario para sacar su Banner de Discord
        await discordUser.fetch();

        // 2. Consulta a Supabase
        const { data, error } = await supabase
            .from('profiles')
            .select('hooppcoins, equipped_title, equipped_theme, genshin_uid')
            .eq('discord_id', discordId)
            .maybeSingle();

        if (error || !data) {
            const errorMsg = discordUser.id === message.author.id
                ? '❌ **No encontré tu cuenta.**\nVincula tu Discord en Hoopp Web primero.'
                : `❌ **${discordUser.username}** no tiene su cuenta vinculada en Hoopp Web.`;
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff3333')
                .setDescription(errorMsg);
                
            return message.reply({ embeds: [errorEmbed] });
        }

        // 3. Limpieza de Título y Aura (para que no se vea feo tipo "title_pro")
        const cleanName = (str) => {
            if (!str) return 'Ninguno';
            const raw = str.replace(/^(title_|aura_)/, '');
            return raw.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        };

        const tituloLimpio = cleanName(data.equipped_title);
        const auraLimpia = cleanName(data.equipped_theme);

        // 4. Fechas nativas de Discord
        const member = message.guild?.members.cache.get(discordId);
        const joinedServer = member?.joinedAt
            ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` // El :R muestra "hace 2 meses"
            : 'Desconocido';
        const accountCreated = `<t:${Math.floor(discordUser.createdAt.getTime() / 1000)}:d>`; // El :d muestra "12/08/2023"

        // 5. Configurar la imagen grande (Banner o Imagen por defecto)
        const bannerUrl = discordUser.bannerURL({ dynamic: true, size: 512 });
        // Si no tiene banner, usa un GIF genérico de Hoopp que se vea guapo de fondo
        const imageUrl = bannerUrl || 'https://media.giphy.com/media/xUPGcwHkF2fAozwI9W/giphy.gif'; 

        // 6. Construir el Embed Modo Dios
        const embed = new EmbedBuilder()
            // Usa el color del perfil de Discord del usuario si lo tiene, si no el morado default
            .setColor(discordUser.hexAccentColor || '#a994ff')
            .setAuthor({ 
                name: `Perfil de ${discordUser.globalName || discordUser.username}`, 
                iconURL: discordUser.displayAvatarURL({ dynamic: true, size: 1024 }) 
            })
            // Thumbnail chiquito arriba a la derecha
            .setThumbnail(discordUser.displayAvatarURL({ dynamic: true, size: 256 }))
            // La imagen grande abajo (Banner)
            .setImage(imageUrl)
            .setDescription(`> 🏷️ **Título:** ${tituloLimpio}\n> 🎨 **Aura:** ${auraLimpia}`)
            .addFields(
                { name: '🪙 HooppCoins', value: `**${data.hooppcoins.toLocaleString()}**`, inline: true },
                { name: '🍃 UID Genshin', value: `\`${data.genshin_uid || 'No vinculado'}\``, inline: true },
                { name: '\u200B', value: '\u200B', inline: true }, // Espacio en blanco para cuadrar las columnas
                { name: '📅 Creación Discord', value: accountCreated, inline: true },
                { name: '🚪 Llegó al server', value: joinedServer, inline: true }
            )
            .setFooter({ text: 'Hoopp Web' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
