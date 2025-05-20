const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = {
  name: "aa",
  description: "Muestra info de Discord y opcionalmente de Enka Network",
  async execute(message, args) {
    // Embed con info Discord decorado
    const discordEmbed = new EmbedBuilder()
      .setColor(randomColor())
      .setTitle(`🛡️ Información de Discord - ${message.author.tag}`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: "👤 Usuario", value: `${message.author}`, inline: true },
        { name: "🆔 ID", value: message.author.id, inline: true },
        {
          name: "📅 Creado el",
          value: `<t:${Math.floor(message.author.createdTimestamp / 1000)}:D>`,
          inline: true,
        },
        { name: "💬 Nombre de usuario", value: message.author.username, inline: true },
        { name: "🔢 Discriminador", value: `#${message.author.discriminator}`, inline: true },
        { name: "🤖 ¿Bot?", value: message.author.bot ? "Sí" : "No", inline: true },
        {
          name: "🖼️ Avatar URL",
          value: `[Haz clic aquí](${message.author.displayAvatarURL({ dynamic: true, size: 512 })})`,
          inline: false,
        },
      )
      .setFooter({ text: "Reacciona ▶️ para ver tu info de Enka Network" })
      .setTimestamp();

    const msg = await message.channel.send({ embeds: [discordEmbed] });
    await msg.react("▶️");

    const filter = (reaction, user) =>
      reaction.emoji.name === "▶️" && user.id === message.author.id;

    try {
      const collected = await msg.awaitReactions({
        filter,
        max: 1,
        time: 30000,
        errors: ["time"],
      });
      const reaction = collected.first();

      if (reaction.emoji.name === "▶️") {
        await message.channel.send(
          `${message.author}, envía tu UID (9 dígitos) o link de perfil Enka Network en 30 segundos.`
        );

        const msgFilter = (m) =>
          m.author.id === message.author.id &&
          (/^\d{9}$/.test(m.content.trim()) ||
            m.content.startsWith("https://enka.network/u/"));

        const collectedMsg = await message.channel.awaitMessages({
          filter: msgFilter,
          max: 1,
          time: 30000,
          errors: ["time"],
        });
        const input = collectedMsg.first().content.trim();

        let uid;
        if (input.startsWith("https://enka.network/u/")) {
          const match = input.match(/enka\.network\/u\/(\d{9})/);
          uid = match ? match[1] : null;
        } else if (/^\d{9}$/.test(input)) {
          uid = input;
        } else {
          uid = null;
        }

        if (!uid || uid === "000000000") {
          return message.channel.send(
            "❌ UID inválido o no tiene 9 dígitos válidos. Usa el comando de nuevo."
          );
        }

        const enkaData = await getEnkaInfo(uid);

        if (!enkaData) {
          return message.channel.send(
            "❌ No se pudo obtener la información del perfil Enka."
          );
        }

        // Embed con info Enka decorado
        const enkaEmbed = new EmbedBuilder()
          .setColor(randomColor())
          .setTitle(`🕹️ Info Enka Network - ${enkaData.username || "Usuario"}`)
          .setThumbnail(enkaData.avatar || null)
          .addFields(
            {
              name: "👤 Usuario Enka",
              value: enkaData.username || "No encontrado",
              inline: true,
            },
            {
              name: "🆔 UID",
              value: enkaData.uid || "No disponible",
              inline: true,
            },
            {
              name: "📝 Descripción",
              value: enkaData.description || "No disponible",
              inline: false,
            },
            {
              name: "🧙 Personajes mostrados",
              value: `${enkaData.characterImages.length}`,
              inline: true,
            },
            {
              name: "🌀 Espiral del Abismo",
              value: enkaData.abyss || "No disponible",
              inline: true,
            },
            {
              name: "🏆 Logros",
              value: enkaData.achievements || "No disponible",
              inline: true,
            },
            {
              name: "🎭 Teatro",
              value: enkaData.theater || "No disponible",
              inline: true,
            }
          )
          .setTimestamp();

        await message.channel.send({ embeds: [enkaEmbed] });

        if (enkaData.characterImages && enkaData.characterImages.length > 0) {
          const images = enkaData.characterImages.slice(0, 20);
          let currentPage = 0;

          const imageEmbeds = images.map((url, index) =>
            new EmbedBuilder()
              .setColor(randomColor())
              .setTitle(`🖼️ Imagen ${index + 1} de ${images.length} - Personaje`)
              .setImage(url)
              .setFooter({ text: `Página ${index + 1}/${images.length}` })
          );

          const imageMsg = await message.channel.send({
            embeds: [imageEmbeds[currentPage]],
          });

          await imageMsg.react("◀️");
          await imageMsg.react("▶️");

          const reactionFilter = (reaction, user) =>
            ["◀️", "▶️"].includes(reaction.emoji.name) &&
            user.id === message.author.id;

          const collector = imageMsg.createReactionCollector({
            filter: reactionFilter,
            time: 60000,
          });

          collector.on("collect", async (reaction, user) => {
            if (reaction.emoji.name === "▶️") {
              currentPage = (currentPage + 1) % imageEmbeds.length;
            } else if (reaction.emoji.name === "◀️") {
              currentPage =
                (currentPage - 1 + imageEmbeds.length) % imageEmbeds.length;
            }

            await imageMsg.edit({ embeds: [imageEmbeds[currentPage]] });

            try {
              await reaction.users.remove(user.id);
            } catch {}

          });

          collector.on("end", async () => {
            try {
              await imageMsg.reactions.removeAll();
              await msg.reactions.removeAll();
              await msg.react("▶️");
            } catch {}
          });
        } else {
          try {
            await msg.reactions.removeAll();
            await msg.react("▶️");
          } catch {}
        }
      }
    } catch (error) {
      if (error.message === "time") {
        return message.channel.send(
          "⏰ No reaccionaste a tiempo o no enviaste UID válido."
        );
      }
      console.error("Error en comando aa:", error);
      return message.channel.send("❌ Ocurrió un error inesperado.");
    }
  },
};

async function getEnkaInfo(input) {
  try {
    let url = input;
    if (!input.startsWith("http")) {
      url = "https://enka.network/u/" + input;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    const username = $(".PlayerInfo .details h1").first().text().trim() || null;
    const description =
      $(".PlayerInfo .details .signature").first().text().trim() || null;
    const uidMatch = url.match(/\/u\/(\d{9})/);
    const uid = uidMatch ? uidMatch[1] : null;

    let avatar = $(".PlayerInfo .avatar-icon img").attr("src") || null;
    if (avatar && !avatar.startsWith("http")) {
      avatar = "https://enka.network" + avatar;
    }

    const characterImages = [];
    $(".CharacterList .avatar figure.chara").each((i, el) => {
      let style = $(el).attr("style");
      const match = style.match(/url\(([^)]+)\)/);
      if (match) {
        let src = match[1].replace(/["']/g, "");
        if (src && !src.startsWith("http")) {
          src = "https://enka.network" + src;
        }
        characterImages.push(src);
      }
    });

    let achievements = null;
    let abyss = null;
    let theater = null;

    $("tr.stat.svelte-1dtsens").each((i, el) => {
      const iconStyle = $(el).find("td.icon.svelte-1dtsens").attr("style") || "";

      if (iconStyle.includes("/img/achievements.png")) {
        achievements = $(el).find("td.svelte-1dtsens").first().text().trim() || null;
      } else if (iconStyle.includes("/img/abyss.png")) {
        abyss = $(el).find("td.svelte-1dtsens").first().text().trim() || null;
      } else if (iconStyle.includes("/img/theater.png")) {
        theater = $(el).find("td.svelte-1dtsens").first().text().trim() || null;
      }
    });

    return {
      username,
      uid,
      description,
      avatar,
      characterImages,
      achievements,
      abyss,
      theater,
    };
  } catch (error) {
    console.error("Error en getEnkaInfo:", error);
    return null;
  }
}

function randomColor() {
  const hex = Math.floor(Math.random() * 16777215).toString(16);
  return "#" + hex.padStart(6, "0");
}
