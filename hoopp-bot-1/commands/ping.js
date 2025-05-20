module.exports = {
  name: "ping",
  description: "Responde con pong",
  execute(message, args) {
    message.reply("Pong!");
  }
};