import { getJson } from '../../lib/functions.js'

// SOLO endpoints SFW. Nunca se usan categorias nsfw.
const CATEGORIAS = ['waifu', 'neko', 'shinobu', 'megumin', 'awoo']

export default {
  command: ['waifu', 'neko', 'animepic'],
  category: 'anime',
  desc: 'Imagen aleatoria de anime (contenido apto para todos)',
  async run({ sock, m, command }) {
    await m.react('🎀')
    const cat = CATEGORIAS.includes(command) ? command : 'waifu'
    // El "sfw" de la ruta es obligatorio: garantiza contenido apto.
    const d = await getJson(`https://api.waifu.pics/sfw/${cat}`)
    if (!d?.url) return m.reply('❌ No pude obtener la imagen, intenta de nuevo.')
    await sock.sendMessage(m.chat, { image: { url: d.url }, caption: `🎌 Imagen aleatoria de anime (SFW)` }, { quoted: m })
  }
}
