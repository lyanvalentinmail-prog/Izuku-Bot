import { getBuffer } from '../../lib/functions.js'
export default {
  command: ['attp', 'textsticker'],
  category: 'stickers',
  desc: 'Sticker animado con tu texto',
  async run({ sock, m, text, usedPrefix, command }) {
    const t = text || m.quoted?.text
    if (!t) return m.reply(`✍️ Uso: *${usedPrefix}${command} Hola*`)
    await m.react('⏳')
    const buf = await getBuffer(`https://api.dreaded.site/api/attp?text=${encodeURIComponent(t)}`)
    await sock.sendMessage(m.chat, { sticker: buf }, { quoted: m })
  }
}
