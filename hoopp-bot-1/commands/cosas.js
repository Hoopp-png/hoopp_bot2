// commands/inventario.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'cosas',
    description: 'Muestra los cosméticos que has comprado.',
    async execute(message, args, supabase) {
        const discordId = message.author.id;

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('discord_id', discordId)
            .maybeSingle();

        if (profileError || !profile) {
            return message.reply('❌ No encontré tu cuenta. Vincula tu Discord en Hoopp Web primero.');
        }

        const { data: orders, error } = await supabase
            .from('store_orders')
            .select('item_id, created_at')
            .eq('user_id', profile.user_id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('INVENTARIO ERROR:', error);
            return message.reply('❌ Error al consultar tu inventario.');
        }

        const cosmetics = (orders || []).filter(o =>
            o.item_id.startsWith('title_') || o.item_id.startsWith('aura_')
        );

        if (cosmetics.length === 0) {
            return message.reply('📦 Foking pobre no tienes nada. Visita la tienda en Hoopp Web.');
        }

        const lista = cosmetics.map(c => {
            const tipo = c.item_id.startsWith('title_') ? '🏷️ Título' : '🎨 Aura';
            const nombre = c.item_id.replace(/^(title_|aura_)/, '');
            return `${tipo}: **${nombre}**`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor('#a994ff')
            .setTitle('🎒 Tu Inventario')
            .setDescription(lista);

        message.reply({ embeds: [embed] });
    }
};
