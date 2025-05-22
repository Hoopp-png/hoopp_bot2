const fs = require('fs');
const path = require('path');
const ticketConfigPath = path.join(__dirname, 'data/ticket_config.json');

module.exports = {
  name: 'setticket',
  description: 'Configura el mensaje de ticket con reacción 🎫',
  async execute(message, args) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ No tenés permiso para usar este comando.');
    }

    const embed = {
      title: '📩 Sistema de Tickets',
      description: 'Reaccioná con 🎫 para abrir un ticket.',
      color: 0x00bfff
    };

    const ticketMsg = await message.channel.send({ embeds: [embed] });
    await ticketMsg.react('🎫');

    const config = {
      ticketChannelId: message.channel.id,
      ticketMessageId: ticketMsg.id
    };

    fs.writeFileSync(ticketConfigPath, JSON.stringify(config, null, 2));
    message.reply('✅ Sistema de tickets configurado correctamente.');
  }
};
