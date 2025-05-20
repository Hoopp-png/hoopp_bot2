const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'test',
  description: 'Test para reacciones',
  async execute(message) {
    console.log('Comando testreact iniciado');

    const embed = new EmbedBuilder()
      .setColor('Random')
      .setTitle('Reacciona con ✅ o ❌');

    const msg = await message.channel.send({ embeds: [embed] });
    console.log('Mensaje enviado, agregando reacciones');

    await msg.react('✅');
    await msg.react('❌');
    console.log('Reacciones agregadas');

    const filter = (reaction, user) => {
      console.log(`Reacción detectada: ${reaction.emoji.name} de ${user.tag}`);
      return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
    };

    try {
      const collected = await msg.awaitReactions({ filter, max: 1, time: 30000, errors: ['time'] });
      const reaction = collected.first();
      await message.channel.send(`Elegiste la reacción ${reaction.emoji.name}`);
    } catch {
      await message.channel.send('No reaccionaste a tiempo.');
    }
  }
};