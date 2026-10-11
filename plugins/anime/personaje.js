import { getJson } from '../../lib/functions.js'
export default {
  command: ['personaje', 'character'],
  category: 'anime',
  desc: 'Información de un personaje de anime',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!text) return m.reply(`👤 Uso: *${usedPrefix}${command} Izuku Midoriya*`)
    await m.react('🔎')
    const res = await getJson(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(text)}&limit=1`)
    const d = res.data?.[0]
    if (!d) return m.reply('❌ No encontré ese personaje.')
    const caption =
`👤 *${d.name}*
🈯 ${d.name_kanji || '—'}
${d.nicknames?.length ? `🏷️ Apodos: ${d.nicknames.join(', ')}\n` : ''}❤️ Favoritos: *${(d.favorites || 0).toLocaleString('es')}*

📖 ${(d.about || 'Sin descripción.').slice(0, 800)}

🔗 ${d.url}`
    try { await sock.sendMessage(m.chat, { image: { url: d.images.jpg.image_url }, caption }, { quoted: m }) }
    catch { await m.reply(caption) }
  }
}
