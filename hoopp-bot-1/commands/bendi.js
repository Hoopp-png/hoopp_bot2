// commands/bendiciones.js — solo admin (is_admin en profiles)
const { EmbedBuilder } = require('discord.js');

const ITEM_LABELS = {
    welkin:   '🌙 Bendición Lunar (Genshin)',
    hsr_pass: '🚂 Pase Express (HSR)',
    zzz_pass: '⚡ Pase de Suministros (ZZZ)',
};

module.exports = {
    name: 'bendi',
    description: '(Admin) Lista las compras de bendiciones/pases.',
    async execute(message, args, supabase) {
        const { data: adminProfile, error: adminError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('discord_id', message.author.id)
            .maybeSingle();

        if (adminError || !adminProfile?.is_admin) {
            return message.reply('❌ No tienes permiso para usar este comando.');
        }

        const { data: orders, error } = await supabase
            .from('store_orders')
            .select('id, item_id, game_uid, created_at, user_id')
            .in('item_id', Object.keys(ITEM_LABELS))
            .order('created_at', { ascending: false })
            .limit(15);

        if (error) {
            console.error('BENDICIONES ERROR:', error);
            return message.reply('❌ Error al consultar las compras.');
        }
        if (!orders || orders.length === 0) {
            return message.reply('📦 No hay compras registradas.');
        }

        const userIds = [...new Set(orders.map(o => o.user_id))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, discord_id, genshin_uid')
            .in('user_id', userIds);

        const lines = await Promise.all(orders.map(async (o) => {
            const p = profiles?.find(pr => pr.user_id === o.user_id);
            let tag = 'Usuario desconocido';
            if (p?.discord_id) {
                try {
                    tag = (await message.client.users.fetch(p.discord_id)).tag;
                } catch {
                    tag = `<@${p.discord_id}>`;
                }
            }
            const fecha = new Date(o.created_at).toLocaleDateString('es-SV');
            return `${ITEM_LABELS[o.item_id]}\n👤 ${tag} | 🎮 UID: ${o.game_uid || p?.genshin_uid || 'N/A'} | 📅 ${fecha}`;
        }));

        const embed = new EmbedBuilder()
            .setColor('#a994ff')
            .setTitle('🎁 Últimas compras de bendiciones')
            .setDescription(lines.join('\n\n'))
            .setFooter({ text: 'Solo visible para administradores' });

        message.reply({ embeds: [embed] });
    }
};
