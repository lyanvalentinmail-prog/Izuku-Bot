import { toSticker } from '../../lib/functions.js'
import config from '../../config.js'

export default {
  command: ['s', 'sticker', 'stiker'],
  category: 'stickers',
  desc: 'Crea un sticker con una imagen o video',
  async run({ sock, m, usedPrefix, command }) {
    const target = m.quoted && ['imageMessage', 'videoMessage'].includes(m.quoted.mtype) ? m.quoted : m
    if (!['imageMessage', 'videoMessage'].includes(target.mtype)) {
      return m.reply(`🎨 Envía o responde a una *imagen* o *video (máx 8s)* con *${usedPrefix}${command}*`)
    }
    await m.react('⏳')
    const buffer = await target.download()
    const webp = await toSticker(buffer, target.mtype === 'videoMessage')
    await sock.sendMessage(m.chat, { sticker: webp }, { quoted: m })
    await m.react('✅')
  }
}
