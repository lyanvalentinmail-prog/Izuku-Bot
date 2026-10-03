import { getJson, formatSize } from '../../lib/functions.js'
import axios from 'axios'

export default {
  command: ['mediafire', 'mf'],
  category: 'descargas',
  desc: 'Descarga archivos de MediaFire',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!/mediafire\.com/.test(text)) return m.reply(`📁 Uso: *${usedPrefix}${command} https://www.mediafire.com/file/...*`)
    await m.react('⏳')

    // Scraping simple del enlace de descarga directa
    const { data: html } = await axios.get(text, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 60000 })
    const link = html.match(/href="(https:\/\/download[^"]+)"/)?.[1]
    const nombre = html.match(/<div class="filename">([^<]+)<\/div>/)?.[1] ||
                   html.match(/aria-label="Download file"[^>]*>\s*<span[^>]*>([^<]+)/)?.[1] || 'archivo'
    if (!link) return m.reply('❌ No pude obtener el enlace directo. Puede que el archivo esté protegido.')

    const { headers } = await axios.head(link).catch(() => ({ headers: {} }))
    const peso = parseInt(headers['content-length'] || 0)
    if (peso > 100 * 1024 * 1024) {
      return m.reply(`📁 *${nombre}*\n📦 ${formatSize(peso)}\n\n⚠️ Es muy pesado para enviarlo por WhatsApp.\n🔗 Descárgalo tú:\n${link}`)
    }

    const { data } = await axios.get(link, { responseType: 'arraybuffer', timeout: 180000 })
    await sock.sendMessage(m.chat, {
      document: Buffer.from(data),
      fileName: nombre.trim(),
      mimetype: headers['content-type'] || 'application/octet-stream',
      caption: `📁 *${nombre.trim()}*\n📦 ${formatSize(peso)}`
    }, { quoted: m })
    await m.react('✅')
  }
}
