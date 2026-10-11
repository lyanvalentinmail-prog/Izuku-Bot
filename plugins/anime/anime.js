import { getJson } from '../../lib/functions.js'
import { apiCache } from '../../lib/cache.js'

export default {
  command: ['anime', 'manga'],
  category: 'anime',
  desc: 'Ficha de un anime o manga (MyAnimeList)',
  async run({ sock, m, text, command, usedPrefix }) {
    if (!text) return m.reply(`🎌 Uso: *${usedPrefix}${command} My Hero Academia*`)
    await m.react('🔎')
    const key = `${command}:${text.toLowerCase()}`
    let d = apiCache.get(key)
    if (!d) {
      const res = await getJson(`https://api.jikan.moe/v4/${command}?q=${encodeURIComponent(text)}&limit=1&sfw=true`)
      d = res.data?.[0]
      if (d) apiCache.set(key, d)
    }
    if (!d) return m.reply('❌ No encontré nada con ese nombre.')

    const caption =
`╭━━〔 🎌 *${d.title}* 〕━━⬣
┃ 🈯 ${d.title_japanese || '—'}
╰━━━━━━━━━━━━━━━━⬣

⭐ Puntuación: *${d.score || '—'}/10* (${(d.scored_by || 0).toLocaleString('es')} votos)
🏆 Ranking: *#${d.rank || '—'}*  💖 Popularidad: *#${d.popularity || '—'}*
📺 Tipo: *${d.type || '—'}*  ${command === 'anime' ? `🎬 Episodios: *${d.episodes || '?'}*` : `📚 Capítulos: *${d.chapters || '?'}*`}
📡 Estado: *${d.status || '—'}*
📅 ${d.aired?.string || d.published?.string || '—'}
🏷️ ${(d.genres || []).map((g) => g.name).join(', ') || '—'}

📖 *Sinopsis:*
${(d.synopsis || 'Sin sinopsis.').slice(0, 700)}${(d.synopsis || '').length > 700 ? '...' : ''}

🔗 ${d.url}`

    try {
      await sock.sendMessage(m.chat, { image: { url: d.images.jpg.large_image_url }, caption }, { quoted: m })
    } catch { await m.reply(caption) }
  }
}
