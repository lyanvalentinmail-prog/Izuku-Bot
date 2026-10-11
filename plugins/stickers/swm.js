import config from '../../config.js'
import { writeExif } from '../../lib/sticker.js'

export default {
  command: ['swm', 'take', 'renombrarsticker'],
  category: 'stickers',
  desc: 'Cambia el pack/autor de un sticker — uso: swm Pack|Autor',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!m.quoted || m.quoted.mtype !== 'stickerMessage') {
      return m.reply(`🏷️ Responde a un sticker con:\n*${usedPrefix}${command} MiPack|MiNombre*`)
    }
    await m.react('⏳')
    const [pack, author] = (text || '').split('|')
    const buffer = await m.quoted.download()
    const sticker = await writeExif(
      buffer,
      pack?.trim() || config.botName,
      author?.trim() || m.pushName || config.ownerName
    )
    await sock.sendMessage(m.chat, { sticker }, { quoted: m })
    await m.react('✅')
  }
}
