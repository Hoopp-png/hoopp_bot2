const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

module.exports = {
    name: 'userinfo',
    description: 'Muestra info de Discord y opcionalmente de Enka Network',
    async execute(message, args) {
        const askEmbed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('¿Tienes perfil de Enka Network?')
            .setDescription('Reacciona con ✅ para sí, ❌ para no.');

        const msg = await message.channel.send({ embeds: [askEmbed] });

        await msg.react('✅');
        await msg.react('❌');

        const filter = (reaction, user) => {
            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        };

        msg.awaitReactions({ filter, max: 1, time: 30000, errors: ['time'] })
            .then(async collected => {
                const reaction = collected.first();

                if (reaction.emoji.name === '❌') {
                    const embedDiscord = new EmbedBuilder()
                        .setColor('Random')
                        .setTitle(`Información de Discord de ${message.author.tag}`)
                        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                        .addFields(
                            { name: 'Usuario', value: `${message.author}`, inline: true },
                            { name: 'ID', value: message.author.id, inline: true },
                            { name: 'Creado el', value: message.author.createdAt.toDateString(), inline: false }
                        );
                    await message.channel.send({ embeds: [embedDiscord] });

                } else if (reaction.emoji.name === '✅') {
                    const promptMsg = await message.channel.send(`${message.author}, envía tu UID o link de perfil Enka Network (ejemplo: https://enka.network/u/UID) en 30 segundos.`);

                    const msgFilter = m => m.author.id === message.author.id && (m.content.match(/^\d+$/) || m.content.startsWith('https://enka.network/u/'));

                    try {
                        const collectedMsg = await message.channel.awaitMessages({ filter: msgFilter, max: 1, time: 30000, errors: ['time'] });
                        let input = collectedMsg.first().content.trim();

                        let uid;
                        if (input.startsWith('https://enka.network/u/')) {
                            const match = input.match(/enka\.network\/u\/(\d+)/);
                            uid = match ? match[1] : null;
                        } else if (/^\d+$/.test(input)) {
                            uid = input;
                        } else {
                            uid = null;
                        }

                        if (!uid) {
                            return message.channel.send('UID inválido. Usa el comando de nuevo.');
                        }

                        const enkaData = await getEnkaInfo(uid);

                        const embedEnka = new EmbedBuilder()
                            .setColor('Random')
                            .setTitle(`Información de ${message.author.tag}`)
                            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                            .addFields(
                                { name: 'Usuario Discord', value: `${message.author}`, inline: true },
                                { name: 'ID Discord', value: message.author.id, inline: true },
                                { name: 'Creado el', value: message.author.createdAt.toDateString(), inline: false }
                            );

                        if (enkaData) {
                            embedEnka.addFields(
                                { name: 'Enka Usuario', value: enkaData.username || 'No encontrado', inline: true },
                                { name: 'Enka UID', value: enkaData.uid || 'No disponible', inline: true },
                                { name: 'Descripción', value: enkaData.description || 'No disponible', inline: false }
                            );

                            if (enkaData.avatar) embedEnka.setImage(enkaData.avatar);
                            await message.channel.send({ embeds: [embedEnka] });

                            // Mostrar imágenes de personajes (hasta 8)
                            if (enkaData.characterImages && enkaData.characterImages.length > 0) {
                                const attachments = enkaData.characterImages.slice(0, 8).map((url, index) => new AttachmentBuilder(url, { name: `char${index}.png` }));
                                for (const attachment of attachments) {
                                    await message.channel.send({ files: [attachment] });
                                }
                            }
                        } else {
                            embedEnka.addFields({ name: 'Enka', value: 'No se pudo obtener la información del perfil.' });
                            await message.channel.send({ embeds: [embedEnka] });
                        }

                    } catch (e) {
                        await message.channel.send('No se recibió un UID válido a tiempo. Mostrando solo info de Discord.');

                        const embedDiscord = new EmbedBuilder()
                            .setColor('Random')
                            .setTitle(`Información de Discord de ${message.author.tag}`)
                            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                            .addFields(
                                { name: 'Usuario', value: `${message.author}`, inline: true },
                                { name: 'ID', value: message.author.id, inline: true },
                                { name: 'Creado el', value: message.author.createdAt.toDateString(), inline: false }
                            );
                        await message.channel.send({ embeds: [embedDiscord] });
                    }
                }
            })
            .catch(async () => {
                await message.channel.send('No se recibió reacción a tiempo. Usa el comando de nuevo si quieres.');
            });
    }
};

async function getEnkaInfo(input) {
    try {
        let url = input;
        if (!input.startsWith('http')) {
            url = 'https://enka.network/u/' + input;
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml'
            }
        });

        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        const username = $('.PlayerInfo .details h1').first().text().trim() || null;
        const description = $('.PlayerInfo .details .signature').first().text().trim() || null;
        const uidMatch = url.match(/\/u\/(\d+)/);
        const uid = uidMatch ? uidMatch[1] : null;
        let avatar = $('.PlayerInfo .avatar-icon img').attr('src') || null;
        if (avatar && !avatar.startsWith('http')) {
            avatar = 'https://enka.network' + avatar;
        }

        // Obtener imágenes de personajes
        const characterImages = [];
        $('.CharacterPreview-box img').each((i, el) => {
            let src = $(el).attr('src');
            if (src && !src.startsWith('http')) {
                src = 'https://enka.network' + src;
            }
            if (src) characterImages.push(src);
        });

        return { username, uid, description, avatar, characterImages };

    } catch (error) {
        console.error('Error en getEnkaInfo:', error);
        return null;
    }
}
