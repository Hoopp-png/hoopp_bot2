const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'cosas',
    description: 'Muestra los cosméticos que has comprado.',
    async execute(message, args, supabase) {
        const discordId = message.author.id;

        // 1. Fetch de la cuenta
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('discord_id', discordId)
            .maybeSingle();

        if (profileError || !profile) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff3333')
                .setDescription('❌ **No encontré tu cuenta.**\nVincula tu Discord en Hoopp Web primero.');
            return message.reply({ embeds: [errorEmbed] });
        }

        // 2. Fetch de las compras
        const { data: orders, error } = await supabase
            .from('store_orders')
            .select('item_id, created_at')
            .eq('user_id', profile.user_id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('INVENTARIO ERROR:', error);
            const fatalEmbed = new EmbedBuilder()
                .setColor('#ff3333')
                .setDescription('❌ **Error interno al consultar tu inventario.**');
            return message.reply({ embeds: [fatalEmbed] });
        }

        const cosmetics = (orders || []).filter(o =>
            o.item_id.startsWith('title_') || o.item_id.startsWith('aura_')
        );

        // 3. Manejo de cuando no tiene nada
        if (cosmetics.length === 0) {
            const pobreEmbed = new EmbedBuilder()
                .setColor('#2b2d31') // Color gris oscuro modo noche de Discord
                .setDescription('📦 **Foking pobre no tienes nada.**\nVisita la tienda en Hoopp Web para pillarte algo.');
            return message.reply({ embeds: [pobreEmbed] });
        }

        // 4. Formateo pro de la lista
        const lista = cosmetics.map(c => {
            const isTitle = c.item_id.startsWith('title_');
            const emoji = isTitle ? '🏷️' : '✨';
            
            // Limpia "title_rey_demonio" a "Rey Demonio"
            const nombreRaw = c.item_id.replace(/^(title_|aura_)/, '');
            const nombreLimpio = nombreRaw.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            // Timestamp nativo de Discord (muestra "hace 3 horas", "hace 2 días")
            const unixTime = Math.floor(new Date(c.created_at).getTime() / 1000);

            return `${emoji} **${nombreLimpio}** - <t:${unixTime}:R>`;
        }).join('\n\n'); // Doble salto para que respire el texto

        // 5. El Embed final visualmente mejorado
        const embed = new EmbedBuilder()
            .setColor('#a994ff')
            .setAuthor({ 
                name: `Inventario de ${message.author.username}`, 
                iconURL: message.author.displayAvatarURL({ dynamic: true, size: 1024 }) 
            })
            .setDescription(`Tus cosméticos de Hoopp:\n\n${lista}`)
            // Cambia este link por un GIF aesthetic que pegue con tu bot (magia, mochila, etc)
            .setThumbnail('https://media.giphy.com/media/l41lOlmOS0hnki7xK/giphy.gif')
            // Cambia este link por el logo de tu bot o comunidad
            .setFooter({ text: 'Hoopp Web Store', iconURL: 'https://i.imgur.com/TuwBpwO.png' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
