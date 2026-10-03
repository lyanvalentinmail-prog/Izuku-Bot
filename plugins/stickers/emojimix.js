import { getBuffer, getJson } from '../../lib/functions.js'
import { createSticker } from '../../lib/sticker.js'
export default {
  command: ['emojimix', 'mixemoji'],
  category: 'stickers',
  desc: 'Mezcla dos emojis — uso: emojimix 😂+😭',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!text.includes('+')) return m.reply(`😀 Uso: *${usedPrefix}${command} 😂+😭*`)
    const [a, b] = text.split('+').map((x) => x.trim())
    const data = await getJson(`https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(a)}_${encodeURIComponent(b)}`)
    if (!data.results?.length) return m.reply('❌ Esa combinación de emojis no existe.')
    const img = await getBuffer(data.results[0].url)
    await sock.sendMessage(m.chat, { sticker: await createSticker(img) }, { quoted: m })
  }
}
