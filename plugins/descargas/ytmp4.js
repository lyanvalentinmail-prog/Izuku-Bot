import { getBuffer } from '../../lib/functions.js'
import { ytdl, ytSearch } from '../../lib/downloader.js'

export default {
  command: ['playvid', 'ytmp4', 'video'],
  category: 'descargas',
  desc: 'Descarga un video de YouTube',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🎬 Uso: *${usedPrefix}${command} nombre o enlace*`)
    await m.react('⏳')
    const isUrl = /youtu\.?be/.test(text)
    const video = isUrl ? { url: text, title: 'video' } : (await ytSearch(text, 1))[0]
    if (!video) return m.reply('❌ No encontré resultados.')
    const link = await ytdl(video.url, 'video')
    await sock.sendMessage(m.chat, {
      video: await getBuffer(link),
      caption: `🎬 *${video.title}*\n🔗 ${video.url}`
    }, { quoted: m })
    await m.react('✅')
  }
}
