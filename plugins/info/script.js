import config from '../../config.js'
export default {
  command: ['script', 'sc', 'repo'],
  category: 'info',
  desc: 'Código fuente del bot',
  async run({ m }) {
    await m.reply(`📦 *${config.botName}*\n\nHecho con Node.js + Baileys.\nRepositorio: https://github.com/lyanvalentinmail-prog/Izuku-Bot\n\n⭐ ¡Deja una estrella si te gusta!`)
  }
}
