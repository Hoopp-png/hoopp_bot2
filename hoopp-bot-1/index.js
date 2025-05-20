require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildPresences // Para detectar estados como "online"
      // para reacciones en DMs
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION']  // ¡importante! para manejar reacciones en mensajes parciales
});
 const statuses = [
        'Moderando el server',
        'Usa !comandos para ver lo que hago',
        'Cuidando el canal 👀',
        'Estoy en línea 🤖',
        '¿Me mencionaste?'
    ];

    let index = 0;
    setInterval(() => {
        const status = statuses[index % statuses.length];
        client.user.setPresence({
            activities: [{ name: status, type: 0 }],
            status: 'online'
        });
        index++;
    }, 10000); // cambia cada 10 segundos


client.commands = new Map();

// Cargar economía y tienda
const economyPath = './data/economy.json';
const shopPath = './data/shop.json';

// Crear carpeta 'data' si no existe
if (!fs.existsSync('./data')) fs.mkdirSync('./data');

// Crear archivos si no existen
if (!fs.existsSync(economyPath)) fs.writeFileSync(economyPath, '{}');
if (!fs.existsSync(shopPath)) fs.writeFileSync(shopPath, '{}');

// Cargar datos
let economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
let shop = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
// Funciones para guardar
function saveEconomy() {
    fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
}
function saveShop() {
    fs.writeFileSync(shopPath, JSON.stringify(shop, null, 2));
}

// Cargar comandos
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log(`Bot iniciado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        command.execute(message, args, economy, saveEconomy, shop, saveShop);
    } catch (err) {
        console.error(err);
        message.reply('Hubo un error ejecutando ese comando.');
    }
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    if (message.mentions.has(client.user)) {
        const descriptions = [
            "¿Necesitás ayuda? Usa `!comandos` para ver lo que puedo hacer.",
            "¡Hey!",
            "Hola, soy un bot 🤖",
            "¿Me mencionaste? Estoy listo para ayudarte, usa `!comandos`.",
            "¿Buscas comandos? Probá `!comandos`."
        ];

        const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];

        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle(`¡Hola! Soy ${client.user.username}`)
            .setDescription(randomDescription)
            .setFooter({ text: 'Desarrollado por Hoopp', iconURL: client.user.displayAvatarURL() });

        message.reply({ embeds: [embed] });
    }
});

client.login(process.env.TOKEN);
