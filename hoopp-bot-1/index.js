require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot activo!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
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

const { ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const configPath = './data/ticket_config.json';
if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, '{}');
let ticketConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function saveTicketConfig() {
    fs.writeFileSync(configPath, JSON.stringify(ticketConfig, null, 2));
}

// Comando para enviar mensaje de reacción de tickets
client.on('messageCreate', async message => {
    if (message.content === '!setticket' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Sistema de Tickets')
            .setDescription('Reacciona con 🎫 para crear un ticket de soporte.')
            .setColor(0x00bfff);

        const sentMessage = await message.channel.send({ embeds: [embed] });
        await sentMessage.react('🎫');

        ticketConfig[sentMessage.id] = true;
        saveTicketConfig();

        message.reply('✅ Sistema de tickets activado.');
    }
});

// Crear canal cuando reaccionan con 🎫
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.emoji.name !== '🎫') return;

    if (reaction.partial) await reaction.fetch();
    if (!ticketConfig[reaction.message.id]) return;

    const guild = reaction.message.guild;
    const existing = guild.channels.cache.find(c => c.name === `ticket-${user.id}`);
    if (existing) {
        user.send('Ya tenés un ticket abierto.').catch(() => {});
        return;
    }

    const ticketChannel = await guild.channels.create({
        name: `ticket-${user.id}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
            {
                id: guild.roles.everyone,
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: user.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
            {
                id: guild.members.me.roles.highest.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            }
        ]
    });

    const closeButton = new ButtonBuilder()
        .setCustomId(`close-${user.id}`)
        .setLabel('Cerrar ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒');

    const row = new ActionRowBuilder().addComponents(closeButton);

    const embed = new EmbedBuilder()
        .setTitle('🎟️ Ticket Abierto')
        .setDescription(`Hola ${user}, este es tu ticket. Cuando termines, podés cerrarlo con el botón de abajo.`)
        .setColor(0x00bfff);

    await ticketChannel.send({ content: `<@${user.id}>`, embeds: [embed], components: [row] });
});

// Cerrar ticket con botón
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const [action, userId] = interaction.customId.split('-');
    if (action !== 'close') return;

    if (interaction.user.id !== userId) {
        return interaction.reply({ content: '❌ Solo el creador del ticket puede cerrarlo.', ephemeral: true });
    }

    await interaction.reply('🔒 Cerrando el ticket en 3 segundos...');
    setTimeout(() => {
        interaction.channel.delete().catch(console.error);
    }, 3000);
});

client.login(process.env.TOKEN);
