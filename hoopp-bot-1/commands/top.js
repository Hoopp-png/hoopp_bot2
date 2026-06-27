// commands/top.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'top',
    description: 'Muestra el top 10 de jugadores por puntaje.',
    async execute(message, args, supabase) {
        // ⚠️ Suma TODO el historial de scores. Si tu leaderboard.ts filtra por
        // temporada (desde el último announced_at), agrega ese mismo filtro aquí.
        const { data, error } = await supabase.from('scores').select('user_id, score');

        if (error || !data) {
            console.error('TOP ERROR:', error);
            return message.reply('❌ Error al consultar el leaderboard.');
        }

        const totals = {};
        for (const row of data) totals[row.user_id] = (totals[row.user_id] || 0) + row.score;

        const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (ranked.length === 0) return message.reply('📊 Todavía no hay puntajes registrados.');

        const userIds = ranked.map(([userId]) => userId);
        const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, discord_id')
            .in('user_id', userIds);

        const medals = ['🥇', '🥈', '🥉'];
        const lines = ranked.map(([userId, total], i) => {
            const p = profiles?.find(pr => pr.user_id === userId);
            const mention = p?.discord_id ? `<@${p.discord_id}>` : 'Jugador desconocido';
            return `${medals[i] || `#${i + 1}`} ${mention} — **${total}** pts`;
        });

        message.reply({ embeds: [new EmbedBuilder().setColor('#a994ff').setTitle('🏆 Top 10 Hoopp Web').setDescription(lines.join('\n'))] });
    }
};
