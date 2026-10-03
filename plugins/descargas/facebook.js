import { getBuffer } from '../../lib/functions.js'
import { fbdl } from '../../lib/downloader.js'
export default {
  command: ['fb', 'facebook', 'fbdl'],
  category: 'descargas',
  desc: 'Descarga videos de Facebook',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!/facebook\.com|fb\.watch/.test(text)) return m.reply(`📘 Uso: *${usedPrefix}${command} https://fb.watch/xxxx*`)
    await m.react('⏳')
    const link = await fbdl(text)
    await sock.sendMessage(m.chat, { video: await getBuffer(link), caption: '📘 *Facebook descargado*' }, { quoted: m })
    await m.react('✅')
  }
}
