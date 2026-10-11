import { getJson } from '../../lib/functions.js'

export default {
  command: ['gif', 'tenor'],
  category: 'busqueda',
  desc: 'Busca un GIF',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🎞️ Uso: *${usedPrefix}${command} gato bailando*`)
    await m.react('🎞️')
    const d = await getJson(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(text)}&key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&limit=8&contentfilter=high&media_filter=mp4`).catch(() => null)
    const lista = d?.results?.filter((r) => r.media_formats?.mp4?.url)
    if (!lista?.length) return m.reply('❌ No encontré GIFs de eso (o el buscador no responde ahora mismo).')
    const elegido = lista[Math.floor(Math.random() * lista.length)]
    await sock.sendMessage(m.chat, {
      video: { url: elegido.media_formats.mp4.url },
      gifPlayback: true,
      caption: `🎞️ ${text}`
    }, { quoted: m })
  }
}
