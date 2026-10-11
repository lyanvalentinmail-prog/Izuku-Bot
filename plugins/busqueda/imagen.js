import { getJson, random } from '../../lib/functions.js'
import axios from 'axios'
export default {
  command: ['imagen', 'image', 'img', 'pinterest'],
  category: 'busqueda',
  desc: 'Busca imágenes en internet',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🖼️ Uso: *${usedPrefix}${command} paisajes de montaña*`)
    await m.react('🖼️')
    const endpoints = [
      async () => (await getJson(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(text)}`))?.data?.map((x) => x.image_large_url || x.images_url),
      async () => (await getJson(`https://api.dreaded.site/api/pinterest?query=${encodeURIComponent(text)}`))?.result
    ]
    let images = []
    for (const fn of endpoints) { try { const r = await fn(); if (r?.length) { images = r; break } } catch {} }
    if (!images.length) return m.reply('❌ No encontré imágenes. Intenta con otra búsqueda.')
    for (const url of images.slice(0, 3)) {
      try {
        const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
        await sock.sendMessage(m.chat, { image: Buffer.from(data), caption: `🖼️ ${text}` }, { quoted: m })
      } catch {}
    }
  }
}
