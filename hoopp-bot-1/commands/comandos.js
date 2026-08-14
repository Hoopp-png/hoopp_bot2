// commands/comandos.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: "comandos",
    description: "Muestra la lista de comandos del bot.",
    execute(message, args, client) { 
        
        const embed = new EmbedBuilder()
            .setTitle('📚 Manual de Supervivencia | Hoopp Bot')
            .setColor('#a994ff') // El color oficial del bot
            .setDescription('Aquí tienes todo lo que puedes hacer. Recuerda usar el prefijo `!` antes de cada comando.')
            // Ponemos la foto del bot como imagen en chiquito
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { 
                    name: '💸 Economía y Casino', 
                    value: '> `!daily` - ¡Reclama tus 100 HooppCoins diarias!\n> `!apostar` - Apuesta tilín, pierde todo tu dinero aquí 🤑.\n> `!donar` - Próximamente (no lo he hecho xd).', 
                    inline: false 
                },
                { 
                    name: '🎒 Perfil y Hoopp Web', 
                    value: '> `!perfil` - Muestra tu info de Discord, Genshin y Hoopp.\n> `!cosas` - Tu inventario de cosméticos y auras.\n> `!top` - Top 10 de la quincena (los más tryhards).', 
                    inline: false 
                },
                { 
                    name: '🛠️ Utilidad', 
                    value: '> `!ping` - ¿El bot está vivo? Averígualo.', 
                    inline: false 
                }
            )
            // Aquí arreglé lo del icono para que salga la foto del bot, no la del usuario
            .setFooter({ text: 'Desarrollado por Hoopp', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        // Le metemos unos botones facheritos para redirigir tráfico a tus cosas
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Hoopp Web')
                .setURL('https://tu-enlace-a-hoopp-web.com') // Pon tu link real de Render/Vercel
                .setStyle(ButtonStyle.Link)
                .setEmoji('🌐'),
            new ButtonBuilder()
                .setLabel('Twitch')
                .setURL('https://twitch.tv/tu_canal') // Cambia esto por tu canal
                .setStyle(ButtonStyle.Link)
                .setEmoji('🟣')
        );

        message.reply({ embeds: [embed], components: [row] });
    },
};
