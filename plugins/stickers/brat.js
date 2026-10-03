import { getBuffer } from '../../lib/functions.js'
import { createSticker } from '../../lib/sticker.js'

export default {
  command: ['brat', 'textsticker2'],
  category: 'stickers',
  desc: 'Sticker estilo "brat" con tu texto',
  async run({ sock, m, text, usedPrefix, command }) {
    const t = text || m.quoted?.text
    if (!t) return m.reply(`💚 Uso: *${usedPrefix}${command} izuku*`)
    if (t.length > 60) return m.reply('⚠️ Máximo 60 caracteres.')
    await m.react('⏳')
    const intentos = [
      `https://aqul-brat.hf.space/?text=${encodeURIComponent(t)}`,
      `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(t)}`
    ]
    for (const url of intentos) {
      try {
        const buf = await getBuffer(url)
        if (buf?.length > 1000) {
          await sock.sendMessage(m.chat, { sticker: await createSticker(buf) }, { quoted: m })
          return m.react('✅')
        }
      } catch {}
    }
    await m.reply('❌ El servicio no respondió, inténtalo más tarde.')
  }
}
