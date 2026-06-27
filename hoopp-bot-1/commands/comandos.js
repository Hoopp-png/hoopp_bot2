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
        { name: '!perfil', value: '`Muestra información de un usuario de discord y genshin.`' },
         { name: '!daily', value: '`¡Gana 100 HooppCoins diarias!`' },
         { name: '!donar', value: '`no lo he hecho.`' },
         { name: '!apostar', value: '`Apuesta tilin, pierde todas tus hooppscoins.`' },
         { name: '!top', value: '`Muestra información del top 10 de la quincena.`' },
         { name: '!cosas', value: '`Muestra información de tu inventario en Hoopp Web.`' },
       
    )
      .setFooter({ text: 'Desarrollado por Hoopp', iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
  };
  
