import { getBuffer } from '../../lib/functions.js'
import { tiktokdl } from '../../lib/downloader.js'
export default {
  command: ['tiktok', 'tt', 'ttdl'],
  category: 'descargas',
  desc: 'Descarga videos de TikTok sin marca de agua',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!/tiktok\.com|vm\.tiktok/.test(text)) return m.reply(`📱 Uso: *${usedPrefix}${command} https://vm.tiktok.com/xxxx*`)
    await m.react('⏳')
    const link = await tiktokdl(text)
    await sock.sendMessage(m.chat, { video: await getBuffer(link), caption: '📱 *TikTok descargado*' }, { quoted: m })
    await m.react('✅')
  }
}
