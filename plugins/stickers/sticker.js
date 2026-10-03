import config from '../../config.js'
import { createSticker } from '../../lib/sticker.js'

export default {
  command: ['s', 'sticker', 'stiker'],
  category: 'stickers',
  desc: 'Crea un sticker — uso: s Pack|Autor',
  async run({ sock, m, text, usedPrefix, command }) {
    const target = m.quoted && ['imageMessage', 'videoMessage'].includes(m.quoted.mtype) ? m.quoted : m
    if (!['imageMessage', 'videoMessage'].includes(target.mtype)) {
      return m.reply(
`🎨 Envía o responde a una *imagen* o *video (máx 8s)* con *${usedPrefix}${command}*

💡 Puedes poner tu propio pack y autor:
*${usedPrefix}${command} MiPack|MiNombre*`)
    }
    await m.react('⏳')
    const [pack, author] = text ? text.split('|') : []
    const buffer = await target.download()
    const sticker = await createSticker(
      buffer,
      target.mtype === 'videoMessage',
      pack?.trim() || config.botName,
      author?.trim() || m.pushName || config.ownerName
    )
    await sock.sendMessage(m.chat, { sticker }, { quoted: m })
    await m.react('✅')
  }
}
