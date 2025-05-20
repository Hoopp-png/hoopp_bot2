const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: "comandos",
  description: "comandos",
   execute(message, args, client) { 
    const embed = new EmbedBuilder()
      .setTitle('Lista de comandos')
      .setColor('Random')
      .setDescription('Aquí están los comandos que puedes usar:')
      .addFields(
        { name: '!ping', value: '`Pong`' },
        { name: '!userinfo', value: '`Muestra información de un usuario de discord y genshin.`' },
       
    )
      .setFooter({ text: 'Desarrollado por Hoopp', iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
  };
  
