import { getBuffer } from '../../lib/functions.js'
import { igdl } from '../../lib/downloader.js'
export default {
  command: ['ig', 'instagram', 'igdl'],
  category: 'descargas',
  desc: 'Descarga videos/fotos de Instagram',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!/instagram\.com/.test(text)) return m.reply(`📷 Uso: *${usedPrefix}${command} https://instagram.com/p/xxxx*`)
    await m.react('⏳')
    const link = await igdl(text)
    const buf = await getBuffer(link)
    await sock.sendFile(m.chat, buf, '', '📷 *Instagram descargado*', m)
    await m.react('✅')
  }
}
