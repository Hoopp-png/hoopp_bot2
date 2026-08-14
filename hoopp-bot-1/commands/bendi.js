// commands/bendiciones.js — solo admin (is_admin en perfiles)
const { EmbedBuilder } = require('discord.js');

const ITEM_LABELS = {
    welkin:   '🌙 **Bendición Lunar** (Genshin)',
    hsr_pass: '🚂 **Pase Express** (HSR)',
    zzz_pass: '⚡ **Pase de Suministros** (ZZZ)',
};

module.exports = {
    name: 'bendi',
    description: '(Admin) Lista las compras de bendiciones/pases.',
    async execute(message, args, supabase) {
        // 1. Verificación de Admin
        const { data: adminProfile, error: adminError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('discord_id', message.author.id)
            .maybeSingle();

        if (adminError || !adminProfile?.is_admin) {
            const noPermsEmbed = new EmbedBuilder()
                .setColor('#ff3333')
                .setDescription('⛔ **Acceso denegado.**\nEste comando es exclusivo para la administración de Hoopp.');
            return message.reply({ embeds: [noPermsEmbed] });
        }

        // 2. Fetch de los últimos 15 pedidos
        const { data: orders, error } = await supabase
            .from('store_orders')
            .select('id, item_id, game_uid, created_at, user_id')
            .in('item_id', Object.keys(ITEM_LABELS))
            .order('created_at', { ascending: false })
            .limit(15);

        if (error) {
            console.error('BENDICIONES ERROR:', error);
            return message.reply('❌ **Error de base de datos** al consultar las compras.');
        }

        if (!orders || orders.length === 0) {
            const emptyEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setDescription('📦 **Todo limpio.**\nNadie ha comprado pases o bendiciones recientemente.');
            return message.reply({ embeds: [emptyEmbed] });
        }

        // 3. Fetch de los perfiles para sacar los Discord IDs y Genshin UIDs
        const userIds = [...new Set(orders.map(o => o.user_id))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, discord_id, genshin_uid')
            .in('user_id', userIds);

        // 4. Formateo de la lista (Sin await/fetch lentos)
        const lines = orders.map((o, index) => {
            const p = profiles?.find(pr => pr.user_id === o.user_id);
            
            // Discord renderiza esto automáticamente como el nombre del usuario
            const userMention = p?.discord_id ? `<@${p.discord_id}>` : '`Usuario Desconocido`';
            
            // UID clickeable para copiar rápido
            const uid = o.game_uid || p?.genshin_uid || 'No registrado';
            
            // Tiempo relativo nativo
            const unixTime = Math.floor(new Date(o.created_at).getTime() / 1000);

            // Blockquote (>) para que cada pedido se vea como una tarjeta separada
            return `> **${index + 1}.** ${ITEM_LABELS[o.item_id]}\n> 👤 Comprador: ${userMention}\n> 🎮 UID: \`${uid}\`\n> 📅 Hace: <t:${unixTime}:R>`;
        });

        // 5. Construcción del Embed Admin
        const embed = new EmbedBuilder()
            .setColor('#ffd700') // Color dorado/amarillo para resaltar que es panel de admin
            .setAuthor({ 
                name: 'Panel de Administración de Compras', 
                iconURL: 'https://i.imgur.com/8q3uBq9.png' // Cambia por un icono de candado o tu logo admin
            })
            .setTitle('🎁 Últimas Bendiciones y Pases')
            .setDescription(lines.join('\n\n'))
            .setFooter({ text: `Mostrando los últimos ${orders.length} pedidos` })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
