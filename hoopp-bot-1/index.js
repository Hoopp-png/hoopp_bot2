require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require('discord.js');
const fs = require('fs');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

// ─────────────────────────────────────────────
// CONEXIÓN A SUPABASE (El corazón de Hoopp Web)
// ─────────────────────────────────────────────
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Faltan credenciales de Supabase en el archivo .env");
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─────────────────────────────────────────────
// SERVIDOR WEB (Para Railway/Hosting 24/7)
// ─────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('🤖 Hoopp Bot está activo y conectado a Supabase.'));
app.listen(PORT, () => console.log(`🌍 Servidor web corriendo en puerto ${PORT}`));

// ─────────────────────────────────────────────
// CONFIGURACIÓN DEL CLIENTE DISCORD
// ─────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ─────────────────────────────────────────────
// COMMAND HANDLER
// ─────────────────────────────────────────────
client.commands = new Collection();
const commandsPath = './commands';

// Crear carpeta commands si no existe
if (!fs.existsSync(commandsPath)) fs.mkdirSync(commandsPath);

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`${commandsPath}/${file}`);
    client.commands.set(command.name, command);
}

// ─────────────────────────────────────────────
// EVENTOS PRINCIPALES
// ─────────────────────────────────────────────
client.once('ready', () => {
    console.log(`✅ Bot conectado a Discord como ${client.user.tag}`);

    const statuses = [
        'Vigilando Hoopp Web 🌐',
        'Usa !comandos para ver mis comandos, duh',
        'Administrando HooppCoins 🪙',
        'Vigilando el server',
        '¿Me mencionaste?'
    ];

    let index = 0;
    setInterval(() => {
        client.user.setPresence({
            activities: [{ name: statuses[index % statuses.length], type: 0 }],
            status: 'online'
        });
        index++;
    }, 15000);
});

// ── EJECUCIÓN DE COMANDOS ──
const PREFIX = '!';

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        // En lugar de pasarle economy.json, le pasamos la instancia de supabase
        await command.execute(message, args, supabase);
    } catch (err) {
        console.error(`Error ejecutando !${commandName}:`, err);
        message.reply('❌ Hubo un error crítico ejecutando ese comando.');
    }
});

// ── MENCIONES AL BOT ──
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    if (message.mentions.has(client.user)) {
        const embed = new EmbedBuilder()
            .setColor('#a994ff')
            .setTitle(`¡Hola, ${message.author.username}!`)
            .setDescription(`Soy el asistente oficial de **Hoopp**.\nMi prefijo es \`!\`\nEscribe \`!comandos\` para ver qué puedo hacer.`)
            .setFooter({ text: 'Conectado a la base de datos de Hoopp Web', iconURL: client.user.displayAvatarURL() });

        message.reply({ embeds: [embed] });
    }
});

// ─────────────────────────────────────────────
// SISTEMA DE TICKETS
// ─────────────────────────────────────────────
const configPath = './ticket_config.json';
if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, '{}');
let ticketConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function saveTicketConfig() {
    fs.writeFileSync(configPath, JSON.stringify(ticketConfig, null, 2));
}

// Activar sistema de tickets
client.on('messageCreate', async message => {
    if (message.content === '!setticket' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Soporte de Hoopp')
            .setDescription('Reacciona con 🎫 a este mensaje para abrir un ticket privado con los moderadores.')
            .setColor('#a994ff');

        const sentMessage = await message.channel.send({ embeds: [embed] });
        await sentMessage.react('🎫');

        ticketConfig[sentMessage.id] = true;
        saveTicketConfig();

        message.delete().catch(() => {}); // Borra el mensaje !setticket
    }
});

// Abrir ticket por reacción
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.emoji.name !== '🎫') return;

    if (reaction.partial) await reaction.fetch();
    if (!ticketConfig[reaction.message.id]) return;

    // Quitamos la reacción del usuario para que pueda volver a darle luego
    reaction.users.remove(user.id).catch(() => {});

    const guild = reaction.message.guild;
    const existing = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase()}`);
    if (existing) {
        user.send('❌ Ya tienes un ticket abierto en el servidor.').catch(() => {});
        return;
    }

    const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
            { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: guild.members.me.roles.highest.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
        ]
    });

    const closeButton = new ButtonBuilder()
        .setCustomId(`close-${user.id}`)
        .setLabel('Cerrar y Eliminar Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒');

    const row = new ActionRowBuilder().addComponents(closeButton);

    const embed = new EmbedBuilder()
        .setTitle('🎟️ Ticket Abierto')
        .setDescription(`Hola <@${user.id}>, describe tu problema aquí. Los administradores te atenderán pronto.`)
        .setColor('#a994ff');

    await ticketChannel.send({ content: `<@${user.id}>`, embeds: [embed], components: [row] });
});

// Cerrar ticket con el botón
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const [action, userId] = interaction.customId.split('-');
    if (action !== 'close') return;

    // Solo admins o el dueño del ticket pueden cerrarlo
    const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
    if (interaction.user.id !== userId && !isAdmin) {
        return interaction.reply({ content: '❌ Solo el creador o un Administrador puede cerrar esto.', ephemeral: true });
    }

    await interaction.reply('🔒 Cerrando el canal en 5 segundos...');
    setTimeout(() => {
        interaction.channel.delete().catch(console.error);
    }, 5000);
});

// ─────────────────────────────────────────────
// INICIAR BOT
// ─────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);
