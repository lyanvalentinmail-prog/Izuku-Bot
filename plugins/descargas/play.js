import { getBuffer } from '../../lib/functions.js'
import { ytdl, ytSearch } from '../../lib/downloader.js'

export default {
  command: ['play', 'ytmp3', 'musica'],
  category: 'descargas',
  desc: 'Descarga música de YouTube por nombre o enlace',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🎵 Uso: *${usedPrefix}${command} nombre de la canción*`)
    await m.react('⏳')

    const isUrl = /youtu\.?be/.test(text)
    const video = isUrl ? { url: text, title: text } : (await ytSearch(text, 1))[0]
    if (!video) return m.reply('❌ No encontré resultados.')

    if (video.thumbnail) {
      await sock.sendMessage(m.chat, {
        image: { url: video.thumbnail },
        caption: `🎵 *${video.title}*\n👤 ${video.author}\n⏱️ ${video.duration}\n👁️ ${video.views}\n🔗 ${video.url}\n\n_Descargando audio..._`
      }, { quoted: m })
    }

    const link = await ytdl(video.url, 'audio')
    const buffer = await getBuffer(link)
    await sock.sendMessage(m.chat, {
      audio: buffer,
      mimetype: 'audio/mpeg',
      fileName: `${video.title}.mp3`
    }, { quoted: m })
    await m.react('✅')
  }
}
