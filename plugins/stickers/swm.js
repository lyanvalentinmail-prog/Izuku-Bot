import { toSticker } from '../../lib/functions.js'
export default {
  command: ['swm', 'take', 'renombrarsticker'],
  category: 'stickers',
  desc: 'Cambia el pack/autor de un sticker',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!m.quoted || m.quoted.mtype !== 'stickerMessage') return m.reply(`🏷️ Responde a un sticker con *${usedPrefix}${command} Pack|Autor*`)
    const buffer = await m.quoted.download()
    await sock.sendMessage(m.chat, { sticker: buffer }, { quoted: m })
  }
}
